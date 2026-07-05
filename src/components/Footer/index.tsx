import { GithubOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { checkUpdate } from '@/services/rustdesk-console/system';
import UpdateCheckModal from '@/components/UpdateCheckModal';

const Footer: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [cachedResult, setCachedResult] =
    useState<API.UpdateCheckResult | null>(null);
  const autoChecked = useRef(false);

  const doAutoCheck = useCallback(async () => {
    try {
      const res = await checkUpdate({ frontend_version: FRONTEND_VERSION });
      setCachedResult(res);
      if (res?.backend?.has_update || res?.frontend?.has_update) {
        setModalOpen(true);
      }
    } catch {
      // silent fail for auto check
    }
  }, []);

  useEffect(() => {
    if (!autoChecked.current) {
      autoChecked.current = true;
      doAutoCheck();
    }
  }, [doAutoCheck]);

  return (
    <>
      <DefaultFooter
        style={{
          background: 'none',
        }}
        copyright="2026 Data Block"
        links={[
          {
            key: 'github',
            title: <GithubOutlined />,
            href: 'https://github.com/databk/rustdesk-console',
            blankTarget: true,
          },
        ]}
      />
      <UpdateCheckModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        cachedResult={cachedResult}
      />
    </>
  );
};

export default Footer;
