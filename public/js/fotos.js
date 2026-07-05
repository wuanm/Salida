import {authHeaders} from './main.js';
import { ROL } from './main.js';
export let idsCargadosFotos    = new Set();


//   // Formulario A: Foto Pura
//   formSoloFoto.addEventListener('submit', async (e) => {
//     e.preventDefault();
 
//     if (!inputFoto.files[0]) {
//       mostrarToast('Por favor captura una fotografía 📸', 'error');
//       return;
//     }

//     establecerCarga(btnEnviarFoto, true, 'Enviando foto…');

//     try {
//       const formData = new FormData();
  
//       formData.append('foto', inputFoto.files[0]);

//       const res = await fetch(`/api/publicaciones/fotos`, { 
//         method: 'POST', 
//         body: formData });


//       const json = await res.json();
//       if (!res.ok || !json.ok) throw new Error(json.mensaje || 'Error al subir la foto');

//       mostrarToast('¡Tu foto se unió a la galería! 🌊', 'success');

//       formSoloFoto.reset();
//       limpiarFoto();

//       setTimeout(() => {
//         window.location.reload();
//       }, 2000);
      
//       // Activar visualización instantánea
//       activarPestaña('fotos');
//       prependarFotoCard(json.data);


//     } catch (err) {
//       mostrarToast(err.message, 'error');
//     } finally {
//       establecerCarga(btnEnviarFoto, false);
//     }
//   });
// }

// export async function configurarEnvios() {

//   const formSoloFoto = document.getElementById('formSoloFoto');
//     const inputFoto = document.getElementById('inputFoto');
//     const btnEnviarFoto = document.getElementById('btnEnviarFoto');

//   // Formulario A: Foto Pura
//   formSoloFoto.addEventListener('submit', async (e) => {
//     e.preventDefault();
    
    
    
//     // 2. Validar que haya una foto
//     if (!inputFoto.files[0]) {
//       mostrarToast('Por favor captura una fotografía 📸', 'error');
//       return;
//     }

//     // 3. Mostrar carga (pero solo visual, no envía al backend)
//     establecerCarga(btnEnviarFoto, true, 'Procesando foto…');

//     try {
//       // 🔥 4. CREAR UN OBJETO FALSO (simulación)
//       const archivoFoto = inputFoto.files[0];
      
//       // 5. Crear una URL temporal para la foto (solo para mostrarla)
//       const urlTemporal = URL.createObjectURL(archivoFoto);
      
//       // 6. Crear un objeto SIMULADO como si viniera del backend
//       const publicacionSimulada = {
//         id: Date.now(),  // ID único temporal
//         foto_url: urlTemporal,  // ← URL local, no del backend
//         created_at: new Date().toISOString()
//       };
      
//       console.log('📸 Foto simulada:', publicacionSimulada);
      
//       // 7. Mostrar mensaje de éxito
//       mostrarToast('¡Foto lista! (sin enviar al backend) 📸', 'success');
      
//       // 8. Limpiar el formulario
//       formSoloFoto.reset();
//       limpiarFoto();
      
//       // 9. 🔥 MOSTRAR LA FOTO EN LA GALERÍA (sin backend)
//       activarPestaña('fotos');
//       prependarFotoCard(publicacionSimulada);
      
//       // 10. También agregar el ID al Set para que no se duplique
//       idsCargadosFotos.add(publicacionSimulada.id);
      
//     } catch (err) {
//       console.error('Error:', err);
//       mostrarToast('Error al procesar la foto', 'error');
//     } finally {
//       // 11. Ocultar carga
//       establecerCarga(btnEnviarFoto, false);
//     }
//   });
// };


// ── fotos.js ──────────────────────────────────────────────────────────────

