
import { generarBurbujas } from './burbujas.js';
import { actualizarMensajes, enviarMensaje , eliminarRegistro} from './formMensajes.js';
import {configurarEnvios,limpiarFoto,prependarFotoCard,crearFotoCard,cargarFotos,idsCargadosFotos,eliminarFoto,cargarMasFotos,reiniciarPaginacionFotos} from './fotos.js';
import {configurarDescargaAlbum} from './descargarFotos.js';

// ── CONSTANTES ────────────────────────────────────────────────────────────
const API        = '/api';
const POLL_MS    = 12_000; // Polling para fotos

// Colores para avatares (rotan por nombre)
const AVATAR_COLORS = ['#0eb8c8','#c9a84c','#e8806a','#4dd9e5','#f0d080','#70b8e0'];

// ── DETECCIÓN DE ROL ──────────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
export const ROL    = params.get('role') === 'admin' ? 'admin' : 'invitado';
export const authHeaders = { 'x-role': ROL };

// ── VARIABLES DE PAGINACIÓN Y CONTROL ─────────────────────────────────────
let paginaActualMensajes = 1;
let pollingInterval     = null;

// ── DOM: ELEMENTOS ────────────────────────────────────────────────────────
// Navegación principal y Contenedores
const selectorAccion        = document.getElementById('selectorAccion');
const formFotos             = document.getElementById('formFotos');
const formMensajes          = document.getElementById('formMensajes');
const btnIrAMensajes        = document.getElementById('btnIrAMensajes');
const botonesRegresar       = document.querySelectorAll('.btn-regresar');

// Dashboard Inferior (las "pestañas" son en realidad los .album-container,
// controlados por cambiarSeccion() usando la clase .active)
const areaFotos             = document.getElementById('areaFotos');
const areaMensajes          = document.getElementById('areaMensajes');
const paginacionContenedor  = document.getElementById('paginacionContenedor');
const btnCargarMas          = document.getElementById('btnCargarMas');
const btnCargarMasFotos     = document.getElementById('btnCargarMasFotos');

// Formulario de Fotos Puras
const formSoloFoto          = document.getElementById('formSoloFoto');
const nombreFoto            = document.getElementById('nombreFoto');
const inputFoto             = document.getElementById('inputFoto');
const fotoLabel             = document.getElementById('fotoLabel');
const fotoTexto             = document.getElementById('fotoTexto');
const previewFoto           = document.getElementById('previewFoto');
const imgPreviewFoto        = document.getElementById('imgPreviewFoto');
const fotoRemove            = document.getElementById('fotoRemove');
const btnEnviarFoto         = document.getElementById('btnEnviarFoto');

// Formulario de Mensajes Puros
const inputTextoMensaje     = document.getElementById('inputTextoMensaje');
const charCount             = document.getElementById('charCount');

// Grids, Contadores y Modos Globales
const adminBadge            = document.getElementById('adminBadge');

const fotosGrid             = document.getElementById('fotosGrid');
const mensajesLayout        = document.getElementById('mensajesLayout');
const fotosEmpty            = document.getElementById('fotosEmpty');
const mensajesEmpty         = document.getElementById('mensajesEmpty');
const photoCount            = document.getElementById('photoCount');
const messageCount          = document.getElementById('messageCount');
const toast                 = document.getElementById('toast');

// Templates
const templateFoto          = document.getElementById('templateFoto');
const templateMensaje       = document.getElementById('templateMensaje');

const btnIrAFotos = document.getElementById('btnIrAFotos'); // ID correcto del HTML


// ── EXPOSICIÓN GLOBAL (debe ir antes de init(), ya que actualizarMensajes()
// se llama durante la inicialización y depende de estas funciones) ─────────
window.validarCampoTexto = validarCampoTexto;
window.establecerCarga = establecerCarga;
window.activarPestaña = activarPestaña;
window.prependarMensajeCard = prependarMensajeCard;
window.mostrarToast = mostrarToast;
window.enviarMensaje = enviarMensaje;
window.crearMensajeCard = crearMensajeCard;
window.cambiarSeccion = cambiarSeccion;
window.eliminarRegistro =eliminarRegistro;
window.configurarEnvios = configurarEnvios;
window.limpiarFoto = limpiarFoto;
window.prependarFotoCard =prependarFotoCard;
window.crearFotoCard=crearFotoCard;
window.cargarFotos = cargarFotos;
window.cargarMasFotos = cargarMasFotos;
window.reiniciarPaginacionFotos = reiniciarPaginacionFotos;
window.configurarEventosNavegacion = configurarEventosNavegacion; 
window.idsCargadosFotos = idsCargadosFotos ;
window.eliminarFoto = eliminarFoto;
window.configurarDescargaAlbum =configurarDescargaAlbum;





