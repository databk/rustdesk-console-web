import { expect, test } from '@jest/globals';
import routes from '../../../config/routes';
import {
  getAssignableStrategyTargetTypes,
  getStrategyListMode,
} from './strategyAccess';

type Route = {
  path?: string;
  access?: string;
  routes?: Route[];
};

const flattenRoutes = (items: Route[]): Route[] =>
  items.flatMap((route) => [route, ...flattenRoutes(route.routes || [])]);

const allRoutes = flattenRoutes(routes as Route[]);
const routeWithAccess = (path: string) =>
  allRoutes.find((route) => route.path === path && route.access);
const routeWithoutAccess = (path: string) =>
  allRoutes.find((route) => route.path === path && !route.access);

test('assign-only strategy pages use the candidate request', () => {
  expect(getStrategyListMode(false)).toBe('candidates');
  expect(getStrategyListMode(true)).toBe('full');
});

test('strategy target choices require the matching read capability', () => {
  expect(
    getAssignableStrategyTargetTypes({
      canAssignUsers: false,
    }),
  ).toEqual(['device', 'device_group']);
  expect(
    getAssignableStrategyTargetTypes({
      canAssignUsers: true,
    }),
  ).toEqual(['device', 'user', 'device_group']);
});

test('route access mirrors the product, view-or-assign, and audit contracts', () => {
  expect(routeWithAccess('/strategy')?.access).toBe('canStrategiesAccess');
  expect(routeWithAccess('/dashboard')?.access).toBe('canDashboardView');
  expect(routeWithoutAccess('/address-book/shared')).toBeDefined();
  expect(routeWithoutAccess('/address-book/shared/:guid')).toBeDefined();
  for (const path of ['/audits', '/audits/conn']) {
    expect(routeWithAccess(path)?.access).toBe('canAuditConnectionAccess');
  }
  for (const path of ['/audits/file', '/audits/alarm', '/audits/console']) {
    expect(routeWithAccess(path)?.access).toBe('canAuditView');
  }
});
