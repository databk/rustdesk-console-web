(function () {
  if (!('serviceWorker' in navigator)) return;

  var isHttps = document.location.protocol === 'https:';
  var isLocalhost = document.location.hostname === 'localhost' || document.location.hostname === '127.0.0.1';
  if (!isHttps && !isLocalhost) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('/sw.js')
      .then(function (registration) {
        if (registration.waiting) {
          window.dispatchEvent(
            new CustomEvent('sw.updated', { detail: registration }),
          );
        }
        registration.addEventListener('updatefound', function () {
          var installingWorker = registration.installing;
          if (!installingWorker) return;
          installingWorker.addEventListener('statechange', function () {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                window.dispatchEvent(
                  new CustomEvent('sw.updated', { detail: registration }),
                );
              }
            }
          });
        });
      })
      .catch(function (error) {
        console.warn('SW registration failed:', error);
      });

    navigator.serviceWorker.addEventListener('controllerchange', function () {
      window.location.reload();
    });
  });

  window.addEventListener('offline', function () {
    window.dispatchEvent(new CustomEvent('sw.offline'));
  });
})();