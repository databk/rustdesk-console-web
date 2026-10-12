import { useIntl } from '@umijs/max';
import { Card } from 'antd';
import React, { useEffect, useState } from 'react';
import { TcpLabel, TcpValue } from '@/components/TcpCongestionInfo';
import { getTcpNetwork } from '@/services/rustdesk-console/server';
import {
  type TcpObservation,
  unavailableTcp,
} from '@/services/rustdesk-console/tcpObservation';

const NetworkSettings: React.FC<{
  node?: string;
  revision: number;
  local?: boolean;
}> = ({ node, revision, local = !node }) => {
  const intl = useIntl();
  const [state, setState] = useState<TcpObservation>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setState(undefined);
    setLoading(true);
    void getTcpNetwork(node, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setState(result);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setState(unavailableTcp('system', 'source_unavailable'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [node, revision]);
  return (
    <Card title={intl.formatMessage({ id: 'pages.servers.network.title' })}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          gap: '4px 8px',
        }}
      >
        <TcpLabel>
          {intl.formatMessage({ id: 'pages.servers.network.selection' })}
        </TcpLabel>
        <span aria-hidden="true">
          {intl.locale.startsWith('zh') ? '：' : ':'}
        </span>
        <TcpValue
          observation={state}
          loading={loading}
          context={local ? 'console' : 'node'}
        />
      </div>
    </Card>
  );
};
export default NetworkSettings;
