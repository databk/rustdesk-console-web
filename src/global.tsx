import { getIntl } from '@umijs/max';
import { Button, message, notification } from 'antd';
import { useState } from 'react';
import defaultSettings from '../config/defaultSettings';
import {
  clearAppCaches,
  createPageUpdater,
  registerAppServiceWorker,
} from './utils/pwa-update';

const { pwa } = defaultSettings;
const isHttps = document.location.protocol === 'https:';
const isLocalhost =
  document.location.hostname === 'localhost' ||
  document.location.hostname === '127.0.0.1';

const appScope = new URL(APP_PUBLIC_PATH, window.location.origin).href;
const refreshPage = createPageUpdater({
  scope: appScope,
  serviceWorker: navigator.serviceWorker,
  caches: window.caches,
  fetch: (input, options) => window.fetch(input, options),
  reload: () => window.location.reload(),
});
const updateNotificationKey = 'console-pwa-update';

function RefreshPageButton() {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      type="primary"
      loading={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await refreshPage();
          notification.destroy(updateNotificationKey);
        } catch {
          message.error(
            getIntl().formatMessage({ id: 'app.systemUpdate.requestFailed' }),
          );
        } finally {
          setLoading(false);
        }
      }}
    >
      {getIntl().formatMessage({ id: 'app.pwa.serviceworker.updated.ok' })}
    </Button>
  );
}

// if pwa is true
if (pwa) {
  // Notify user if offline now
  window.addEventListener('sw.offline', () => {
    message.warning(getIntl().formatMessage({ id: 'app.pwa.offline' }));
  });

  // Pop up a prompt on the page asking the user if they want to use the latest version
  window.addEventListener('sw.updated', () => {
    notification.open({
      title: getIntl().formatMessage({ id: 'app.pwa.serviceworker.updated' }),
      description: getIntl().formatMessage({
        id: 'app.pwa.serviceworker.updated.hint',
      }),
      actions: <RefreshPageButton />,
      key: updateNotificationKey,
      onClose: async () => null,
    });
  });

  // Register service worker
  if ('serviceWorker' in navigator && (isHttps || isLocalhost)) {
    const register = () => {
      registerAppServiceWorker(navigator.serviceWorker, appScope, () => {
        window.dispatchEvent(new CustomEvent('sw.updated'));
      }).catch((error) => {
        console.warn('Service worker registration failed:', error);
      });
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });

    // Notify offline status
    window.addEventListener('offline', () => {
      window.dispatchEvent(new CustomEvent('sw.offline'));
    });
  }
} else if ('serviceWorker' in navigator && isHttps) {
  void navigator.serviceWorker
    .getRegistration(appScope)
    .then(async (registration) => {
      if (registration?.scope === appScope) await registration.unregister();
      await clearAppCaches(appScope, window.caches);
    })
    .catch((error) => console.warn('Service worker cleanup failed:', error));
}
