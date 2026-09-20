import React from 'react';
import SvgIcon from './SvgIcon';
import { BUILTIN_SVGS } from './builtinOidcIcons';

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
  const svgName = BUILTIN_ICONS.includes(name.toLowerCase())
    ? name.toLowerCase()
    : 'default';
  const svgContent = BUILTIN_SVGS[svgName] || BUILTIN_SVGS.default;

  return <SvgIcon svg={svgContent} width={width} height={height} alt={name} />;
};

export default OidcIcon;
