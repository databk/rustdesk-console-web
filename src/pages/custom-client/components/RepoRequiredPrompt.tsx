import { GithubOutlined, ReloadOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Alert, Button, Result, Space } from 'antd';
import React from 'react';

interface RepoRequiredPromptProps {
  buildAgainLoading: boolean;
  onBuildAgain: () => void;
}

const RepoRequiredPrompt: React.FC<RepoRequiredPromptProps> = ({
  buildAgainLoading,
  onBuildAgain,
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
        icon={<GithubOutlined style={{ color: '#faad14', fontSize: 72 }} />}
        title={intl.formatMessage({
          id: 'pages.nexus.repoRequired',
          defaultMessage: 'Repository Interaction Required',
        })}
        subTitle={intl.formatMessage({
          id: 'pages.nexus.repoRequiredDesc',
          defaultMessage:
            'You need to Star, Fork or Watch the databk/rustdesk-console repository on GitHub before generating custom clients. It may take up to 5 minutes for the cache to refresh.',
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
                id: 'pages.nexus.repoWhyInteract',
                defaultMessage:
                  "I'm a high school student developing this project in my spare time. Your Star, Fork, or Watch means a lot to me - it not only keeps me motivated, but also helps with my college applications. This is the only thing I ask for in return. Thank you so much for your support!",
              })}
            />
            <Space>
              <Button
                type="primary"
                size="large"
                icon={<GithubOutlined />}
                href="https://github.com/databk/rustdesk-console"
                target="_blank"
              >
                <FormattedMessage
                  id="pages.nexus.goToRepo"
                  defaultMessage="Go to GitHub Repository"
                />
              </Button>
              <Button
                size="large"
                icon={<ReloadOutlined />}
                loading={buildAgainLoading}
                onClick={onBuildAgain}
              >
                <FormattedMessage
                  id="pages.nexus.buildAgain"
                  defaultMessage="Build Again"
                />
              </Button>
            </Space>
          </Space>
        }
      />
    </div>
  );
};

export default RepoRequiredPrompt;
