(function () {
  var photos  = [];
  var current = 0;
  var overlay, img;

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'lb-overlay';
    overlay.innerHTML =
      '<button class="lb-close" aria-label="Fermer">&times;</button>' +
      '<button class="lb-prev" aria-label="Photo précédente">&#8249;</button>' +
      '<img class="lb-img" alt="" />' +
      '<button class="lb-next" aria-label="Photo suivante">&#8250;</button>';
    document.body.appendChild(overlay);

    img = overlay.querySelector('.lb-img');

    overlay.querySelector('.lb-close').addEventListener('click', close);
    overlay.querySelector('.lb-prev').addEventListener('click', function () { go(-1); });
    overlay.querySelector('.lb-next').addEventListener('click', function () { go(1); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('lb-active')) return;
      if (e.key === 'Escape')      close();
      if (e.key === 'ArrowLeft')   go(-1);
      if (e.key === 'ArrowRight')  go(1);
    });
  }

  function open(index) {
    current = index;
    img.src = photos[current];
    overlay.classList.add('lb-active');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('lb-active');
    document.body.style.overflow = '';
    img.src = '';
  }

  function go(dir) {
    current = (current + dir + photos.length) % photos.length;
    img.src = photos[current];
  }

  document.addEventListener('DOMContentLoaded', function () {
    build();
    document.querySelectorAll('.horizontal-content__item img').forEach(function (el, i) {
      photos.push(el.src);
      el.closest('figure').addEventListener('click', function () { open(i); });
    });
  });
})();
