import { Tag } from 'antd';

const argbToHex = (color: number | undefined): string => {
  if (!color) return '#1677ff';
  return `#${color.toString(16).padStart(8, '0').slice(-6)}`;
};

export const buildTag = (
  tag: API.AbTag,
  closable?: boolean,
  onClose?: () => void,
  onClick?: () => void,
  style?: React.CSSProperties,
) => {
  return (
    <Tag
      key={tag.name}
      color={argbToHex(tag.color)}
      closable={closable}
      onClose={onClose}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', ...style }}
    >
      {tag.name}
    </Tag>
  );
};

export const buildNotExistsTag = (tagName: string) => {
  return (
    <Tag key={tagName} color="default">
      {tagName}
    </Tag>
  );
};
