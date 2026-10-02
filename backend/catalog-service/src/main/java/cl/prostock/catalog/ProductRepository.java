package cl.prostock.catalog;

import java.util.Optional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByCodigoIgnoreCase(String codigo);

    @Modifying
    @Transactional
    @Query("update Product p set p.stock = p.stock - :quantity where p.id = :id and p.stock >= :quantity")
    int reserveStock(@Param("id") Long id, @Param("quantity") int quantity);

    @Modifying
    @Transactional
    @Query("update Product p set p.stock = p.stock + :quantity where p.id = :id")
    int releaseStock(@Param("id") Long id, @Param("quantity") int quantity);
}
