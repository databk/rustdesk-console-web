import {
  CheckCircleFilled,
  ExclamationCircleFilled,
  LinkOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import {
  Alert,
  Button,
  Modal,
  Skeleton,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { checkUpdate } from '@/services/rustdesk-console/system';

const { Paragraph, Text } = Typography;

interface UpdateCheckComponent extends API.UpdateCheckComponent {
  has_update: boolean;
  version?: string;
  release_url?: string;
  release_note?: string;
  published_at?: string;
}

const StatusBadge: React.FC<{ hasUpdate: boolean }> = ({ hasUpdate }) => (
  <div
    style={{
      width: 36,
      height: 36,
      borderRadius: '50%',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18,
      background: hasUpdate ? '#e6f4ff' : '#f6ffed',
      color: hasUpdate ? '#1677ff' : '#52c41a',
    }}
  >
    {hasUpdate ? <SyncOutlined /> : <CheckCircleFilled />}
  </div>
);

const UpdateCard: React.FC<{
  title: string;
  data: UpdateCheckComponent | null;
}> = ({ title, data }) => {
  const intl = useIntl();

  if (!data) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 8,
        background: '#fafafa',
        border: `1px solid ${data.has_update ? '#d6e4ff' : '#f0f0f0'}`,
        borderLeft: `3px solid ${data.has_update ? '#1677ff' : '#52c41a'}`,
      }}
    >
      <StatusBadge hasUpdate={data.has_update} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 4,
            marginBottom: 4,
          }}
        >
          <Text strong>{title}</Text>
          {data.version && (
            <Tag
              color={data.has_update ? 'processing' : 'success'}
              style={{ margin: 0 }}
            >
              {data.version}
            </Tag>
          )}
        </div>
        {data.has_update ? (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {data.published_at && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(data.published_at).format('YYYY-MM-DD')}
              </Text>
            )}
            {data.release_note && (
              <div
                style={{
                  background: '#fff',
                  borderRadius: 6,
                  padding: '8px 12px',
                  maxHeight: 180,
                  overflow: 'auto',
                  fontSize: 13,
                  lineHeight: 1.6,
                  border: '1px solid #f0f0f0',
                }}
              >
                <Markdown remarkPlugins={[remarkGfm]}>
                  {data.release_note}
                </Markdown>
              </div>
            )}
            {data.release_url && (
              <Button
                type="link"
                size="small"
                icon={<LinkOutlined />}
                href={data.release_url}
                target="_blank"
                style={{ padding: 0, height: 'auto' }}
              >
                {intl.formatMessage({ id: 'app.updateCheck.viewRelease' })}
              </Button>
            )}
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 13 }}>
            {intl.formatMessage({ id: 'app.updateCheck.upToDate' })}
          </Text>
        )}
      </div>
    </div>
  );
};

const UpdateCheckModal: React.FC<{
  open: boolean;
  onClose: () => void;
  cachedResult?: API.UpdateCheckResult | null;
}> = ({ open, onClose, cachedResult }) => {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<API.UpdateCheckResult | null>(
    cachedResult || null,
  );

  const doCheck = useCallback(async () => {
    setLoading(true);
    try {
      const res = await checkUpdate({ frontend_version: FRONTEND_VERSION });
      setResult(res);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && cachedResult) {
      setResult(cachedResult);
    } else if (open && !cachedResult) {
      doCheck();
    }
  }, [open, cachedResult, doCheck]);

  const hasAnyUpdate =
    result && (result.backend?.has_update || result.frontend?.has_update);

  const updateCount = result
    ? [result.backend?.has_update, result.frontend?.has_update].filter(Boolean)
        .length
    : 0;

  return (
    <Modal
      title={intl.formatMessage({ id: 'app.updateCheck.title' })}
      open={open}
      onCancel={onClose}
      footer={[
        <Button
          key="recheck"
          icon={<SyncOutlined />}
          onClick={doCheck}
          loading={loading}
        >
          {intl.formatMessage({ id: 'app.updateCheck.recheck' })}
        </Button>,
        <Button
          key="close"
          type={hasAnyUpdate ? 'primary' : 'default'}
          onClick={onClose}
        >
          {intl.formatMessage({ id: 'app.updateCheck.close' })}
        </Button>,
      ]}
      width={560}
    >
      <Spin spinning={loading}>
        {result ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Alert
              type={hasAnyUpdate ? 'info' : 'success'}
              showIcon
              message={
                hasAnyUpdate
                  ? intl.formatMessage(
                      { id: 'app.updateCheck.newVersionAvailable' },
                      { count: updateCount },
                    )
                  : intl.formatMessage({ id: 'app.updateCheck.allUpToDate' })
              }
            />
            <UpdateCard
              title={intl.formatMessage({ id: 'app.updateCheck.backend' })}
              data={result.backend}
            />
            <UpdateCard
              title={intl.formatMessage({ id: 'app.updateCheck.frontend' })}
              data={result.frontend}
            />
          </Space>
        ) : loading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: '32px 0',
            }}
          >
            <ExclamationCircleFilled
              style={{ fontSize: 40, color: '#faad14' }}
            />
            <Paragraph
              type="secondary"
              style={{ margin: 0, textAlign: 'center' }}
            >
              {intl.formatMessage({ id: 'app.updateCheck.failed' })}
            </Paragraph>
            <Button
              type="primary"
              ghost
              size="small"
              icon={<SyncOutlined />}
              onClick={doCheck}
            >
              {intl.formatMessage({ id: 'app.updateCheck.recheck' })}
            </Button>
          </div>
        )}
      </Spin>
    </Modal>
  );
};

export default UpdateCheckModal;