// ── INICIALIZACIÓN ────────────────────────────────────────────────────────
(function init() {
  if (ROL === 'admin') {
    adminBadge.hidden = false;
    if (btnAlbumZip) {
      btnAlbumZip.hidden = false;
      btnAlbumZip.style.display = '';
    }
  } else {
    // Forzamos el ocultamiento por si el CSS de .btn-admin/.btn-zip
    // está sobreescribiendo el atributo [hidden] con un display propio.
    if (btnAlbumZip) {
      btnAlbumZip.hidden = true;
      btnAlbumZip.style.display = 'none';
    }
  }

  generarBurbujas();
  configurarEventosNavegacion();
  configurarManejoArchivos();
  configurarEnvios();
  enviarMensaje();       // Activa el listener de submit del formulario de mensajes
  actualizarMensajes();  // Precarga el contador/lista de mensajes
  cargarFotos();
  configurarDescargaAlbum();
  
 

})();

function cambiarSeccion(idSeccionAMostrar) {
  // Solo una sección visible a la vez: fotos O mensajes.
  const todosLosContenedores = document.querySelectorAll('.album-container');
  todosLosContenedores.forEach(seccion => {
    seccion.classList.remove('active');
    seccion.hidden = true;
  });

  const seccionObjetivo = document.getElementById(idSeccionAMostrar);
  if (seccionObjetivo) {
    seccionObjetivo.classList.add('active');
    seccionObjetivo.hidden = false;
  }
}



// ── CONTROL DE FLUJO Y NAVEGACIÓN ─────────────────────────────────────────
function configurarEventosNavegacion() {
  const btnIrAFotos = document.getElementById('btnIrAFotos');
  const btnIrAMensajes = document.getElementById('btnIrAMensajes');
  const btnsRegresar = document.querySelectorAll('.btn-regresar');

  btnIrAFotos?.addEventListener('click', () => {
    selectorAccion.style.display = 'none';
    formFotos.hidden = false;
    activarPestaña('fotos');
  });

  btnIrAMensajes?.addEventListener('click', () => {
    selectorAccion.style.display = 'none';
    formMensajes.hidden = false;
    activarPestaña('mensajes');
  });

  btnsRegresar.forEach(btn => {
    btn.addEventListener('click', () => {
      formFotos.hidden = true;
      formMensajes.hidden = true;
      selectorAccion.style.display = 'block';

      limpiarSeccion('areaFotos');
      limpiarSeccion('areaMensajes');

      // Las galerías solo deben verse dentro de "fotos" o "mensajes",
      // nunca en la pantalla del selector.
      areaFotos.hidden = true;
      areaMensajes.hidden = true;
      areaFotos.classList.remove('active');
      areaMensajes.classList.remove('active');

      clearInterval(pollingInterval);
    });
  });
};
// Limpiar pantallas
function limpiarSeccion(idSeccion) {
  const seccion = document.getElementById(idSeccion);
  if (!seccion) return;
  
  // Buscar el grid/layout interno
  const grid = seccion.querySelector('.fotos-grid, .mensajes-layout');
  if (grid) grid.innerHTML = '';
  
  // Resetear IDs
  if (idSeccion === 'areaFotos') {
    idsCargadosFotos.clear();
    reiniciarPaginacionFotos();

      const photoCount = document.getElementById('photoCount');
    photoCount.style.display='none'

  } else if (idSeccion === 'areaMensajes') {
    idsCargadosMensajes.clear();

      const messageCount = document.getElementById('messageCount');
    messageCount.style.display='none';
  }

    
  
  // Mostrar mensaje de vacío
  const empty = seccion.querySelector('.galeria-empty');
  if (empty) empty.hidden = false;
}


function activarPestaña(tipo) {
  if (tipo === 'fotos') {
    cambiarSeccion('areaFotos');

    // Cargar fotos e iniciar su polling
    cargarFotos();
    clearInterval(pollingInterval);
    pollingInterval = setInterval(cargarFotos, POLL_MS);
  } else {
    cambiarSeccion('areaMensajes');
    clearInterval(pollingInterval); // Frenar polling si ve mensajes para ahorrar datos

    // Cargar/actualizar el libro de mensajes
    actualizarMensajes();
  }
}

