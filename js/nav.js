/* =========================================
   nav.js — Navegación entre páginas
   ========================================= */

/**
 * Muestra la página indicada y marca el link activo en el navbar.
 * @param {string} pageId  - id de la sección a mostrar
 * @param {Element} linkEl - elemento <a> que se activó
 */
function showPage(pageId, linkEl) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));

  const target = document.getElementById(pageId);
  if (target) target.classList.add('active');

  if (linkEl) linkEl.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  showPage('home', document.querySelector('.nav-links a[data-page="home"]'));
});
