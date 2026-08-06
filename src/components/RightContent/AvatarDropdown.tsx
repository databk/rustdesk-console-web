import {
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import type { MenuProps } from 'antd';
import { Spin } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';
import { FormattedMessage } from '@umijs/max';
import { getToken, removeToken } from '@/utils/auth';
import { logout } from '@/services/rustdesk-console/auth';
import HeaderDropdown from '../HeaderDropdown';

export type GlobalHeaderRightProps = {
  menu?: boolean;
  children?: React.ReactNode;
};

export const AvatarName = () => {
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState || {};
  return (
    <span className="anticon">
      {currentUser?.display_name || currentUser?.name}
    </span>
  );
};

const useStyles = createStyles(({ token }) => {
  return {
    action: {
      display: 'flex',
      height: '48px',
      marginLeft: 'auto',
      overflow: 'hidden',
      alignItems: 'center',
      padding: '0 8px',
      cursor: 'pointer',
      borderRadius: token.borderRadius,
      '&:hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
  };
});

export const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({
  children,
}) => {
  const { styles } = useStyles();

  const { initialState, setInitialState } = useModel('@@initialState');

  const loginOut = async () => {
    const token = getToken();
    removeToken();
    setInitialState((s) => ({ ...s, currentUser: undefined }));
    const { search, pathname } = window.location;
    if (pathname !== '/user/login') {
      const searchParams = new URLSearchParams({
        redirect: pathname + search,
      });
      history.replace({
        pathname: '/user/login',
        search: searchParams.toString(),
      });
    }
    if (token) {
      logout(undefined, token).catch(() => {});
    }
  };

  const onMenuClick: MenuProps['onClick'] = (event) => {
    const { key } = event;
    if (key === 'logout') {
      loginOut();
      return;
    }
    if (key === 'accountCenter') {
      history.push('/user/center');
      return;
    }
  };

  const loading = (
    <span className={styles.action}>
      <Spin
        size="small"
        style={{
          marginLeft: 8,
          marginRight: 8,
        }}
      />
    </span>
  );

  if (!initialState) {
    return loading;
  }

  const { currentUser } = initialState;

  if (!currentUser || !currentUser.name) {
    return loading;
  }

  const menuItems = [
    {
      key: 'center',
      icon: <UserOutlined />,
      disabled: true,
      label: currentUser.email || currentUser.display_name || currentUser.name,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'accountCenter',
      icon: <SettingOutlined />,
      label: (
        <FormattedMessage
          id="layout.user.accountCenter"
          defaultMessage="Account Center"
        />
      ),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: (
        <FormattedMessage id="layout.user.logout" defaultMessage="Logout" />
      ),
    },
  ];

  return (
    <HeaderDropdown
      menu={{
        selectedKeys: [],
        onClick: onMenuClick,
        items: menuItems,
      }}
    >
      {children}
    </HeaderDropdown>
  );
};
