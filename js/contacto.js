document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('form-contacto');
    if (!formulario) return;

    formulario.addEventListener('submit', evento => {
        evento.preventDefault();
        const mensajes = JSON.parse(localStorage.getItem('mensajes_contacto_db')) || [];
        mensajes.push({
            id: Date.now(),
            nombre: document.getElementById('contacto-nombre').value.trim(),
            email: document.getElementById('contacto-email').value.trim().toLowerCase(),
            asunto: document.getElementById('contacto-asunto').value.trim(),
            mensaje: document.getElementById('contacto-mensaje').value.trim(),
            fecha: new Date().toLocaleDateString('es-CL'),
            atendido: false
        });
        localStorage.setItem('mensajes_contacto_db', JSON.stringify(mensajes));
        const destinatario = 'contacto@prostock.cl';
        const asunto = document.getElementById('contacto-asunto').value.trim();
        const cuerpo = [
            `Nombre: ${document.getElementById('contacto-nombre').value.trim()}`,
            `Correo: ${document.getElementById('contacto-email').value.trim().toLowerCase()}`,
            '',
            document.getElementById('contacto-mensaje').value.trim()
        ].join('\n');
        const urlGmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(destinatario)}&su=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
        document.getElementById('alert-contacto').innerHTML = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                Gmail se abrirá con tu mensaje preparado para enviarlo.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
            </div>`;
        formulario.reset();
        window.open(urlGmail, '_blank', 'noopener');
    });
});