import { GithubOutlined, GlobalOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      copyright="2026 Purslane Ltd. Produced"
      links={[
        {
          key: 'github',
          title: <GithubOutlined />,
          href: 'https://github.com/rustdesk/rustdesk',
          blankTarget: true,
        },
        {
          key: 'RustDesk',
          title: <GlobalOutlined />,
          href: 'https://rustdesk.com',
          blankTarget: true,
        },
      ]}
    />
  );
};

export default Footer;
