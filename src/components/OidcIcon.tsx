import React from 'react';
import SvgIcon from './SvgIcon';
import { BUILTIN_SVGS } from './builtinOidcIcons';

const ICON_KEY_MAP: Record<string, string> = {
  azure: 'microsoft',
};

function getOidcIconKey(name: string): string {
  const lowerName = name.toLowerCase();
  return ICON_KEY_MAP[lowerName] || lowerName;
}

export const BUILTIN_ICONS = [
  'github',
  'gitlab',
  'google',
  'apple',
  'okta',
  'facebook',
  'auth0',
  'microsoft',
];

export const OIDC_LABELS: Record<string, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  google: 'Google',
  apple: 'Apple',
  okta: 'Okta',
  facebook: 'Facebook',
  auth0: 'Auth0',
  microsoft: 'Microsoft',
};

interface OidcIconProps {
  name: string;
  icon?: string;
  width?: number;
  height?: number;
}

const OidcIcon: React.FC<OidcIconProps> = ({
  name,
  icon,
  width = 20,
  height = 20,
}) => {
  if (icon) {
    return <SvgIcon svg={icon} width={width} height={height} alt={name} />;
  }
  const iconKey = getOidcIconKey(name);
  const svgName = BUILTIN_ICONS.includes(iconKey) ? iconKey : 'default';
  const svgContent = BUILTIN_SVGS[svgName] || BUILTIN_SVGS.default;

  return <SvgIcon svg={svgContent} width={width} height={height} alt={name} />;
};

export default OidcIcon;
