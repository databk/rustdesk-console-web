import { InfoCircleOutlined, UpCircleOutlined } from '@ant-design/icons';
import { useAccess, useIntl } from '@umijs/max';
import { theme, Tooltip } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import UpdateCheckModal from '@/components/UpdateCheckModal';
import { checkUpdate } from '@/services/rustdesk-console/system';
import { readSavedUpdate } from '@/services/rustdesk-console/systemUpdate';
import { getToken } from '@/utils/auth';

// The legacy check only drives a notification, never an executable update plan.
function hasOfficialStableUpdate(result: API.UpdateCheckResult | null) {
  return (['backend', 'frontend'] as const).some((component) => {
    const release = result?.[component];
    if (!release?.has_update || !release.version || !release.release_url) return false;
    const version = release.version.replace(/^v/, '');
    if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(version)) return false;
    try {
      const url = new URL(release.release_url);
      const repository = component === 'backend' ? 'rustdesk-console' : 'rustdesk-console-web';
      const prefix = `/databk/${repository}/releases/tag/`;
      return url.protocol === 'https:' && url.hostname === 'github.com' &&
        url.pathname.startsWith(prefix) &&
        decodeURIComponent(url.pathname.slice(prefix.length)).replace(/^v/, '') === version;
    } catch {
      return false;
    }
  });
}

export default function HeaderUpdateEntry() {
  const access = useAccess();
  const intl = useIntl();
  const { token } = theme.useToken();
  const [modalOpen, setModalOpen] = useState(false);
  const [cachedResult, setCachedResult] = useState<API.UpdateCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const autoChecked = useRef(false);

  const doAutoCheck = useCallback(async () => {
    setChecking(true);
    try {
      setCachedResult(await checkUpdate({ frontend_version: FRONTEND_VERSION }));
    } catch {
      // Keep the entry available; the dialog offers an explicit retry.
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!autoChecked.current && access.isSuperAdmin && getToken()) {
      autoChecked.current = true;
      if (readSavedUpdate()) setModalOpen(true);
      void doAutoCheck();
    }
  }, [access.isSuperAdmin, doAutoCheck]);

  if (!access.isSuperAdmin) return null;
  const available = hasOfficialStableUpdate(cachedResult);
  const label = intl.formatMessage({
    id: `app.systemUpdate.${checking ? 'checkingUpdates' : available ? 'available' : 'check'}`,
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Tooltip title={label}>
        <button
          type='button'
          aria-label={label}
          aria-haspopup='dialog'
          aria-busy={checking}
          onClick={() => setModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 0,
            padding: 4,
            border: 0,
            background: 'transparent',
            font: 'inherit',
            fontSize: 18,
            color: available ? token.colorPrimary : 'inherit',
            cursor: 'pointer',
          }}
        >
          {available ? <UpCircleOutlined aria-hidden /> : <InfoCircleOutlined aria-hidden />}
        </button>
      </Tooltip>
      <UpdateCheckModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        cachedResult={cachedResult}
        initialCheckPending={checking}
        onCheckResult={setCachedResult}
      />
    </div>
  );
}
