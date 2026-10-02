package cl.prostock.catalog;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

@Configuration
public class ProductSeed {
    @Bean
    CommandLineRunner seedProducts(ProductRepository products, ObjectMapper mapper) {
        return args -> {
            if (products.count() > 0) return;

            JsonNode seed;
            try (var input = new ClassPathResource("products-seed.json").getInputStream()) {
                seed = mapper.readTree(input);
            } catch (IOException exception) {
                throw new IllegalStateException("No se pudo leer el catálogo inicial.", exception);
            }
            if (!seed.isArray()) throw new IllegalStateException("El catálogo inicial debe ser una lista JSON.");

            List<Product> initialProducts = new ArrayList<>();
            for (JsonNode row : seed) {
                Product product = new Product();
                product.setCodigo(requiredText(row, "codigo"));
                product.setNombre(requiredText(row, "nombre"));
                product.setCategoria(requiredText(row, "categoria"));
                product.setPrecio(new BigDecimal(requiredText(row, "precio")));
                product.setStock(row.path("stock").asInt(-1));
                if (product.getStock() < 0) throw new IllegalStateException("El catálogo inicial contiene stock inválido.");
                product.setImagen(row.path("imagen").asText(""));
                List<String> images = new ArrayList<>();
                JsonNode imageList = row.path("imagenes");
                if (imageList.isArray()) imageList.forEach(image -> images.add(image.asText()));
                product.setImagenes(images);
                initialProducts.add(product);
            }
            products.saveAll(initialProducts);
        };
    }

    private static String requiredText(JsonNode row, String field) {
        JsonNode value = row.get(field);
        if (value == null || value.isNull() || value.asText().isBlank()) {
            throw new IllegalStateException("Falta el campo obligatorio '" + field + "' en el catálogo inicial.");
        }
        return value.asText();
    }
}
