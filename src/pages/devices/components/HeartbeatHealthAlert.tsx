import { useIntl } from '@umijs/max';
import { Alert } from 'antd';
import React, { useEffect, useState } from 'react';
import { getHeartbeatHealth } from '@/services/rustdesk-console/device';

const POLL_INTERVAL_MS = 60_000;

/**
 * Explains an all-devices-offline situation when heartbeats stop reaching the
 * console. The endpoint is diagnostic only; it never changes online state.
 */
const HeartbeatHealthAlert: React.FC = () => {
  const intl = useIntl();
  const [health, setHealth] = useState<API.HeartbeatHealth | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let latestRequest = 0;
    const load = async () => {
      const requestId = ++latestRequest;
      try {
        const next = await getHeartbeatHealth();
        // Ignore both unmounted components and out-of-order completions so a
        // slow poll cannot replace a newer result.
        if (disposed || requestId !== latestRequest) return;
        setHealth(next);
        setRefreshFailed(false);
      } catch {
        // Non-admin sessions and consoles without the endpoint stay quiet.
        // Keep the last diagnostic instead of erasing it on a failed refresh.
        if (disposed || requestId !== latestRequest) return;
        setRefreshFailed(true);
      }
    };
    void load();
    const timer = window.setInterval(load, POLL_INTERVAL_MS);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, []);

  if (!health || health.status === 'ok') return null;

  const mismatch = health.likelyApiServerSchemeMismatch;
  const suggestedApiServer =
    health.suggestedApiServer ?? 'https://<your-console-domain>';

  return (
    <Alert
      type={mismatch ? 'warning' : 'info'}
      showIcon
      style={{ marginBottom: 16 }}
      message={intl.formatMessage({
        id: mismatch
          ? 'pages.devices.heartbeatHealth.mismatchTitle'
          : 'pages.devices.heartbeatHealth.staleTitle',
        defaultMessage: mismatch
          ? 'Devices may be using the wrong API address'
          : 'No device heartbeats received recently',
      })}
      description={
        <>
          {intl.formatMessage(
            {
              id: mismatch
                ? 'pages.devices.heartbeatHealth.mismatchDescription'
                : 'pages.devices.heartbeatHealth.staleDescription',
              defaultMessage: mismatch
                ? 'The console is served over HTTPS, but clients may still use the default http://<id-server>:21114 API address. Set the API server in each client to {apiServer}, or build a custom client with this address embedded.'
                : 'Heartbeats have not reached the console for more than {seconds} seconds. Check the client API server, firewall rules, and the heartbeat endpoint.',
            },
            {
              apiServer: suggestedApiServer,
              seconds: health.heartbeat.degradedAfterSeconds,
            },
          )}
          {refreshFailed && (
            <div style={{ marginTop: 8 }}>
              {intl.formatMessage({
                id: 'pages.devices.heartbeatHealth.refreshFailed',
                defaultMessage:
                  'The latest health check failed; showing the last known result.',
              })}
            </div>
          )}
        </>
      }
    />
  );
};

export default HeartbeatHealthAlert;
