package cl.prostock.identity;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class UserDtos {
    private UserDtos() {}

    public record UserRequest(
        @NotBlank @Size(max = 160) String nombre,
        @NotBlank @Email @Size(max = 254) String email,
        @Size(min = 4, max = 72) String password,
        String run,
        String region,
        String comuna,
        String direccion,
        String telefono,
        @Pattern(regexp = "CLIENTE|ADMIN") String rol
    ) {}

    public record UserResponse(
        Long id,
        String nombre,
        String email,
        String run,
        String region,
        String comuna,
        String direccion,
        String telefono,
        String rol
    ) {
        static UserResponse from(UserAccount user) {
            return new UserResponse(user.getId(), user.getNombre(), user.getEmail(),
                user.getRun(), user.getRegion(), user.getComuna(), user.getDireccion(),
                user.getTelefono(), user.getRol());
        }
    }

    public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
    ) {}

    public record AuthResponse(String token, UserResponse user) {}
}
