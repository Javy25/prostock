package cl.prostock.orders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
    controllers = OrderController.class,
    properties = "security.jwt-secret=integration-test-secret-must-be-at-least-32-bytes"
)
@Import(OrderSecurityConfiguration.class)
class OrderAuthorizationIntegrationTest {
    @Autowired
    private MockMvc mvc;

    @Autowired
    private OrderController controller;

    @MockBean
    private OrderRepository orders;

    @MockBean
    private CatalogClient catalog;

    @Test
    void unauthenticatedOrderRequestsAreRejected() throws Exception {
        mvc.perform(get("/api/orders"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void customerCannotReadAnotherCustomersOrders() throws Exception {
        mvc.perform(get("/api/orders").param("usuarioId", "99")
                .with(jwt().jwt(token -> token.claim("role", "CLIENTE").claim("userId", 42L))))
            .andExpect(status().isForbidden());

        verify(orders, never()).findByUsuarioIdOrderByCreatedAtDesc(99L);
    }

    @Test
    void customerCannotCreateAnOrderForAnotherCustomer() throws Exception {
        mvc.perform(post("/api/orders")
                .with(jwt().jwt(token -> token.claim("role", "CLIENTE").claim("userId", 42L)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(validOrderJson(99, 1)))
            .andExpect(status().isForbidden());

        verify(catalog, never()).reserve(any(), anyString());
    }

    @Test
    void checkoutUsesCatalogPriceInsteadOfSubmittedPrice() throws Exception {
        OrderDtos.CreateOrderRequest trustedOrder = order(42, 1000, 2);
        given(catalog.reserve(any(), anyString()))
            .willReturn(new CatalogClient.Reservation(trustedOrder, List.of(7L)));
        given(orders.save(any(PurchaseOrder.class))).willAnswer(invocation -> invocation.getArgument(0));

        mvc.perform(post("/api/orders")
                .with(jwt().jwt(token -> token.claim("role", "CLIENTE").claim("userId", 42L)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(validOrderJson(42, 1)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.subtotal").value(2000))
            .andExpect(jsonPath("$.iva").value(380))
            .andExpect(jsonPath("$.total").value(2380))
            .andExpect(jsonPath("$.items[0].precio").value(1000));
    }

    @Test
    void persistenceFailureCompensatesReservedStock() throws Exception {
        OrderDtos.CreateOrderRequest trustedOrder = order(42, 1000, 2);
        given(catalog.reserve(any(), anyString()))
            .willReturn(new CatalogClient.Reservation(trustedOrder, List.of(7L)));
        given(orders.save(any(PurchaseOrder.class))).willThrow(new IllegalStateException("database unavailable"));

        Jwt token = Jwt.withTokenValue("test-token")
            .header("alg", "none")
            .claim("role", "CLIENTE")
            .claim("userId", 42L)
            .build();
        assertThatThrownBy(() -> controller.create(trustedOrder, new JwtAuthenticationToken(token)))
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("database unavailable");

        verify(catalog).release(any(), any(), anyString());
    }

    private static OrderDtos.CreateOrderRequest order(long userId, int netPrice, int quantity) {
        return new OrderDtos.CreateOrderRequest(userId,
            List.of(new OrderDtos.OrderItemRequest(7L, "CAT-007", "Producto catálogo", null,
                quantity, BigDecimal.valueOf(netPrice))),
            new OrderDtos.ShippingRequest("Cliente", "123456789", "Dirección 1",
                "Santiago", "Metropolitana", null));
    }

    private static String validOrderJson(long userId, int submittedNetPrice) {
        return """
            {
              "usuarioId": %d,
              "items": [{
                "productoId": 7,
                "codigo": "FAKE-PRICE",
                "nombre": "Precio manipulado",
                "cantidad": 2,
                "precioNeto": %d
              }],
              "despacho": {
                "nombre": "Cliente",
                "telefono": "123456789",
                "direccion": "Dirección 1",
                "comuna": "Santiago",
                "region": "Metropolitana"
              }
            }
            """.formatted(userId, submittedNetPrice);
    }
}
