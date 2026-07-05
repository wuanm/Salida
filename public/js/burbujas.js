export function generarBurbujas() {
  const contenedor = document.getElementById('bubbles');
  if (!contenedor) return;
  
  // Iconos médicos para flotar
  const iconosMedicos = ['💉', '❤️', '🩺', '💊', '🏥', '🩹', '🌡️', '🧬', '🫀', '🩸', '⚕️'];
  const total = Math.min(15, Math.floor(window.innerWidth / 50));

  for (let i = 0; i < total; i++) {
    const elemento = document.createElement('div');
    elemento.className = 'medical-float';
    
    const icono = iconosMedicos[Math.floor(Math.random() * iconosMedicos.length)];
    
    const size = 20 + Math.random() * 20;
    const left = Math.random() * 100;
    const duration = 15 + Math.random() * 20;
    const delay = Math.random() * -30;

    elemento.textContent = icono;
    elemento.style.cssText = `
      font-size: ${size}px;
      left: ${left}%;
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
    `;
    contenedor.appendChild(elemento);
  }
}

window.generarBurbujas = generarBurbujas;
