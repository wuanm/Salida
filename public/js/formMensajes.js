'use strict';
let paginaActualMensajes = 1;
 export const idsCargadosMensajes = window.idsCargadosMensajes || (window.idsCargadosMensajes = new Set());


// guardar mensajes
export function enviarMensaje() {
    const formSoloMensaje   = document.getElementById('formSoloMensaje');
    const nombreMensaje     = document.getElementById('nombreMensaje');
    const inputTextoMensaje = document.getElementById('inputTextoMensaje');
    const charCount         = document.getElementById('charCount');
    const btnEnviarMensaje  = document.getElementById('btnEnviarMensaje');

    if (!formSoloMensaje) return;

    formSoloMensaje.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!window.validarCampoTexto(nombreMensaje, 'errorNombreMensaje', 'Tu nombre es requerido.')) return;
        if (!window.validarCampoTexto(inputTextoMensaje, 'errorTextoMensaje', 'Escribe una dedicatoria válida.', 3)) return;

        window.establecerCarga(btnEnviarMensaje, true, 'Guardando dedicatoria…');

        try {
            // Enviamos el JSON directamente
            const res = await fetch('/api/publicaciones', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    nombre: nombreMensaje.value.trim(),
                    mensaje: inputTextoMensaje.value.trim()
                }) 
            });

            const json = await res.json();
            
            if (!res.ok || !json.ok) throw new Error(json.mensaje || 'Error al guardar mensaje');

            window.mostrarToast('¡Mensaje enviado al Libro de Visitas! ✉️', 'success');
            
            // Limpieza más limpia
            formSoloMensaje.reset();
            if (charCount) charCount.textContent = '0';
            
            window.activarPestaña('mensajes');
            window.prependarMensajeCard(json.data);
            
        } catch (err) {
            window.mostrarToast(err.message, 'error');
        } finally {
            window.establecerCarga(btnEnviarMensaje, false);
        }
    });
};





// Cargar elementos 
export async function actualizarMensajes() {
    try {
        // CORRECCIÓN: Se debe usar comillas invertidas (backticks) para la interpolación
        const res = await fetch(`/api/publicaciones?page=${paginaActualMensajes}&limit=10`);
        const json = await res.json();
        
        if (!json.ok) throw new Error(json.mensaje || 'Error al cargar');

        const mensajesLayout = document.getElementById('mensajesLayout');
        const mensajeEmpty = document.getElementById('mensajesEmpty');
        const paginacionContenedor = document.getElementById('paginacionContenedor');
        const btnCargarMas = document.getElementById('btnCargarMas');
        const messageCount = document.getElementById('messageCount');

        const mensajesValidos = json.data.filter(p => p.mensaje && p.mensaje.trim() !== '');
        
        // CORRECCIÓN: 'length' (con 'th' al final)
        if (paginaActualMensajes === 1 && mensajesValidos.length === 0) {
            mensajeEmpty.hidden = false;
            paginacionContenedor.hidden = true;
            return;
        }
        mensajeEmpty.hidden = true;

        // Mostrar u ocultar botón de cargar más
        btnCargarMas.hidden = (mensajesValidos.length < 10);
        
        mensajesValidos.forEach((m, index) => {
            try {
                if (!idsCargadosMensajes.has(m.id)) {
                   
                    
                    const card = window.crearMensajeCard(m);
                    
                    if (!card) {
                        console.error(`La función crearMensajeCard devolvió null para el ID ${m.id}`);
                        return; // Saltamos este mensaje
                    }
                    
                    mensajesLayout.appendChild(card);
                    idsCargadosMensajes.add(m.id);
                }
            } catch (err) {
                console.error(`Error procesando mensaje con ID ${m.id}:`, err);
            }
        });
            
        const totalMensajes = idsCargadosMensajes.size; // Usamos el tamaño del Set
        messageCount.textContent = `${totalMensajes} dedicatoria${totalMensajes !== 1 ? 's' : ''} en el libro`;

    } catch (error) {
        console.error("Error al paginar los mensajes:", error);
    }
};



// Eliminar  mensajes 
 export async function eliminarRegistro(id,elementoDOM, tipo,authHeaders) {
    if (!confirm('¿Seguro que deseas remover esta publicación permanentemente?')) return;


    try {
        
        const res = await fetch(`/api/publicaciones/mensajes/${id}`, { 
        method: 'DELETE',
        headers:{
         'Content-Type': 'application/json',
          ...authHeaders  },
       });


        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error();

        elementoDOM.style.transition = 'opacity 0.3s, transform 0.3s';
        elementoDOM.style.opacity = '0';
        elementoDOM.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
        elementoDOM.remove();
        idsCargadosMensajes.delete(id);

         // Actualizar contador
            const messageCount = document.getElementById('messageCount');
            const mensajesLayout = document.getElementById('mensajesLayout');
            const mensajesEmpty = document.getElementById('mensajesEmpty');
            
            if (mensajesLayout && mensajesLayout.children.length === 0) {
                if (mensajesEmpty) mensajesEmpty.hidden = false;
            }
            
            if (messageCount) {
                const total = document.querySelectorAll('.message-card').length;
                messageCount.textContent = `${total} dedicatoria${total !== 1 ? 's' : ''}`;
            }
        }, 300);



        mostrarToast('Mensaje eliminado ', 'success');


    } catch {
        mostrarToast('No se pudo procesar la eliminación', 'error');
    }
    };



window.eliminarRegistro = eliminarRegistro;
window.enviarMensaje = enviarMensaje;
window.actualizarMensajes = actualizarMensajes;
