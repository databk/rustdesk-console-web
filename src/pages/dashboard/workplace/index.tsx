import {
  BookOutlined,
  CloudServerOutlined,
  DesktopOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  QrcodeOutlined,
  SmileOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useRequest } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  List,
  message,
  Row,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import React from 'react';
import { getSharedAddressBooks } from '@/services/rustdesk-console/addressBook';
import { getDeviceList } from '@/services/rustdesk-console/device';
import { getDeviceGroupList } from '@/services/rustdesk-console/deviceGroup';
import { getUserList } from '@/services/rustdesk-console/user';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

interface SystemInfo {
  version: string;
  licenseStatus: string;
  currentDevices: number;
  maxDevices: number | string;
  expireTime: string;
}

const Workplace: React.FC = () => {
  const intl = useIntl();

  const systemInfo: SystemInfo = {
    version: 'RustDesk Server Pro',
    licenseStatus: 'active',
    currentDevices: 0,
    maxDevices: '-',
    expireTime: '-',
  };

  const { data: deviceData, loading: deviceLoading } = useRequest(
    () =>
      getDeviceList({
        current: 1,
        pageSize: 1,
        accessible: 'all',
        status: 'all',
      }),
    { manual: false },
  );

  const { data: userData, loading: userLoading } = useRequest(
    () => getUserList({ current: 1, pageSize: 100 }),
    { manual: false },
  );

  const { data: abData, loading: abLoading } = useRequest(
    () => getSharedAddressBooks({ pageSize: 1, current: 1 }),
    { manual: false },
  );

  const { data: dgData, loading: dgLoading } = useRequest(
    () => getDeviceGroupList({ current: 1, pageSize: 1 }),
    { manual: false },
  );

  const handleDownloadConfig = () => {
    message.info(intl.formatMessage({
      id: 'pages.dashboard.config.downloadSuccess',
      defaultMessage: 'Configuration download feature coming soon!',
    }));
  };

  const handleDownloadQRCode = () => {
    message.info(intl.formatMessage({
      id: 'pages.dashboard.qrcode.downloadSuccess',
      defaultMessage: 'QR code download feature coming soon!',
    }));
  };

  const userColumns = [
    {
      title: intl.formatMessage({ id: 'pages.dashboard.userTable.user', defaultMessage: 'User' }),
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: intl.formatMessage({ id: 'pages.dashboard.userTable.group', defaultMessage: 'Group' }),
      dataIndex: 'group_name',
      key: 'group_name',
      render: (text: string) => text || intl.formatMessage({ id: 'common.default', defaultMessage: 'Default' }),
    },
    {
      title: intl.formatMessage({ id: 'pages.dashboard.userTable.licensed', defaultMessage: 'Licensed devices' }),
      key: 'licensed_devices',
      render: () => `${systemInfo.currentDevices}/${systemInfo.maxDevices}`,
    },
  ];

  return (
    <PageContainer>
      <Alert
        message={
          <span>
            <SmileOutlined style={{ marginRight: 8 }} />
            {intl.formatMessage({
              id: 'pages.dashboard.welcome',
              defaultMessage: `Welcome to ${systemInfo.version}`,
            })}
          </span>
        }
        type="success"
        showIcon={false}
        style={{ marginBottom: 24 }}
      />

      <Card>
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label={intl.formatMessage({ id: 'pages.dashboard.userTable.user', defaultMessage: 'User' })}>
            {userData?.data?.[0]?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: 'pages.dashboard.userTable.group', defaultMessage: 'Group' })}>
            {userData?.data?.[0]?.group_name || intl.formatMessage({ id: 'common.default', defaultMessage: 'Default' })}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: 'pages.dashboard.licensedDevices', defaultMessage: 'Licensed devices (Current/Maximum)' })}>
            {`${systemInfo.currentDevices}/${systemInfo.maxDevices}`}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: 'pages.dashboard.licenseExpire', defaultMessage: 'License Expire Time' })}>
            {systemInfo.expireTime}
          </Descriptions.Item>
        </Descriptions>

        <Collapse ghost style={{ marginTop: 16 }}>
          <Panel
            header={
              <span>
                <strong>{intl.formatMessage({ id: 'pages.dashboard.config.title', defaultMessage: 'Config & QR code && Windows EXE' })}</strong>
              </span>
            }
            key="config"
          >
            <Row gutter={[16, 16]}>
              <Col>
                <Button icon={<DownloadOutlined />} onClick={handleDownloadConfig}>
                  {intl.formatMessage({ id: 'pages.dashboard.config.download', defaultMessage: 'Download Config' })}
                </Button>
              </Col>
              <Col>
                <Button icon={<QrcodeOutlined />} onClick={handleDownloadQRCode}>
                  {intl.formatMessage({ id: 'pages.dashboard.config.qrcode', defaultMessage: 'Download QR Code' })}
                </Button>
              </Col>
            </Row>
          </Panel>
        </Collapse>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Spin spinning={deviceLoading}>
              <Statistic
                title={intl.formatMessage({
                  id: 'pages.dashboard.totalDevices',
                  defaultMessage: 'Total Devices',
                })}
                value={deviceData?.total || 0}
                prefix={<DesktopOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Spin>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Spin spinning={deviceLoading}>
              <Statistic
                title={intl.formatMessage({
                  id: 'pages.dashboard.onlineDevices',
                  defaultMessage: 'Online Devices',
                })}
                value={0}
                prefix={<CloudServerOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Spin>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Spin spinning={userLoading}>
              <Statistic
                title={intl.formatMessage({
                  id: 'pages.dashboard.totalUsers',
                  defaultMessage: 'Total Users',
                })}
                value={userData?.total || 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Spin>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Spin spinning={abLoading || dgLoading}>
              <Statistic
                title={intl.formatMessage({
                  id: 'pages.dashboard.addressBooks',
                  defaultMessage: 'Address Books',
                })}
                value={(abData?.total || 0) + (dgData?.total || 0)}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Spin>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card
            title={intl.formatMessage({
              id: 'pages.dashboard.quickStart',
              defaultMessage: 'Quick Start',
            })}
          >
            <List
              size="small"
              dataSource={[
                {
                  title: intl.formatMessage({
                    id: 'pages.dashboard.quickStart.manageDevices',
                    defaultMessage: 'Manage Devices',
                  }),
                  desc: intl.formatMessage({
                    id: 'pages.dashboard.quickStart.manageDevicesDesc',
                    defaultMessage: 'View and manage all connected devices',
                  }),
                  href: '/devices/list',
                },
                {
                  title: intl.formatMessage({
                    id: 'pages.dashboard.quickStart.manageUsers',
                    defaultMessage: 'Manage Users',
                  }),
                  desc: intl.formatMessage({
                    id: 'pages.dashboard.quickStart.manageUsersDesc',
                    defaultMessage: 'Create and manage user accounts',
                  }),
                  href: '/users/list',
                },
                {
                  title: intl.formatMessage({
                    id: 'pages.dashboard.quickStart.addressBook',
                    defaultMessage: 'Address Book',
                  }),
                  desc: intl.formatMessage({
                    id: 'pages.dashboard.quickStart.addressBookDesc',
                    defaultMessage: 'Manage shared address books',
                  }),
                  href: '/address-book/shared',
                },
                {
                  title: intl.formatMessage({
                    id: 'pages.dashboard.quickStart.auditLogs',
                    defaultMessage: 'Audit Logs',
                  }),
                  desc: intl.formatMessage({
                    id: 'pages.dashboard.quickStart.auditLogsDesc',
                    defaultMessage: 'View connection and file transfer logs',
                  }),
                  href: '/audits/conn',
                },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<a href={item.href}>{item.title}</a>}
                    description={item.desc}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={intl.formatMessage({
              id: 'pages.dashboard.about',
              defaultMessage: 'About RustDesk Console',
            })}
          >
            <Title level={5}>RustDesk Console</Title>
            <Paragraph>
              {intl.formatMessage({
                id: 'pages.dashboard.aboutDesc',
                defaultMessage:
                  'RustDesk Console is a web-based management platform for RustDesk remote desktop. It provides device management, user management, address book management, and audit logging capabilities.',
              })}
            </Paragraph>
            <Title level={5}>
              {intl.formatMessage({
                id: 'pages.dashboard.features',
                defaultMessage: 'Features',
              })}
            </Title>
            <List
              size="small"
              dataSource={[
                intl.formatMessage({
                  id: 'pages.dashboard.feature1',
                  defaultMessage: 'Device online status monitoring',
                }),
                intl.formatMessage({
                  id: 'pages.dashboard.feature2',
                  defaultMessage:
                    'User account management with role-based access',
                }),
                intl.formatMessage({
                  id: 'pages.dashboard.feature3',
                  defaultMessage: 'Shared and personal address books',
                }),
                intl.formatMessage({
                  id: 'pages.dashboard.feature4',
                  defaultMessage: 'Device group management',
                }),
                intl.formatMessage({
                  id: 'pages.dashboard.feature5',
                  defaultMessage:
                    'Connection, file transfer, and alarm audit logs',
                }),
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default Workplace;
