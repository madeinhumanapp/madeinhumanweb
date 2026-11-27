// Menú mòbil de totes les pàgines (WEB-H07): sense onclick al HTML.
(function () {
  var boto = document.querySelector('.nav-burger');
  var menu = document.getElementById('navMobile');
  if (!boto || !menu) return;
  function posa(obert) {
    menu.classList.toggle('open', obert);
    boto.setAttribute('aria-expanded', String(obert));
  }
  boto.addEventListener('click', function () { posa(!menu.classList.contains('open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) posa(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      posa(false);
      boto.focus();
    }
  });
})();
