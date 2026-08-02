import type { ConfigOption } from './types';

import { options as connectionOptions } from './options/connection';
import { options as securityOptions } from './options/security';
import { options as displayOptions } from './options/display';
import { options as avOptions } from './options/av';
import { options as fileOptions } from './options/file';
import { options as advancedOptions } from './options/advanced';
import { options as floatingOptions } from './options/floating';
import { options as privacyOptions } from './options/privacy';
import { options as hideOptions } from './options/hide';

export type { ConfigOptionType, ConfigOption, ConfigCategory } from './types';
export { configCategories } from './categories';

export const configOptions: ConfigOption[] = [
  ...connectionOptions,
  ...securityOptions,
  ...displayOptions,
  ...avOptions,
  ...fileOptions,
  ...advancedOptions,
  ...floatingOptions,
  ...privacyOptions,
  ...hideOptions,
];

export const configOptionsMap = configOptions.reduce<
  Record<string, ConfigOption>
>((acc, opt) => {
  acc[opt.key] = opt;
  return acc;
}, {});

export function getOptionsByCategory(category: string): ConfigOption[] {
  return configOptions.filter((opt) => opt.category === category);
}

export function getModifiedCount(
  configOptions?: Record<string, string>,
): number {
  if (!configOptions) return 0;
  return Object.keys(configOptions).filter((key) => {
    const opt = configOptionsMap[key];
    if (!opt) return true;
    return configOptions[key] !== opt.defaultValue;
  }).length;
}
