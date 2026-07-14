import { GithubOutlined, ReloadOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Result, Space } from 'antd';
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
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<GithubOutlined />}
              href="https://github.com/databk/rustdesk-console"
              target="_blank"
            >
              <FormattedMessage id="pages.nexus.goToRepo" defaultMessage="Go to GitHub Repository" />
            </Button>
            <Button
              size="large"
              icon={<ReloadOutlined />}
              loading={buildAgainLoading}
              onClick={onBuildAgain}
            >
              <FormattedMessage id="pages.nexus.buildAgain" defaultMessage="Build Again" />
            </Button>
          </Space>
        }
      />
    </div>
  );
};

export default RepoRequiredPrompt;
