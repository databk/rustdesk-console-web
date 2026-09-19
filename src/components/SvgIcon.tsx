import React from 'react';

interface SvgIconProps {
  svg: string;
  width?: number;
  height?: number;
  alt?: string;
}

const SvgIcon: React.FC<SvgIconProps> = ({
  svg,
  width = 20,
  height = 20,
  alt,
}) => {
  const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  return <img src={dataUri} alt={alt} style={{ width, height }} />;
};

export default SvgIcon;