// ── MANEJO DE VISTA PREVIA DE FOTOS ───────────────────────────────────────
function configurarManejoArchivos() {
  inputFoto.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      mostrarToast('Solo se permiten imágenes 📸', 'error');
      limpiarFoto();
      return;
    }

    const url = URL.createObjectURL(file);
    imgPreviewFoto.src = url;
    previewFoto.hidden = false;
    fotoTexto.textContent = file.name.length > 24 ? file.name.slice(0, 22) + '…' : file.name;
    fotoLabel.style.borderStyle = 'solid';
    fotoLabel.style.borderColor = 'var(--teal-bright)';
  });

  fotoRemove.addEventListener('click', limpiarFoto);

  btnCargarMasFotos?.addEventListener('click', () => {
    cargarMasFotos();
  });
}



// Contador de texto manual
if (inputTextoMensaje && charCount) {
  inputTextoMensaje.addEventListener('input', () => {
    const len = inputTextoMensaje.value.length;
    charCount.textContent = len;
    charCount.style.color = len > 550 ? '#e8806a' : '';
  });
}





// ── COMPONENTIZACIÓN DINÁMICA (TEMPLATES) ─────────────────────────────────


function crearMensajeCard(pub) {
  const clone = templateMensaje.content.cloneNode(true);
  const article = clone.querySelector('.message-card');
  const avatar = clone.querySelector('.message-avatar');
  
  const inicial = (pub.nombre || '?')[0].toUpperCase();
  const color   = AVATAR_COLORS[inicial.charCodeAt(0) % AVATAR_COLORS.length];
  
  avatar.textContent = inicial;
  avatar.style.background = `linear-gradient(135deg, ${color}, ${AVATAR_COLORS[(inicial.charCodeAt(0) + 2) % AVATAR_COLORS.length]})`;

  clone.querySelector('.message-author').textContent = pub.nombre;
  clone.querySelector('.message-time').textContent = formatearFecha(pub.created_at);
  clone.querySelector('.message-text').textContent = pub.mensaje;
  article.dataset.id = pub.id;

  const btnDel = clone.querySelector('.btn-delete-text');
  if (ROL === 'admin') {
    btnDel.hidden = false;
    btnDel.addEventListener('click', () => eliminarRegistro(pub.id, article, 'mensaje',authHeaders));
  }
  return article;
}


function prependarMensajeCard(pub) {
  if (idsCargadosMensajes.has(pub.id)) return;
  mensajesLayout.prepend(crearMensajeCard(pub));
  idsCargadosMensajes.add(pub.id);
  mensajesEmpty.hidden = true;
}



// ── UTILERÍAS COMPARTIDAS ─────────────────────────────────────────────────
function validarCampoTexto(campo, idError, mensajeStr, min = 2) {
  const errEl = document.getElementById(idError);
  if (campo.value.trim().length < min) {
    errEl.textContent = mensajeStr;
    campo.classList.add('error');
    return false;
  }
  errEl.textContent = '';
  campo.classList.remove('error');
  return true;
}

function establecerCarga(boton, cargando, textoCarga = '') {
  const txt = boton.querySelector('.btn-text');
  const spin = boton.querySelector('.btn-loading');
  boton.disabled = cargando;
  if (cargando) {
    txt.hidden = true;
    spin.hidden = false;
    spin.innerHTML = `<span class="spinner"></span> ${textoCarga}`;
  } else {
    txt.hidden = false;
    spin.hidden = true;
  }
}

// async function descargarAlbum() {
//   mostrarToast('Comprimiendo álbum de fotos… 🐚', 'success');
//   try {
//     const res = await fetch(`${API}/admin/album`, { headers: authHeaders });
//     if (!res.ok) throw new Error();
//     const blob = await res.blob();
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'album-recuerdos-grietell.zip';
//     a.click();
//     URL.revokeObjectURL(url);
//   } catch {
//     mostrarToast('Error al empaquetar el archivo ZIP', 'error');
//   }
// }

let toastTimer = null;
function mostrarToast(msg, tipo = 'success') {
  toast.textContent = msg;
  toast.className   = `toast ${tipo} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3600);
}

function formatearFecha(isoString) {
  if (!isoString) return '';
  try {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(new Date(isoString));
  } catch { return ''; }
}
