// --- Micro-Interactions: Magnetic Button ---
function magnetEffect(e, el) {
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  const btn = el.querySelector('button');
  btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
}
function resetMagnet(el) {
  const btn = el.querySelector('button');
  btn.style.transform = `translate(0px, 0px)`;
}

// --- Micro-Interactions: Glowing Cards (Mouse Tracking) ---
function handleCardsGlow(e) {
  for (const card of document.querySelectorAll('.product-card')) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  }
}

// --- Micro-Interactions: Hero Glow ---
function moveGlow(e) {
  const glow = document.getElementById('heroGlow');
  const rect = document.getElementById('heroSection').getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  glow.style.transform = `translate(calc(-50% + ${x*0.1}px), calc(-50% + ${y*0.1}px))`;
}

// --- Header Blur on Scroll ---
window.addEventListener('scroll', () => {
  const header = document.getElementById('mainHeader');
  if(window.scrollY > 50) {
    header.style.background = 'rgba(10, 10, 20, 0.9)';
    header.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
  } else {
    header.style.background = 'var(--glass)';
    header.style.boxShadow = 'none';
  }
});

// --- Toasts ---
function showToast(msg, type='info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  const icons = {success:'fa-check-circle',error:'fa-exclamation-circle',info:'fa-info-circle'};
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fa ${icons[type]}"></i>${msg}`;
  c.appendChild(t);
  
  setTimeout(() => {
    t.style.animation = 'toastOut 0.4s cubic-bezier(0.3, 2, 0.4, 1) forwards';
    setTimeout(() => t.remove(), 400);
  }, 4000);
}