export async function configurarEnvios() {
    const formSoloFoto = document.getElementById('formSoloFoto');
    const inputFoto = document.getElementById('inputFoto');
    const btnEnviarFoto = document.getElementById('btnEnviarFoto');

    formSoloFoto.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!inputFoto.files[0]) {
            mostrarToast('Por favor captura una fotografía 📸', 'error');
            return;
        }

        establecerCarga(btnEnviarFoto, true, 'Enviando foto…');

        try {
            const formData = new FormData();
            formData.append('foto', inputFoto.files[0]);
           

            const res = await fetch('/api/fotos', { 
                method: 'POST', 
                body: formData 
            });

            const json = await res.json();
            if (!res.ok || !json.ok) throw new Error(json.mensaje || 'Error al subir la foto');

            mostrarToast('¡Tu foto se unió a la galería! 🌊', 'success');
            formSoloFoto.reset();
            limpiarFoto();
            
            activarPestaña('fotos');
            prependarFotoCard(json.data);  // ← json.data ya tiene nombre: 'Invitado'
            
        } catch (err) {
            mostrarToast(err.message, 'error');
        } finally {
            establecerCarga(btnEnviarFoto, false);
        }
    });
};

export async function limpiarFoto() {
  inputFoto.value = '';
  imgPreviewFoto.src = '';
  previewFoto.hidden = true;
  fotoTexto.textContent = 'Abrir Cámara de Celular';
  fotoLabel.style.borderStyle = 'dashed';
  fotoLabel.style.borderColor = '';
};


export async function prependarFotoCard(pub) {
  if (idsCargadosFotos.has(pub.id)) return;
  fotosGrid.prepend(crearFotoCard(pub));
  idsCargadosFotos.add(pub.id);
  fotosEmpty.hidden = true;
};


// export function crearFotoCard(pub) {
//     const clone = templateFoto.content.cloneNode(true);
//     const container = clone.querySelector('.foto-card-item');
//     const img = clone.querySelector('.foto-thumbnail');
//     const tag = clone.querySelector('.foto-autor-tag');
//     const btnDel = clone.querySelector('.btn-delete-file');

//     img.src = pub.foto_url;
//     img.alt = `Momento de ${pub.nombre || 'Invitado'}`;
    
   
//     tag.textContent = pub.nombre || 'Invitado';
//     container.dataset.id = pub.id;

//     if (ROL === 'admin') {
//         btnDel.hidden = false;
//         btnDel.addEventListener('click', () => {
//             eliminarRegistro(pub.id, container, 'foto', authHeaders);
//         });
//     }
//     return container;
// }

// Cargar fotos (solo la primera página: las más recientes)
const LIMITE_FOTOS = 10;
let paginaActualFotos = 1;

export async function cargarFotos() {

  try {
    const res = await fetch(`api/fotos?page=1&limit=${LIMITE_FOTOS}`);

    const json = await res.json();

    if (!json.ok) throw new Error();

    const fotosValidas = json.data.filter(p => p.foto_url);
    const total = typeof json.total === 'number' ? json.total : fotosValidas.length;

    actualizarContadorFotos(total);

    if (total === 0) {
      fotosEmpty.hidden = false;
      if (typeof btnCargarMasFotos !== 'undefined' && btnCargarMasFotos) btnCargarMasFotos.hidden = true;
      return;
    }
    fotosEmpty.hidden = true;

    if (idsCargadosFotos.size === 0) {
      fotosGrid.innerHTML = '';
      fotosValidas.forEach(f => {
        fotosGrid.appendChild(crearFotoCard(f));
        idsCargadosFotos.add(f.id);
      });
      paginaActualFotos = 1;
    } else {
      // El polling solo debe sumar fotos nuevas (subidas mientras el usuario
      // estaba viendo la galería), nunca reemplazar lo ya cargado con "cargar más".
      fotosValidas.forEach(f => {
        if (!idsCargadosFotos.has(f.id)) {
          prependarFotoCard(f);
        }
      });
    }

    if (typeof btnCargarMasFotos !== 'undefined' && btnCargarMasFotos) {
      btnCargarMasFotos.hidden = idsCargadosFotos.size >= total;
    }
  } catch (err) {
    console.warn('Error sincronizando fotos:', err);
  }
}

