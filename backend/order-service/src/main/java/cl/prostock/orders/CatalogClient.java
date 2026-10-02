package cl.prostock.orders;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Component
public class CatalogClient {
    private static final Logger log = LoggerFactory.getLogger(CatalogClient.class);
    private final RestClient client;

    public CatalogClient(RestClient.Builder builder,
                         @Value("${services.catalog-url:http://localhost:8081}") String catalogUrl) {
        client = builder.baseUrl(catalogUrl).build();
    }

    public Reservation reserve(OrderDtos.CreateOrderRequest order, String bearerToken) {
        List<Long> reserved = new ArrayList<>();
        List<OrderDtos.OrderItemRequest> trustedItems = new ArrayList<>();
        Set<Long> productIds = new HashSet<>();
        for (OrderDtos.OrderItemRequest item : order.items()) {
            if (!productIds.add(item.productoId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cada producto debe aparecer una sola vez");
            }
        }
        try {
            for (OrderDtos.OrderItemRequest item : order.items()) {
                ProductSnapshot product = client.get()
                    .uri("/api/products/{id}", item.productoId())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken)
                    .retrieve()
                    .body(ProductSnapshot.class);
                if (product == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "El catálogo devolvió un producto vacío");
                }
                client.post()
                    .uri("/api/products/{id}/stock/reserve?quantity={quantity}", item.productoId(), item.cantidad())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken)
                    .retrieve()
                    .toBodilessEntity();
                reserved.add(item.productoId());
                trustedItems.add(new OrderDtos.OrderItemRequest(product.id(), product.codigo(),
                    product.nombre(), product.imagen(), item.cantidad(), product.precio()));
            }
            return new Reservation(
                new OrderDtos.CreateOrderRequest(order.usuarioId(), trustedItems, order.despacho()),
                reserved
            );
        } catch (ResponseStatusException exception) {
            release(order, reserved, bearerToken);
            throw exception;
        } catch (RestClientResponseException exception) {
            release(order, reserved, bearerToken);
            HttpStatus status = exception.getStatusCode().is4xxClientError() ? HttpStatus.CONFLICT : HttpStatus.BAD_GATEWAY;
            throw new ResponseStatusException(status, "No se pudo reservar el inventario del pedido", exception);
        } catch (RuntimeException exception) {
            release(order, reserved, bearerToken);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "El catálogo no está disponible", exception);
        }
    }

    public record Reservation(OrderDtos.CreateOrderRequest order, List<Long> productIds) {}

    public record ProductSnapshot(Long id, String codigo, String nombre, String imagen, java.math.BigDecimal precio) {}

    public void release(OrderDtos.CreateOrderRequest order, List<Long> reserved, String bearerToken) {
        for (Long productId : reserved) {
            int quantity = order.items().stream()
                .filter(item -> item.productoId().equals(productId))
                .mapToInt(OrderDtos.OrderItemRequest::cantidad)
                .sum();
            try {
                client.post()
                    .uri("/api/products/{id}/stock/release?quantity={quantity}", productId, quantity)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken)
                    .retrieve()
                    .toBodilessEntity();
            } catch (RuntimeException exception) {
                log.error("Failed to compensate inventory reservation for product {}", productId, exception);
            }
        }
    }
}
