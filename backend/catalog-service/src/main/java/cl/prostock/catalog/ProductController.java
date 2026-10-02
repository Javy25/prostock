package cl.prostock.catalog;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.math.BigDecimal;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductRepository products;

    public ProductController(ProductRepository products) {
        this.products = products;
    }

    public record ProductRequest(
        @NotBlank String codigo,
        @NotBlank String nombre,
        @NotBlank String categoria,
        @NotNull @DecimalMin("0.01") BigDecimal precio,
        @Min(0) int stock,
        String imagen,
        List<@NotBlank String> imagenes
    ) {}

    @GetMapping
    public List<Product> list() {
        return products.findAll();
    }

    @GetMapping("/{id}")
    public Product get(@PathVariable("id") Long id) {
        return products.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Product create(@Valid @RequestBody ProductRequest input) {
        if (products.findByCodigoIgnoreCase(input.codigo()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El código del producto ya existe");
        }
        Product product = new Product();
        product.update(toProduct(input));
        return products.save(product);
    }

    @PutMapping("/{id}")
    public Product update(@PathVariable("id") Long id, @Valid @RequestBody ProductRequest input) {
        Product product = get(id);
        products.findByCodigoIgnoreCase(input.codigo())
            .filter(existing -> !existing.getId().equals(id))
            .ifPresent(existing -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "El código del producto ya existe");
            });
        product.update(toProduct(input));
        return products.save(product);
    }

    private static Product toProduct(ProductRequest input) {
        Product product = new Product();
        product.setCodigo(input.codigo());
        product.setNombre(input.nombre());
        product.setCategoria(input.categoria());
        product.setPrecio(input.precio());
        product.setStock(input.stock());
        product.setImagen(input.imagen());
        product.setImagenes(input.imagenes());
        return product;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long id) {
        products.delete(get(id));
    }

    @PostMapping("/{id}/stock/reserve")
    public void reserveStock(@PathVariable("id") Long id, @RequestParam("quantity") int quantity) {
        if (quantity < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cantidad debe ser mayor que cero");
        }
        if (products.reserveStock(id, quantity) == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Producto inexistente o stock insuficiente");
        }
    }

    @PostMapping("/{id}/stock/release")
    public void releaseStock(@PathVariable("id") Long id, @RequestParam("quantity") int quantity) {
        if (quantity < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cantidad debe ser mayor que cero");
        }
        if (products.releaseStock(id, quantity) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado");
        }
    }
}
