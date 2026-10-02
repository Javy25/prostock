package cl.prostock.contact;

import static cl.prostock.contact.ContactDtos.AttendedRequest;
import static cl.prostock.contact.ContactDtos.MessageRequest;
import static cl.prostock.contact.ContactDtos.MessageResponse;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/messages")
public class ContactController {
    private final ContactRepository messages;

    public ContactController(ContactRepository messages) {
        this.messages = messages;
    }

    @GetMapping
    public List<MessageResponse> list() {
        return messages.findAll().stream().map(MessageResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse create(@Valid @RequestBody MessageRequest request) {
        return MessageResponse.from(messages.save(ContactMessage.create(request)));
    }

    @PatchMapping("/{id}/attended")
    public MessageResponse markAttended(@PathVariable("id") Long id, @Valid @RequestBody AttendedRequest request) {
        ContactMessage message = messages.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mensaje no encontrado"));
        message.setAtendido(request.atendido());
        return MessageResponse.from(messages.save(message));
    }

    @PutMapping("/{id}/attended")
    public MessageResponse updateAttended(@PathVariable("id") Long id, @Valid @RequestBody AttendedRequest request) {
        return markAttended(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long id) {
        ContactMessage message = messages.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mensaje no encontrado"));
        messages.delete(message);
    }
}
