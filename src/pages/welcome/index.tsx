import {
  CheckCircleOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { App, Alert, Button, Card, Collapse, Descriptions, Space, Spin, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { getCurrentUser } from '@/services/rustdesk-console/auth';
import { getSystemInfo, getLicenseStatus } from '@/services/rustdesk-console/system';

const { Panel } = Collapse;
const { Text, Title, Paragraph } = Typography;

const Welcome: React.FC = () => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<API.CurrentUser | null>(null);
  const [systemInfo, setSystemInfo] = useState<API.SystemInfo | null>(null);
  const [licenseInfo, setLicenseInfo] = useState<API.LicenseInfo | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [user, system, license] = await Promise.all([
        getCurrentUser(),
        getSystemInfo().catch(() => null),
        getLicenseStatus().catch(() => null),
      ]);
      setUserInfo(user);
      setSystemInfo(system);
      setLicenseInfo(license);
    } catch (error) {
      console.error('Failed to fetch welcome data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* System Alerts */}
        {licenseInfo?.warning && (
          <Alert
            type="warning"
            icon={<WarningOutlined />}
            showIcon
            message={
              <span dangerouslySetInnerHTML={{ __html: licenseInfo.warning }} />
            }
          />
        )}

        {/* Main Content */}
        <Card>
          <Title level={4}>
            {intl.formatMessage({ id: 'pages.welcome.title', defaultMessage: 'Welcome' })}
          </Title>

          {/* Version Info */}
          {systemInfo && (
            <Alert
              type="success"
              icon={<CheckCircleOutlined />}
              showIcon
              message={
                <span>
                  {intl.formatMessage(
                    { id: 'pages.welcome.version', defaultMessage: 'Welcome to RustDesk Server Pro {version}' },
                    { version: systemInfo.version },
                  )}
                  {systemInfo.latestVersion && systemInfo.latestVersion !== systemInfo.version && (
                    <>
                      {' '}
                      <a href={systemInfo.releaseUrl} target="_blank" rel="noopener noreferrer">
                        {intl.formatMessage(
                          { id: 'pages.welcome.newVersion', defaultMessage: '(new version available: {version})' },
                          { version: systemInfo.latestVersion },
                        )}
                      </a>
                    </>
                  )}
                </span>
              }
              style={{ marginBottom: 24 }}
            />
          )}

          {/* User Info */}
          <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label={intl.formatMessage({ id: 'pages.welcome.user', defaultMessage: 'User' })}>
              <Text strong>{userInfo?.name || '-'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={intl.formatMessage({ id: 'pages.welcome.group', defaultMessage: 'Group' })}>
              {userInfo?.group_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={intl.formatMessage({ id: 'pages.welcome.licensedDevices', defaultMessage: 'Licensed devices (Current/Maximum)' })} span={2}>
              <Text>{licenseInfo?.currentDevices || 0}/{licenseInfo?.maxDevices || '-'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={intl.formatMessage({ id: 'pages.welcome.licenseExpireTime', defaultMessage: 'License Expire Time' })} span={2}>
              {licenseInfo?.expireTime || '-'}
            </Descriptions.Item>
          </Descriptions>

          {/* Config & QR Code Section */}
          <Collapse
            defaultActiveKey={[]}
            items={[
              {
                key: 'config',
                label: (
                  <Space>
                    <Text strong>
                      {intl.formatMessage({
                        id: 'pages.welcome.configQRCode',
                        defaultMessage: 'Config & QR code && Windows EXE',
                      })}
                    </Text>
                    <ReloadOutlined />
                  </Space>
                ),
                children: (
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Paragraph type="secondary">
                      {intl.formatMessage({
                        id: 'pages.welcome.configDescription',
                        defaultMessage:
                          'Download the configuration file and QR code for easy setup of RustDesk clients.',
                      })}
                    </Paragraph>
                    <Space>
                      <Button type="primary" icon={<DownloadOutlined />}>
                        {intl.formatMessage({ id: 'pages.welcome.downloadConfig', defaultMessage: 'Download Config' })}
                      </Button>
                      <Button icon={<DownloadOutlined />}>
                        {intl.formatMessage({ id: 'pages.welcome.downloadQRCode', defaultMessage: 'Download QR Code' })}
                      </Button>
                      <Button icon={<DownloadOutlined />}>
                        {intl.formatMessage({ id: 'pages.welcome.downloadEXE', defaultMessage: 'Download Windows EXE' })}
                      </Button>
                    </Space>
                  </Space>
                ),
              },
            ]}
          />

          {/* License Action */}
          <div style={{ marginTop: 24 }}>
            <Button type="primary" size="large">
              {intl.formatMessage({
                id: 'pages.welcome.renewLicense',
                defaultMessage: 'Renew / Upgrade License',
              })}
            </Button>
          </div>
        </Card>
      </Space>
    </PageContainer>
  );
};

export default Welcome;
