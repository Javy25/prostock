package cl.prostock.orders;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public final class OrderDtos {
    private OrderDtos() {}

    public record CreateOrderRequest(
        @NotNull @Positive Long usuarioId,
        @NotEmpty List<@Valid OrderItemRequest> items,
        @NotNull @Valid ShippingRequest despacho
    ) {}

    public record OrderItemRequest(
        @NotNull @Positive Long productoId,
        @NotBlank String codigo,
        @NotBlank String nombre,
        String imagen,
        @Min(1) int cantidad,
        @NotNull @Positive BigDecimal precioNeto
    ) {}

    public record ShippingRequest(
        @NotBlank String nombre,
        @NotBlank String telefono,
        @NotBlank String direccion,
        @NotBlank String comuna,
        @NotBlank String region,
        String observaciones
    ) {}

    public record OrderItemResponse(
        Long id, Long productoId, String codigo, String nombre, String imagen,
        int cantidad, BigDecimal precio, BigDecimal precioConIva, BigDecimal totalLinea
    ) {
        static OrderItemResponse from(OrderItem item) {
            return new OrderItemResponse(item.getId(), item.getProductoId(), item.getCodigo(),
                item.getNombre(), item.getImagen(), item.getCantidad(), item.getPrecio(),
                item.getPrecioConIva(), item.getTotalLinea());
        }
    }

    public record OrderResponse(
        Long id, Long usuarioId, String estado, BigDecimal subtotal, BigDecimal iva,
        BigDecimal total, OffsetDateTime createdAt, ShippingRequest despacho,
        List<OrderItemResponse> items
    ) {
        static OrderResponse from(PurchaseOrder order) {
            ShippingRequest shipping = new ShippingRequest(order.getNombreDespacho(),
                order.getTelefonoDespacho(), order.getDireccionDespacho(),
                order.getComunaDespacho(), order.getRegionDespacho(), order.getObservacionesDespacho());
            return new OrderResponse(order.getId(), order.getUsuarioId(), order.getEstado(),
                order.getSubtotal(), order.getIva(), order.getTotal(), order.getCreatedAt(),
                shipping, order.getItems().stream().map(OrderItemResponse::from).toList());
        }
    }
}
