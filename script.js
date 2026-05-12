const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.site-nav');
if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
}
document.querySelectorAll('.site-nav a').forEach(link => {
  link.addEventListener('click', () => nav?.classList.remove('open'));
});
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
