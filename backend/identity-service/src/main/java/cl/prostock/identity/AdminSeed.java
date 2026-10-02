package cl.prostock.identity;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminSeed {
    @Bean
    CommandLineRunner createInitialAdministrator(
        UserRepository users,
        PasswordEncoder passwordEncoder,
        @Value("${ADMIN_EMAIL:admin@duoc.cl}") String email,
        @Value("${ADMIN_PASSWORD:admin123}") String password,
        @Value("${ADMIN_NAME:Administrador Prostock}") String name
    ) {
        return args -> {
            if (users.existsByEmailIgnoreCase(email)) return;
            UserAccount admin = new UserAccount();
            admin.setNombre(name);
            admin.setEmail(email);
            admin.setPasswordHash(passwordEncoder.encode(password));
            admin.setRol("ADMIN");
            users.save(admin);
        };
    }
}
