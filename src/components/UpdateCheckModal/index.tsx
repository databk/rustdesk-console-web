import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Card, Modal, Space, Spin, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { checkUpdate } from '@/services/rustdesk-console/system';

const { Paragraph, Text, Title } = Typography;

interface UpdateCheckComponent extends API.UpdateCheckComponent {
  has_update: boolean;
  version?: string;
  release_url?: string;
  release_note?: string;
  published_at?: string;
}

const UpdateCard: React.FC<{
  title: string;
  data: UpdateCheckComponent | null;
}> = ({ title, data }) => {
  const intl = useIntl();

  if (!data) return null;

  return (
    <Card size="small" title={title} style={{ marginBottom: 12 }}>
      {data.has_update ? (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Tag color="blue">{data.version}</Tag>
            {data.published_at && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(data.published_at).format('YYYY-MM-DD')}
              </Text>
            )}
          </Space>
          {data.release_note && (
            <div
              style={{
                maxHeight: 200,
                overflow: 'auto',
                fontSize: 13,
                lineHeight: 1.6,
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
              style={{ padding: 0 }}
            >
              {intl.formatMessage({ id: 'app.updateCheck.viewRelease' })}
            </Button>
          )}
        </Space>
      ) : (
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          <Text type="secondary">
            {intl.formatMessage({ id: 'app.updateCheck.upToDate' })}
          </Text>
        </Space>
      )}
    </Card>
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

  return (
    <Modal
      title={intl.formatMessage({ id: 'app.updateCheck.title' })}
      open={open}
      onCancel={onClose}
      footer={[
        <Button
          key="recheck"
          onClick={doCheck}
          loading={loading}
          disabled={loading}
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
      width={520}
    >
      <Spin spinning={loading}>
        {result ? (
          <div>
            <UpdateCard
              title={intl.formatMessage({ id: 'app.updateCheck.backend' })}
              data={result.backend}
            />
            <UpdateCard
              title={intl.formatMessage({ id: 'app.updateCheck.frontend' })}
              data={result.frontend}
            />
          </div>
        ) : (
          !loading && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <ExclamationCircleOutlined
                style={{ fontSize: 24, color: '#faad14' }}
              />
              <Paragraph type="secondary" style={{ marginTop: 8 }}>
                {intl.formatMessage({ id: 'app.updateCheck.failed' })}
              </Paragraph>
            </div>
          )
        )}
      </Spin>
    </Modal>
  );
};

export default UpdateCheckModal;
