import { GithubOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Result } from 'antd';
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
          <Button
            type="primary"
            size="large"
            icon={<GithubOutlined />}
            loading={loginLoading}
            onClick={onLogin}
          >
            <FormattedMessage id="pages.nexus.bindGithub" defaultMessage="Authorize with GitHub" />
          </Button>
        }
      />
    </div>
  );
};

export default BindPrompt;
