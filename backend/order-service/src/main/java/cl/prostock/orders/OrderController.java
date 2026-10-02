package cl.prostock.orders;

import static cl.prostock.orders.OrderDtos.CreateOrderRequest;
import static cl.prostock.orders.OrderDtos.OrderResponse;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderRepository orders;
    private final CatalogClient catalog;

    public OrderController(OrderRepository orders, CatalogClient catalog) {
        this.orders = orders;
        this.catalog = catalog;
    }

    @GetMapping
    public List<OrderResponse> list(@RequestParam(name = "usuarioId", required = false) Long usuarioId, JwtAuthenticationToken authentication) {
        boolean isAdmin = authentication.getToken().getClaimAsString("role").equals("ADMIN");
        Long requesterId = authentication.getToken().getClaim("userId");
        if (isAdmin && usuarioId == null) {
            return orders.findAll().stream().map(OrderResponse::from).toList();
        }
        Long requestedId = usuarioId == null ? requesterId : usuarioId;
        if (!isAdmin && !requesterId.equals(requestedId)) throw new AccessDeniedException("No puedes consultar pedidos de otro usuario");
        List<PurchaseOrder> result = orders.findByUsuarioIdOrderByCreatedAtDesc(requestedId);
        return result.stream().map(OrderResponse::from).toList();
    }

    @GetMapping("/{id}")
    public OrderResponse get(@PathVariable("id") Long id, JwtAuthenticationToken authentication) {
        PurchaseOrder order = orders.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));
        boolean isAdmin = authentication.getToken().getClaimAsString("role").equals("ADMIN");
        Long requesterId = authentication.getToken().getClaim("userId");
        if (!isAdmin && !requesterId.equals(order.getUsuarioId())) throw new AccessDeniedException("No puedes consultar este pedido");
        return OrderResponse.from(order);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(@Valid @RequestBody CreateOrderRequest request, JwtAuthenticationToken authentication) {
        boolean isAdmin = authentication.getToken().getClaimAsString("role").equals("ADMIN");
        Long requesterId = authentication.getToken().getClaim("userId");
        if (!isAdmin && !requesterId.equals(request.usuarioId())) throw new AccessDeniedException("El pedido debe pertenecer al usuario autenticado");
        CatalogClient.Reservation reservation = catalog.reserve(request, authentication.getToken().getTokenValue());
        CreateOrderRequest trustedRequest = reservation.order();
        BigDecimal total = trustedRequest.items().stream()
            .map(item -> item.precioNeto().multiply(new BigDecimal("1.19"))
                .setScale(0, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(item.cantidad())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal subtotal = total.divide(new BigDecimal("1.19"), 0, java.math.RoundingMode.HALF_UP);
        BigDecimal tax = total.subtract(subtotal);
        try {
            PurchaseOrder order = orders.save(PurchaseOrder.create(trustedRequest.usuarioId(), trustedRequest, subtotal, tax, total));
            return OrderResponse.from(order);
        } catch (RuntimeException exception) {
            catalog.release(request, reservation.productIds(), authentication.getToken().getTokenValue());
            throw exception;
        }
    }
}
