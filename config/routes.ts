export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        path: '/user/login',
        layout: false,
        name: 'login',
        component: './user/login',
      },
      {
        path: '/user',
        redirect: '/user/login',
      },
      {
        component: '404',
        path: '/user/*',
      },
    ],
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    icon: 'dashboard',
    component: './dashboard',
  },
  {
    path: '/devices',
    name: 'devices',
    icon: 'desktop',
    component: './devices/list',
  },
  {
    path: '/address-book',
    name: 'addressBook',
    icon: 'contacts',
    routes: [
      {
        path: '/address-book',
        redirect: '/address-book/personal',
      },
      {
        name: 'personal',
        icon: 'user',
        path: '/address-book/personal',
        component: './address-book/personal',
      },
      {
        name: 'shared',
        icon: 'team',
        path: '/address-book/shared',
        component: './address-book/shared',
      },
    ],
  },
  {
    path: '/groups',
    name: 'groups',
    icon: 'team',
    access: 'canAdmin',
    routes: [
      {
        path: '/groups',
        redirect: '/groups/user',
      },
      {
        name: 'user',
        icon: 'user',
        path: '/groups/user',
        component: './groups/user',
      },
      {
        name: 'device',
        icon: 'device',
        path: '/groups/device',
        component: './device-groups/list',
      },
    ],
  },
  {
    path: '/users',
    name: 'users',
    icon: 'team',
    access: 'canAdmin',
    routes: [
      {
        path: '/users',
        redirect: '/users/list',
      },
      {
        name: 'list',
        icon: 'user-switch',
        path: '/users/list',
        component: './users/list',
      },
    ],
  },
  {
    path: '/roles',
    name: 'roles',
    icon: 'audit',
    access: 'canAdmin',
    component: './roles',
  },
  {
    path: '/audits',
    name: 'audits',
    icon: 'FileSearchOutlined',
    access: 'canAdmin',
    routes: [
      {
        path: '/audits',
        redirect: '/audits/conn',
      },
      {
        name: 'conn',
        icon: 'link',
        path: '/audits/conn',
        component: './audits/conn',
      },
      {
        name: 'file',
        icon: 'file',
        path: '/audits/file',
        component: './audits/file',
      },
      {
        name: 'alarm',
        icon: 'alert',
        path: '/audits/alarm',
        component: './audits/alarm',
      },
      {
        name: 'console',
        icon: 'code',
        path: '/audits/console',
        component: './audits/console',
      },
    ],
  },
  {
    path: '/strategy',
    name: 'strategies',
    icon: 'solution',
    access: 'canAdmin',
    component: './strategy',
  },
  {
    path: '/custom-client',
    name: 'customClients',
    icon: 'form',
    access: 'canAdmin',
    component: './custom-client',
  },
  {
    path: '/settings',
    name: 'settings',
    icon: 'setting',
    access: 'canAdmin',
    routes: [
      {
        path: '/settings',
        redirect: '/settings/smtp',
      },
      {
        name: 'smtp',
        icon: 'mail',
        path: '/settings/smtp',
        component: './settings/smtp',
      },
    ],
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    component: '404',
    path: '/*',
  },
];