// Pedir la siguiente página de fotos (botón "Ver más fotos")
export async function cargarMasFotos() {
  paginaActualFotos += 1;
  try {
    const res = await fetch(`api/fotos?page=${paginaActualFotos}&limit=${LIMITE_FOTOS}`);
    const json = await res.json();
    if (!json.ok) throw new Error();

    const fotosValidas = json.data.filter(p => p.foto_url);
    const total = typeof json.total === 'number' ? json.total : idsCargadosFotos.size + fotosValidas.length;

    fotosValidas.forEach(f => {
      if (!idsCargadosFotos.has(f.id)) {
        fotosGrid.appendChild(crearFotoCard(f));
        idsCargadosFotos.add(f.id);
      }
    });

    actualizarContadorFotos(total);

    if (typeof btnCargarMasFotos !== 'undefined' && btnCargarMasFotos) {
      btnCargarMasFotos.hidden = (fotosValidas.length < LIMITE_FOTOS) || (idsCargadosFotos.size >= total);
    }
  } catch (err) {
    paginaActualFotos -= 1; // revertir para poder reintentar
    console.warn('Error cargando más fotos:', err);
    if (typeof mostrarToast === 'function') mostrarToast('No se pudieron cargar más fotos', 'error');
  }
}

export function reiniciarPaginacionFotos() {
  paginaActualFotos = 1;
}

function actualizarContadorFotos(total) {
  if (!photoCount) return;
  photoCount.textContent = `${total} foto${total !== 1 ? 's' : ''} capturada${total !== 1 ? 's' : ''}`;
}



// ── ELIMINAR FOTO (ESPECÍFICO PARA FOTOS) ──────────────────────────────
export async function eliminarFoto(id, elementoDOM) {
    if (!confirm('¿Eliminar esta foto de la galería?')) return;

    try {

        const res = await fetch(`/api/fotos/${id}/eliminar`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders
            }
        });

        const json = await res.json();
        
        if (!res.ok || !json.ok) {
            throw new Error(json.mensaje || 'Error al eliminar foto');
        }

        // Animación de eliminación
        elementoDOM.style.transition = 'opacity 0.3s, transform 0.3s';
        elementoDOM.style.opacity = '0';
        elementoDOM.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            elementoDOM.remove();
            
            // Eliminar del Set de IDs cargados
            idsCargadosFotos.delete(id);
            
            // Actualizar contador
            const photoCount = document.getElementById('photoCount');
            const fotosGrid = document.getElementById('fotosGrid');
            const fotosEmpty = document.getElementById('fotosEmpty');
            
            if (fotosGrid && fotosGrid.children.length === 0) {
                if (fotosEmpty) fotosEmpty.hidden = false;
            }
            
            if (photoCount) {
                const total = document.querySelectorAll('.foto-card-item').length;
                photoCount.textContent = `${total} foto${total !== 1 ? 's' : ''}`;
            }
            
        
        }, 300);

        mostrarToast('¡Foto eliminada! ', 'success');
        
    } catch (error) {
        console.error('❌ Error al eliminar foto:', error);
        mostrarToast(error.message || 'No se pudo eliminar la foto', 'error');
    }
}

// ── CREAR TARJETA DE FOTO ──────────────────────────────────────────────
export function crearFotoCard(pub) {
    const clone = templateFoto.content.cloneNode(true);
    const container = clone.querySelector('.foto-card-item');
    const img = clone.querySelector('.foto-thumbnail');
    const tag = clone.querySelector('.foto-autor-tag');
    const btnDel = clone.querySelector('.btn-delete-file');

    img.src = pub.foto_url;
    img.alt = `Momento de ${pub.nombre || 'Invitado'}`;
    tag.textContent = pub.nombre || 'Invitado';
    container.dataset.id = pub.id;


    if (ROL === 'admin') {
        btnDel.hidden = false;
        btnDel.addEventListener('click', () => {
            eliminarFoto(pub.id, container);  // ← Solo necesita ID y elemento
        });
    }
    return container;
}
