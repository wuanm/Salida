import { authHeaders, ROL } from './main.js';
/**
 * CONFIGURAR BOTÓN DE DESCARGA
 */
export function configurarDescargaAlbum() {
    const btn = document.getElementById('btnAlbumZip');
    
    if (!btn) {
        console.warn('⚠️ Botón #btnAlbumZip no encontrado');
        return;
    }

    // Mostrar el botón SOLO si el rol es admin; ocultarlo para invitados
    if (ROL === 'admin') {
        btn.hidden = false;
        btn.style.display = '';
    } else {
        btn.hidden = true;
        btn.style.display = 'none';
        return; // Ni siquiera asignamos el evento de click a invitados
    }
    
    // Remover eventos anteriores
    btn.removeEventListener('click', manejarDescarga);
    
    // Asignar evento
    btn.addEventListener('click', manejarDescarga);
    

}

/**
 * MANEJAR LA DESCARGA DEL ZIP
 */
async function manejarDescarga(e) {
    e.preventDefault();
    
    
    mostrarToast('Comprimiendo álbum de fotos… 🐚', 'success');

    try {
        // 1. Hacer la petición al backend
        const res = await fetch('/api/fotos/admin/album', { 
            headers: authHeaders 
        });

       

        // 2. Verificar si la respuesta es exitosa
        if (!res.ok) {
            // Intentar leer el error como JSON
            let errorMsg = `Error ${res.status}`;
            try {
                const errorJson = await res.json();
                errorMsg = errorJson.mensaje || errorMsg;
            } catch {
                errorMsg = await res.text() || errorMsg;
            }
            throw new Error(errorMsg);
        }

        // 3. Verificar que es un ZIP
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/zip')) {
            throw new Error('La respuesta no es un archivo ZIP válido');
        }

        // 4. Obtener el blob (archivo ZIP)
        const blob = await res.blob();

        // 5. Crear URL para descargar
        const url = URL.createObjectURL(blob);

        // 6. Crear enlace y descargar
        const a = document.createElement('a');
        a.href = url;
        
        // Extraer nombre del ZIP del header o usar uno por defecto
        const contentDisposition = res.headers.get('content-disposition');
        let nombreArchivo = 'album-recuerdos-grietell.zip';
        
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="(.+)"/);
            if (match) {
                nombreArchivo = match[1];
            }
        }
        
        a.download = nombreArchivo;
        
        // 7. Simular clic para descargar
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // 8. Liberar la URL
        setTimeout(() => URL.revokeObjectURL(url), 5000);

        mostrarToast('¡Álbum descargado! 📦', 'success');
        

    } catch (error) {
        console.error('❌ Error en descarga:', error);
        mostrarToast(`Error: ${error.message}`, 'error');
    }
}