package cl.prostock.orders;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private PurchaseOrder pedido;

    @Column(name = "product_id", nullable = false)
    private Long productoId;

    @Column(name = "product_code", nullable = false, length = 40)
    private String codigo;

    @Column(name = "product_name", nullable = false, length = 180)
    private String nombre;

    @Column(name = "image_url", length = 1000)
    private String imagen;

    @Column(nullable = false)
    private int cantidad;

    @Column(name = "net_unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal precio;

    @Column(name = "gross_unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioConIva;

    @Column(name = "line_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalLinea;

    protected OrderItem() {}

    static OrderItem from(PurchaseOrder order, OrderDtos.OrderItemRequest request) {
        OrderItem item = new OrderItem();
        item.pedido = order;
        item.productoId = request.productoId();
        item.codigo = request.codigo().trim();
        item.nombre = request.nombre().trim();
        item.imagen = request.imagen();
        item.cantidad = request.cantidad();
        item.precio = request.precioNeto();
        item.precioConIva = request.precioNeto().multiply(new BigDecimal("1.19")).setScale(0, java.math.RoundingMode.HALF_UP);
        item.totalLinea = item.precioConIva.multiply(BigDecimal.valueOf(item.cantidad));
        return item;
    }

    public Long getId() { return id; }
    public Long getProductoId() { return productoId; }
    public String getCodigo() { return codigo; }
    public String getNombre() { return nombre; }
    public String getImagen() { return imagen; }
    public int getCantidad() { return cantidad; }
    public BigDecimal getPrecio() { return precio; }
    public BigDecimal getPrecioConIva() { return precioConIva; }
    public BigDecimal getTotalLinea() { return totalLinea; }
}
