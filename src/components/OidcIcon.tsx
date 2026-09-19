import React from 'react';
import SvgIcon from './SvgIcon';
import { getOidcIconKey } from './oidcIcon';
import { BUILTIN_MONOCHROME_SVGS } from './builtinOidcIcons';

export const BUILTIN_ICONS = [
  'github',
  'gitlab',
  'google',
  'apple',
  'okta',
  'facebook',
  'azure',
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
  azure: 'Microsoft',
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

  if (BUILTIN_MONOCHROME_SVGS[svgName]) {
    return (
      <SvgIcon
        svg={BUILTIN_MONOCHROME_SVGS[svgName]}
        width={width}
        height={height}
        alt={name}
      />
    );
  }

  return (
    <img
      src={`/oidc-icons/${svgName}.svg`}
      alt={name}
      style={{ width, height }}
    />
  );
};

export default OidcIcon;
