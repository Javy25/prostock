package cl.prostock.contact;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

public final class ContactDtos {
    private ContactDtos() {}

    public record MessageRequest(
        @NotBlank @Size(max = 160) String nombre,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(max = 180) String asunto,
        @NotBlank @Size(max = 5000) String mensaje
    ) {}

    public record MessageResponse(
        Long id, String nombre, String email, String asunto, String mensaje,
        boolean atendido, OffsetDateTime fecha
    ) {
        static MessageResponse from(ContactMessage message) {
            return new MessageResponse(message.getId(), message.getNombre(), message.getEmail(),
                message.getAsunto(), message.getMensaje(), message.isAtendido(), message.getFecha());
        }
    }

    public record AttendedRequest(boolean atendido) {}
}
