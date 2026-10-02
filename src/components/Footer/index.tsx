import { GithubOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      copyright="2026 Data Block"
      links={[
        {
          key: 'github',
          title: <GithubOutlined />,
          href: 'https://github.com/databk/rustdesk-console',
          blankTarget: true,
        },
      ]}
    />
  );
};

export default Footer;
