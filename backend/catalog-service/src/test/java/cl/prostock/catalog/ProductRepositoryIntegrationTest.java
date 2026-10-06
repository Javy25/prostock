package cl.prostock.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

@DataJpaTest
class ProductRepositoryIntegrationTest {
    @Autowired
    private ProductRepository products;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void reservationCannotOversellAndReleaseRestoresStock() {
        Product product = new Product();
        product.setCodigo("TEST-001");
        product.setNombre("Producto de prueba");
        product.setCategoria("Pruebas");
        product.setPrecio(new BigDecimal("1000.00"));
        product.setStock(10);
        Product saved = products.saveAndFlush(product);

        assertThat(products.reserveStock(saved.getId(), 6)).isEqualTo(1);
        assertThat(products.reserveStock(saved.getId(), 5)).isZero();
        entityManager.clear();
        assertThat(products.findById(saved.getId()).orElseThrow().getStock()).isEqualTo(4);

        assertThat(products.releaseStock(saved.getId(), 3)).isEqualTo(1);
        entityManager.clear();
        assertThat(products.findById(saved.getId()).orElseThrow().getStock()).isEqualTo(7);
    }

    @Test
    void reservationAndReleaseFailForMissingProducts() {
        assertThat(products.reserveStock(999L, 1)).isZero();
        assertThat(products.releaseStock(999L, 1)).isZero();
    }
}
