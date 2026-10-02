package cl.prostock.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true, length = 40)
    private String codigo;

    @NotBlank
    @Column(nullable = false, length = 180)
    private String nombre;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String categoria;

    @NotNull
    @DecimalMin("0.01")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precio;

    @Min(0)
    @Column(nullable = false)
    private int stock;

    @Column(length = 1000)
    private String imagen;

    @ElementCollection
    @OrderColumn(name = "image_position")
    @Column(name = "image_url", nullable = false, length = 1000)
    private List<String> imagenes = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected Product() {}

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public String getCodigo() { return codigo; }
    public String getNombre() { return nombre; }
    public String getCategoria() { return categoria; }
    public BigDecimal getPrecio() { return precio; }
    public int getStock() { return stock; }
    public String getImagen() { return imagen; }
    public List<String> getImagenes() { return List.copyOf(imagenes); }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public void setPrecio(BigDecimal precio) { this.precio = precio; }
    public void setStock(int stock) { this.stock = stock; }
    public void setImagen(String imagen) { this.imagen = imagen; }
    public void setImagenes(List<String> imagenes) {
        this.imagenes.clear();
        if (imagenes != null) this.imagenes.addAll(imagenes);
    }

    public void update(Product input) {
        codigo = input.codigo;
        nombre = input.nombre;
        categoria = input.categoria;
        precio = input.precio;
        stock = input.stock;
        imagen = input.imagen;
        imagenes.clear();
        if (input.imagenes != null) imagenes.addAll(input.imagenes);
        if (imagenes.isEmpty() && imagen != null && !imagen.isBlank()) imagenes.add(imagen);
    }
}
