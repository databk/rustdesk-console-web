import type { ColorRef } from 'antd';
import { Button, ColorPicker, PlusOutlined, Radio, Tag } from 'antd';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Popconfirm } from 'antd';
import React, { useRef, useState } from 'react';
import type { TagItem } from '@/services/rustdesk-console/typings';
import { argbToHex } from '../utils';

export interface TagFilterProps {
  tags: TagItem[];
  selectedTags: string[];
  tagMode: 'union' | 'intersection';
  pendingColorUpdates: Record<string, number>;
  onTagSelect: (tagName: string) => void;
  onTagDelete: (tagName: string) => void;
  onTagModeChange: (mode: 'union' | 'intersection') => void;
  onTagColorUpdate: (tagName: string, color: number) => void;
  onAddTag: () => void;
  onResetFilter: () => void;
}

const TagFilter: React.FC<TagFilterProps> = ({
  tags,
  selectedTags,
  tagMode,
  pendingColorUpdates,
  onTagSelect,
  onTagDelete,
  onTagModeChange,
  onTagColorUpdate,
  onAddTag,
  onResetFilter,
}) => {
  const [hoveredColorDot, setHoveredColorDot] = useState<string | null>(null);
  const colorPickerCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleColorChange = (tagName: string, colorValue: ColorRef) => {
    const rgb = colorValue.toRgb();
    const newArgb = 0xFF000000 + (rgb.r << 16) + (rgb.g << 8) + rgb.b;
    onTagColorUpdate(tagName, newArgb);
  };

  return (
    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
      <span style={{ fontWeight: 500, marginRight: 4 }}>
        <FormattedMessage id="pages.addressBook.tags" defaultMessage="Tags" />
      </span>
      <Tag
        style={{ cursor: 'pointer', padding: '2px 8px' }}
        color={selectedTags.length === 0 ? 'blue' : undefined}
        onClick={onResetFilter}
      >
        Untagged
      </Tag>
      {tags.map((tag) => {
        const displayColor = argbToHex(pendingColorUpdates[tag.name] ?? tag.color);
        const isSelected = selectedTags.includes(tag.name);
        return (
          <Tag
            key={tag.name}
            color={isSelected ? displayColor : undefined}
            style={{ cursor: 'pointer', padding: '2px 8px', paddingLeft: 0 }}
            closable
            closeIcon={
              <Popconfirm
                title={
                  <FormattedMessage
                    id="pages.addressBook.deleteTagConfirm"
                    defaultMessage="Are you sure to delete this tag?"
                  />
                }
                onConfirm={(e?: React.MouseEvent) => {
                  e?.stopPropagation();
                  onTagDelete(tag.name);
                }}
                onCancel={(e?: React.MouseEvent) => {
                  e?.stopPropagation();
                }}
              >
                <span
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  style={{
                    marginLeft: 4,
                    cursor: 'pointer',
                    color: isSelected ? '#fff' : undefined,
                  }}
                >
                  ×
                </span>
              </Popconfirm>
            }
            onClose={(e: React.MouseEvent) => {
              e.preventDefault();
            }}
            onClick={() => onTagSelect(tag.name)}
          >
            <span
              style={{ paddingLeft: 6, display: 'inline-flex', alignItems: 'center' }}
            >
              <ColorPicker
                disabledAlpha
                value={displayColor}
                open={hoveredColorDot === tag.name}
                onOpenChange={(open: boolean) => {
                  if (!open) {
                    setHoveredColorDot(null);
                  }
                }}
                onChange={(colorValue: ColorRef) => {
                  const rgb = colorValue.toRgb();
                  const newArgb = 0xFF000000 + (rgb.r << 16) + (rgb.g << 8) + rgb.b;
                }}
                onChangeComplete={(colorValue: ColorRef) => handleColorChange(tag.name, colorValue)}
                panelRender={(panel: React.ReactNode) => (
                  <div
                    onMouseEnter={() => {
                      if (colorPickerCloseTimerRef.current) {
                        clearTimeout(colorPickerCloseTimerRef.current);
                        colorPickerCloseTimerRef.current = null;
                      }
                    }}
                    onMouseLeave={() => {
                      colorPickerCloseTimerRef.current = setTimeout(() => {
                        setHoveredColorDot(null);
                      }, 100);
                    }}
                  >
                    {panel}
                  </div>
                )}
              >
                <span
                  onMouseEnter={() => {
                    if (colorPickerCloseTimerRef.current) {
                      clearTimeout(colorPickerCloseTimerRef.current);
                      colorPickerCloseTimerRef.current = null;
                    }
                    setHoveredColorDot(tag.name);
                  }}
                  onMouseLeave={() => {
                    colorPickerCloseTimerRef.current = setTimeout(() => {
                      setHoveredColorDot(null);
                    }, 100);
                  }}
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: isSelected ? '#fff' : displayColor,
                    cursor: 'pointer',
                  }}
                />
              </ColorPicker>
              <span style={{ display: 'inline-block', width: 8 }} />
            </span>
            {tag.name}
          </Tag>
        );
      })}
      <Button
        size="small"
        type="dashed"
        icon={<PlusOutlined />}
        onClick={onAddTag}
      />
      {selectedTags.length > 1 && (
        <Radio.Group
          size="small"
          value={tagMode}
          onChange={(e: { target: { value: 'union' | 'intersection' } }) => onTagModeChange(e.target.value)}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio.Button value="union">
            <FormattedMessage id="pages.addressBook.tagModeUnion" defaultMessage="Any" />
          </Radio.Button>
          <Radio.Button value="intersection">
            <FormattedMessage id="pages.addressBook.tagModeIntersection" defaultMessage="All" />
          </Radio.Button>
        </Radio.Group>
      )}
    </div>
  );
};

export default TagFilter;