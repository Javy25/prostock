package cl.prostock.contact;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "contact_messages")
public class ContactMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String nombre;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(nullable = false, length = 180)
    private String asunto;

    @Column(nullable = false, length = 5000)
    private String mensaje;

    @Column(nullable = false)
    private boolean atendido;

    @Column(nullable = false)
    private OffsetDateTime fecha;

    protected ContactMessage() {}

    public static ContactMessage create(ContactDtos.MessageRequest request) {
        ContactMessage message = new ContactMessage();
        message.nombre = request.nombre().trim();
        message.email = request.email().trim().toLowerCase();
        message.asunto = request.asunto().trim();
        message.mensaje = request.mensaje().trim();
        message.atendido = false;
        message.fecha = OffsetDateTime.now();
        return message;
    }

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public String getEmail() { return email; }
    public String getAsunto() { return asunto; }
    public String getMensaje() { return mensaje; }
    public boolean isAtendido() { return atendido; }
    public OffsetDateTime getFecha() { return fecha; }
    public void setAtendido(boolean atendido) { this.atendido = atendido; }
}
