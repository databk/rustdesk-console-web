import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage } from '@umijs/max';
import { Card, Tabs } from 'antd';
import React from 'react';
import BasicInfo from './components/BasicInfo';
import AvatarSetting from './components/AvatarSetting';
import SecuritySetting from './components/SecuritySetting';

const AccountCenter: React.FC = () => {
  const items = [
    {
      key: 'basic',
      label: (
        <FormattedMessage
          id="pages.account.tab.basic"
          defaultMessage="Basic Information"
        />
      ),
      children: <BasicInfo />,
    },
    {
      key: 'avatar',
      label: (
        <FormattedMessage
          id="pages.account.tab.avatar"
          defaultMessage="Avatar"
        />
      ),
      children: <AvatarSetting />,
    },
    {
      key: 'security',
      label: (
        <FormattedMessage
          id="pages.account.tab.security"
          defaultMessage="Security"
        />
      ),
      children: <SecuritySetting />,
    },
  ];

  return (
    <PageContainer>
      <Card>
        <Tabs items={items} />
      </Card>
    </PageContainer>
  );
};

export default AccountCenter;
