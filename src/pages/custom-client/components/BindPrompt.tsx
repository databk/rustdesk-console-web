import { GithubOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Alert, Button, Result, Space } from 'antd';
import React from 'react';

interface BindPromptProps {
  loginLoading: boolean;
  onLogin: () => void;
}

const BindPrompt: React.FC<BindPromptProps> = ({ loginLoading, onLogin }) => {
  const intl = useIntl();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      }}
    >
      <Result
        icon={<GithubOutlined style={{ color: '#24292e', fontSize: 72 }} />}
        title={intl.formatMessage({
          id: 'pages.nexus.bindTitle',
          defaultMessage: 'Bind Nexus Account',
        })}
        subTitle={intl.formatMessage({
          id: 'pages.nexus.bindDesc',
          defaultMessage:
            'You need to bind your GitHub account to generate custom clients. Click the button below to authorize via GitHub.',
        })}
        extra={
          <Space
            direction="vertical"
            size="large"
            style={{ alignItems: 'center' }}
          >
            <Alert
              type="info"
              showIcon
              style={{ maxWidth: 560, textAlign: 'left' }}
              message={intl.formatMessage({
                id: 'pages.nexus.bindWhyLogin',
                defaultMessage:
                  'GitHub authentication helps us verify that you are a real user, preventing automated abuse of build resources. We only request your public username - no access to your repositories, personal data, or any other permissions is needed.',
              })}
            />
            <Button
              type="primary"
              size="large"
              icon={<GithubOutlined />}
              loading={loginLoading}
              onClick={onLogin}
            >
              <FormattedMessage
                id="pages.nexus.bindGithub"
                defaultMessage="Authorize with GitHub"
              />
            </Button>
          </Space>
        }
      />
    </div>
  );
};

export default BindPrompt;
