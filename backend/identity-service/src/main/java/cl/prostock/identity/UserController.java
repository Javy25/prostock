package cl.prostock.identity;

import static cl.prostock.identity.UserDtos.UserRequest;
import static cl.prostock.identity.UserDtos.UserResponse;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<UserResponse> list() {
        return users.findAll().stream().map(UserResponse::from).toList();
    }

    @GetMapping("/{id}")
    public UserResponse get(@PathVariable("id") Long id) {
        return UserResponse.from(findUser(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@Valid @RequestBody UserRequest request) {
        validateEmailDomain(request.email());
        if (request.password() == null || request.password().length() < 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña debe tener al menos 4 caracteres");
        }
        if (users.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya está registrado");
        }
        UserAccount user = new UserAccount();
        apply(user, request, true);
        return UserResponse.from(users.save(user));
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable("id") Long id, @Valid @RequestBody UserRequest request) {
        validateEmailDomain(request.email());
        UserAccount user = findUser(id);
        users.findByEmailIgnoreCase(request.email())
            .filter(existing -> !existing.getId().equals(id))
            .ifPresent(existing -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya está registrado");
            });
        apply(user, request, false);
        return UserResponse.from(users.save(user));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long id) {
        users.delete(findUser(id));
    }

    private UserAccount findUser(Long id) {
        return users.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    private void apply(UserAccount user, UserRequest request, boolean newUser) {
        user.setNombre(request.nombre().trim());
        user.setEmail(request.email().trim());
        user.setRun(request.run());
        user.setRegion(request.region());
        user.setComuna(request.comuna());
        user.setDireccion(request.direccion());
        user.setTelefono(request.telefono());
        user.setRol(request.rol() == null || request.rol().isBlank() ? "CLIENTE" : request.rol());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        } else if (newUser) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña es obligatoria");
        }
    }

    private void validateEmailDomain(String email) {
        String normalized = email.trim().toLowerCase(java.util.Locale.ROOT);
        if (!normalized.endsWith("@duoc.cl")
            && !normalized.endsWith("@profesor.duoc.cl")
            && !normalized.endsWith("@gmail.com")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "El correo debe ser @duoc.cl, @profesor.duoc.cl o @gmail.com");
        }
    }
}
