import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage } from '@umijs/max';
import { Tabs } from 'antd';
import React from 'react';
import BasicInfo from './components/BasicInfo';
import SecuritySetting from './components/SecuritySetting';

const AccountCenter: React.FC = () => {
  const items = [
    {
      key: 'basic',
      label: (
        <FormattedMessage
          id="pages.user.center.tab.basic"
          defaultMessage="Basic Information"
        />
      ),
      children: <BasicInfo />,
    },
    {
      key: 'security',
      label: (
        <FormattedMessage
          id="pages.user.center.tab.security"
          defaultMessage="Security"
        />
      ),
      children: <SecuritySetting />,
    },
  ];

  return (
    <PageContainer>
      <Tabs items={items} centered size="large" />
    </PageContainer>
  );
};

export default AccountCenter;
