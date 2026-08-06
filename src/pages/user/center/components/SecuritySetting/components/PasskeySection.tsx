import { FormattedMessage, useIntl } from '@umijs/max';
import {
  Button,
  Card,
  Divider,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd';
import { KeyOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import React from 'react';

interface PasskeySectionProps {
  passkeySupported: boolean;
  passkeyList: API.PasskeyCredential[];
  passkeyListLoading: boolean;
  registerLoading: boolean;
  registerModalOpen: boolean;
  registerConfirmLoading: boolean;
  registerName: string;
  isPasskeyTfaEnabled: boolean;
  passkeyTfaLoading: boolean;
  onRegisterNameChange: (name: string) => void;
  onRegister: () => Promise<void>;
  onConfirmRegister: () => Promise<void>;
  onDelete: (guid: string) => Promise<void>;
  onToggleTfa: (enabled: boolean) => Promise<void>;
  onCloseRegister: () => void;
}

const PasskeySection: React.FC<PasskeySectionProps> = ({
  passkeySupported,
  passkeyList,
  passkeyListLoading,
  registerLoading,
  registerModalOpen,
  registerConfirmLoading,
  registerName,
  isPasskeyTfaEnabled,
  passkeyTfaLoading,
  onRegisterNameChange,
  onRegister,
  onConfirmRegister,
  onDelete,
  onToggleTfa,
  onCloseRegister,
}) => {
  const intl = useIntl();

  return (
    <>
      <Card
        title={
          <Space>
            <KeyOutlined />
            <FormattedMessage
              id="pages.user.center.security.passkey.title"
              defaultMessage="Passkey Management"
            />
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {passkeySupported && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onRegister}
              loading={registerLoading}
            >
              <FormattedMessage
                id="pages.user.center.security.passkey.register"
                defaultMessage="Register Passkey"
              />
            </Button>
          )}

          <Table
            dataSource={passkeyList}
            rowKey="guid"
            loading={passkeyListLoading}
            size="middle"
            pagination={false}
            locale={{
              emptyText: intl.formatMessage({
                id: 'pages.user.center.security.passkey.noCredentials',
                defaultMessage: 'No Passkeys registered',
              }),
            }}
            columns={[
              {
                title: intl.formatMessage({
                  id: 'pages.user.center.security.passkey.name',
                  defaultMessage: 'Name',
                }),
                dataIndex: 'name',
                key: 'name',
                render: (name: string) => name || '-',
              },
              {
                title: intl.formatMessage({
                  id: 'pages.user.center.security.passkey.deviceType',
                  defaultMessage: 'Device Type',
                }),
                dataIndex: 'deviceType',
                key: 'deviceType',
                render: (type: string) => (
                  <Tag>
                    {type === 'multiDevice'
                      ? intl.formatMessage({
                          id: 'pages.user.center.security.passkey.multiDevice',
                          defaultMessage: 'Multi-device',
                        })
                      : intl.formatMessage({
                          id: 'pages.user.center.security.passkey.singleDevice',
                          defaultMessage: 'Single-device',
                        })}
                  </Tag>
                ),
              },
              {
                title: intl.formatMessage({
                  id: 'pages.user.center.security.passkey.createdAt',
                  defaultMessage: 'Created At',
                }),
                dataIndex: 'createdAt',
                key: 'createdAt',
                render: (date: string) =>
                  date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
              },
              {
                title: intl.formatMessage({
                  id: 'pages.common.action',
                  defaultMessage: 'Action',
                }),
                key: 'action',
                width: 100,
                render: (_: unknown, record: API.PasskeyCredential) => (
                  <Popconfirm
                    title={intl.formatMessage({
                      id: 'pages.user.center.security.passkey.deleteConfirm',
                      defaultMessage: 'Are you sure to delete this Passkey?',
                    })}
                    onConfirm={() => onDelete(record.guid)}
                  >
                    <Button danger size="small" icon={<DeleteOutlined />}>
                      <FormattedMessage
                        id="pages.common.delete"
                        defaultMessage="Delete"
                      />
                    </Button>
                  </Popconfirm>
                ),
              },
            ]}
          />

          <Divider style={{ margin: '8px 0' }} />

          <Flex align="center" justify="space-between">
            <Space>
              <FormattedMessage
                id="pages.user.center.security.passkey.tfaStatus"
                defaultMessage="Passkey TFA"
              />
              {isPasskeyTfaEnabled ? (
                <Tag color="success">
                  <FormattedMessage
                    id="pages.user.center.security.enabled"
                    defaultMessage="Enabled"
                  />
                </Tag>
              ) : (
                <Tag color="default">
                  <FormattedMessage
                    id="pages.user.center.security.disabled"
                    defaultMessage="Disabled"
                  />
                </Tag>
              )}
            </Space>
            <Switch
              checked={isPasskeyTfaEnabled}
              loading={passkeyTfaLoading}
              onChange={onToggleTfa}
              disabled={passkeyList.length === 0}
            />
          </Flex>
        </Space>
      </Card>

      <Modal
        title={
          <FormattedMessage
            id="pages.user.center.security.passkey.namePasskey"
            defaultMessage="Name your Passkey"
          />
        }
        open={registerModalOpen}
        onCancel={onCloseRegister}
        onOk={onConfirmRegister}
        confirmLoading={registerConfirmLoading}
        okText={intl.formatMessage({
          id: 'pages.common.save',
          defaultMessage: 'Save',
        })}
      >
        <Form layout="vertical">
          <Form.Item
            label={
              <FormattedMessage
                id="pages.user.center.security.passkey.name"
                defaultMessage="Name"
              />
            }
          >
            <Input
              value={registerName}
              onChange={(e) => onRegisterNameChange(e.target.value)}
              placeholder={intl.formatMessage({
                id: 'pages.user.center.security.passkey.namePlaceholder',
                defaultMessage: 'e.g. MacBook Touch ID',
              })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default PasskeySection;
