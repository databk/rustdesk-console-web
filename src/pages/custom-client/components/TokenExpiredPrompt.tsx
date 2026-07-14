import { GithubOutlined, WarningOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Result } from 'antd';
import React from 'react';

interface TokenExpiredPromptProps {
  username?: string;
  loginLoading: boolean;
  onLogin: () => void;
}

const TokenExpiredPrompt: React.FC<TokenExpiredPromptProps> = ({
  username,
  loginLoading,
  onLogin,
}) => {
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
        icon={<WarningOutlined style={{ color: '#faad14', fontSize: 72 }} />}
        title={intl.formatMessage({
          id: 'pages.nexus.tokenExpired',
          defaultMessage: 'Nexus Token Expired',
        })}
        subTitle={intl.formatMessage(
          {
            id: 'pages.nexus.tokenExpiredDesc',
            defaultMessage: 'Your Nexus token for {username} has expired. Please re-bind your account.',
          },
          { username },
        )}
        extra={
          <Button
            type="primary"
            size="large"
            icon={<GithubOutlined />}
            loading={loginLoading}
            onClick={onLogin}
          >
            <FormattedMessage id="pages.nexus.rebind" defaultMessage="Re-bind Nexus Account" />
          </Button>
        }
      />
    </div>
  );
};

export default TokenExpiredPrompt;
