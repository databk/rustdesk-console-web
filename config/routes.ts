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
    routes: [
      {
        path: '/dashboard',
        redirect: '/dashboard/workplace',
      },
      {
        name: 'workplace',
        icon: 'home',
        path: '/dashboard/workplace',
        component: './dashboard/workplace',
      },
    ],
  },
  {
    path: '/devices',
    name: 'devices',
    icon: 'desktop',
    routes: [
      {
        path: '/devices',
        redirect: '/devices/list',
      },
      {
        name: 'list',
        icon: 'unordered-list',
        path: '/devices/list',
        component: './devices/list',
      },
    ],
  },
  {
    path: '/address-book',
    name: 'addressBook',
    icon: 'book',
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
    path: '/device-groups',
    name: 'deviceGroups',
    icon: 'group',
    routes: [
      {
        path: '/device-groups',
        redirect: '/device-groups/list',
      },
      {
        name: 'list',
        icon: 'appstore',
        path: '/device-groups/list',
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
    path: '/',
    redirect: '/dashboard/workplace',
  },
  {
    component: '404',
    path: '/*',
  },
];
