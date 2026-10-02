package cl.prostock.identity;

import static cl.prostock.identity.UserDtos.LoginRequest;
import static cl.prostock.identity.UserDtos.AuthResponse;
import static cl.prostock.identity.UserDtos.UserRequest;
import static cl.prostock.identity.UserDtos.UserResponse;

import jakarta.validation.Valid;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final UserController userController;
    private final JwtEncoder jwtEncoder;

    public AuthController(UserRepository users, PasswordEncoder passwordEncoder,
                          UserController userController, JwtEncoder jwtEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.userController = userController;
        this.jwtEncoder = jwtEncoder;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody UserRequest request) {
        String email = request.email().trim().toLowerCase();
        if (!email.endsWith("@duoc.cl") && !email.endsWith("@profesor.duoc.cl") && !email.endsWith("@gmail.com")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "El correo debe ser @duoc.cl, @profesor.duoc.cl o @gmail.com");
        }
        UserRequest customerRequest = new UserRequest(request.nombre(), request.email(), request.password(),
            request.run(), request.region(), request.comuna(), request.direccion(), request.telefono(), "CLIENTE");
        UserResponse user = userController.create(customerRequest);
        UserAccount account = users.findByEmailIgnoreCase(user.email()).orElseThrow();
        return issueToken(account);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        UserAccount user = users.findByEmailIgnoreCase(request.email())
            .filter(candidate -> passwordEncoder.matches(request.password(), candidate.getPasswordHash()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas"));
        return issueToken(user);
    }

    private AuthResponse issueToken(UserAccount account) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("prostock-identity")
            .issuedAt(now)
            .expiresAt(now.plus(8, ChronoUnit.HOURS))
            .subject(account.getEmail())
            .claim("userId", account.getId())
            .claim("role", account.getRol())
            .build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(
            JwsHeader.with(MacAlgorithm.HS256).build(), claims
        )).getTokenValue();
        return new AuthResponse(token, UserResponse.from(account));
    }
}
