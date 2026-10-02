package cl.prostock.orders;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class PurchaseOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long usuarioId;

    @Column(nullable = false, length = 30)
    private String estado;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal iva;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal total;

    @Column(name = "shipping_name", nullable = false, length = 160)
    private String nombreDespacho;

    @Column(name = "shipping_phone", nullable = false, length = 40)
    private String telefonoDespacho;

    @Column(name = "shipping_address", nullable = false, length = 240)
    private String direccionDespacho;

    @Column(name = "shipping_commune", nullable = false, length = 100)
    private String comunaDespacho;

    @Column(name = "shipping_region", nullable = false, length = 100)
    private String regionDespacho;

    @Column(name = "shipping_notes", length = 1000)
    private String observacionesDespacho;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<OrderItem> items = new ArrayList<>();

    protected PurchaseOrder() {}

    public static PurchaseOrder create(Long userId, OrderDtos.CreateOrderRequest request,
                                       BigDecimal subtotal, BigDecimal tax, BigDecimal total) {
        PurchaseOrder order = new PurchaseOrder();
        order.usuarioId = userId;
        order.estado = "Confirmado";
        order.subtotal = subtotal;
        order.iva = tax;
        order.total = total;
        order.nombreDespacho = request.despacho().nombre().trim();
        order.telefonoDespacho = request.despacho().telefono().trim();
        order.direccionDespacho = request.despacho().direccion().trim();
        order.comunaDespacho = request.despacho().comuna().trim();
        order.regionDespacho = request.despacho().region().trim();
        order.observacionesDespacho = request.despacho().observaciones();
        order.createdAt = OffsetDateTime.now();
        request.items().forEach(item -> order.items.add(OrderItem.from(order, item)));
        return order;
    }

    public Long getId() { return id; }
    public Long getUsuarioId() { return usuarioId; }
    public String getEstado() { return estado; }
    public BigDecimal getSubtotal() { return subtotal; }
    public BigDecimal getIva() { return iva; }
    public BigDecimal getTotal() { return total; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public List<OrderItem> getItems() { return List.copyOf(items); }
    public String getNombreDespacho() { return nombreDespacho; }
    public String getTelefonoDespacho() { return telefonoDespacho; }
    public String getDireccionDespacho() { return direccionDespacho; }
    public String getComunaDespacho() { return comunaDespacho; }
    public String getRegionDespacho() { return regionDespacho; }
    public String getObservacionesDespacho() { return observacionesDespacho; }
}
