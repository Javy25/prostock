package cl.prostock.gateway;

import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockJwt;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = "security.jwt-secret=integration-test-secret-must-be-at-least-32-bytes"
)
@AutoConfigureWebTestClient
class GatewayAuthorizationIntegrationTest {
    private static HttpServer downstream;

    @Autowired
    private WebTestClient client;

    @AfterAll
    static void stopDownstream() {
        if (downstream != null) downstream.stop(0);
    }

    @DynamicPropertySource
    static void downstreamUrls(DynamicPropertyRegistry properties) {
        startDownstream();
        int port = downstream.getAddress().getPort();
        String url = "http://127.0.0.1:" + port;
        properties.add("CATALOG_SERVICE_URL", () -> url);
        properties.add("IDENTITY_SERVICE_URL", () -> url);
        properties.add("ORDER_SERVICE_URL", () -> url);
        properties.add("CONTACT_SERVICE_URL", () -> url);
    }

    private static void startDownstream() {
        if (downstream != null) return;
        try {
            downstream = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            downstream.createContext("/", exchange -> {
                byte[] body = "forwarded".getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().add("Content-Type", "text/plain");
                exchange.sendResponseHeaders(200, body.length);
                try (var output = exchange.getResponseBody()) {
                    output.write(body);
                }
            });
            downstream.start();
        } catch (IOException exception) {
            throw new IllegalStateException("No se pudo iniciar el servidor downstream de pruebas.", exception);
        }
    }

    @Test
    void publicCatalogReadsAndContactSubmissionAreForwardedWithoutAuthentication() {
        client.get().uri("/api/products").exchange()
            .expectStatus().isOk()
            .expectBody(String.class).isEqualTo("forwarded");

        client.post().uri("/api/messages").bodyValue("{}").exchange()
            .expectStatus().isOk()
            .expectBody(String.class).isEqualTo("forwarded");
    }

    @Test
    void administratorCanUseProtectedRoutes() {
        client.mutateWith(mockJwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
            .post().uri("/api/products").bodyValue("{}").exchange()
            .expectStatus().isOk();

        client.mutateWith(mockJwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
            .get().uri("/api/users").exchange()
            .expectStatus().isOk();

        client.mutateWith(mockJwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
            .get().uri("/api/messages").exchange()
            .expectStatus().isOk();
    }

    @Test
    void customersCannotUseAdministratorRoutes() {
        client.mutateWith(mockJwt().authorities(new SimpleGrantedAuthority("ROLE_CLIENTE")))
            .post().uri("/api/products").bodyValue("{}").exchange()
            .expectStatus().isForbidden();

        client.mutateWith(mockJwt().authorities(new SimpleGrantedAuthority("ROLE_CLIENTE")))
            .get().uri("/api/users").exchange()
            .expectStatus().isForbidden();

        client.mutateWith(mockJwt().authorities(new SimpleGrantedAuthority("ROLE_CLIENTE")))
            .get().uri("/api/messages").exchange()
            .expectStatus().isForbidden();
    }

    @Test
    void stockReservationEndpointsRemainPrivateEvenForAdministrators() {
        client.mutateWith(mockJwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
            .post().uri("/api/products/1/stock/reserve?quantity=1").exchange()
            .expectStatus().isForbidden();

        client.mutateWith(mockJwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
            .post().uri("/api/products/1/stock/release?quantity=1").exchange()
            .expectStatus().isForbidden();
    }

    @Test
    void orderRoutesRequireAuthentication() {
        client.get().uri("/api/orders").exchange()
            .expectStatus().isUnauthorized();
    }
}
