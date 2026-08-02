import { ApiOutlined, SaveOutlined, SafetyOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage } from '@umijs/max';
import { Button, Card, Space, Spin } from 'antd';
import React from 'react';
import LdapForm from './components/LdapForm';
import { useLdapConfig } from './hooks/useLdapConfig';

const LDAPSettings: React.FC = () => {
  const {
    loading,
    saving,
    testing,
    configExists,
    configInfo,
    form,
    handleSave,
    handleTest,
  } = useLdapConfig();

  return (
    <PageContainer>
      <Card
        title={
          <Space>
            <SafetyOutlined />
            <FormattedMessage
              id="pages.ldap.title"
              defaultMessage="LDAP Configuration"
            />
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ApiOutlined />}
              onClick={handleTest}
              loading={testing}
              disabled={loading}
            >
              <FormattedMessage
                id="pages.ldap.testConnection"
                defaultMessage="Test Connection"
              />
            </Button>
            <Button
              icon={<SaveOutlined />}
              type="primary"
              onClick={handleSave}
              loading={saving}
              disabled={loading}
            >
              <FormattedMessage id="pages.common.save" defaultMessage="Save" />
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <p style={{ color: '#666', marginBottom: 24 }}>
            <FormattedMessage
              id="pages.ldap.description"
              defaultMessage="Configure LDAP/Active Directory authentication. Users will be automatically authenticated via LDAP when enabled."
            />
          </p>

          <LdapForm
            form={form}
            configExists={configExists}
            configInfo={configInfo}
          />
        </Spin>
      </Card>
    </PageContainer>
  );
};

export default LDAPSettings;
