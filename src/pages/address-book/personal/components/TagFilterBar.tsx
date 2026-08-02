import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, ColorPicker, Popconfirm, Radio, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import React from 'react';
import { argbToHex, rgbToArgb } from '../utils';

interface TagFilterBarProps {
  tags: API.TagItem[];
  selectedTags: string[];
  tagMode: 'union' | 'intersection';
  pendingColorUpdates: Record<string, number>;
  hoveredColorDot: string | null;
  canWrite: boolean;
  colorPickerCloseTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  onSelectTags: (updater: (prev: string[]) => string[]) => void;
  onSetTagMode: (mode: 'union' | 'intersection') => void;
  onSetHoveredColorDot: (name: string | null) => void;
  onUpdatePendingColor: (tagName: string, color: number) => void;
  onUpdateTagColor: (tagName: string, color: number) => void;
  onDeleteTag: (tagName: string) => void;
  onOpenAddTag: () => void;
  onClearTags: () => void;
}

const TagFilterBar: React.FC<TagFilterBarProps> = ({
  tags,
  selectedTags,
  tagMode,
  pendingColorUpdates,
  hoveredColorDot,
  canWrite,
  colorPickerCloseTimerRef,
  onSelectTags,
  onSetTagMode,
  onSetHoveredColorDot,
  onUpdatePendingColor,
  onUpdateTagColor,
  onDeleteTag,
  onOpenAddTag,
  onClearTags,
}) => {
  const intl = useIntl();

  return (
    <div
      style={{
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      <span style={{ fontWeight: 500, marginRight: 4 }}>
        <FormattedMessage
          id="pages.addressBook.tags"
          defaultMessage="Tags"
        />
      </span>
      <Tag
        style={{ cursor: 'pointer', padding: '2px 8px' }}
        color={selectedTags.length === 0 ? 'blue' : undefined}
        onClick={onClearTags}
      >
        <FormattedMessage
          id="pages.addressBook.untagged"
          defaultMessage="Untagged"
        />
      </Tag>
      {(tags as API.TagItem[]).map((tag: API.TagItem) => {
        const displayColor = argbToHex(
          pendingColorUpdates[tag.name] ?? tag.color,
        );
        const isSelected = selectedTags.includes(tag.name);
        return (
          <Tag
            key={tag.name}
            color={isSelected ? displayColor : undefined}
            style={{
              cursor: 'pointer',
              padding: '2px 8px',
              paddingLeft: 0,
            }}
            closable={canWrite}
            closeIcon={
              <Popconfirm
                title={
                  <FormattedMessage
                    id="pages.addressBook.deleteTagConfirm"
                    defaultMessage="Are you sure to delete this tag?"
                  />
                }
                okText={intl.formatMessage({
                  id: 'pages.common.confirm',
                  defaultMessage: 'Yes',
                })}
                cancelText={intl.formatMessage({
                  id: 'pages.common.cancel',
                  defaultMessage: 'No',
                })}
                onConfirm={(e) => {
                  e?.stopPropagation();
                  onDeleteTag(tag.name);
                }}
                onCancel={(e) => {
                  e?.stopPropagation();
                }}
              >
                <span
                  onClick={(e) => e.stopPropagation()}
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
            onClose={(e) => {
              e.preventDefault();
            }}
            onClick={() => {
              onSelectTags((prev) =>
                isSelected
                  ? prev.filter((t) => t !== tag.name)
                  : [...prev, tag.name],
              );
            }}
          >
            <span
              style={{
                paddingLeft: 6,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <ColorPicker
                disabled={!canWrite}
                disabledAlpha
                value={displayColor}
                open={canWrite && hoveredColorDot === tag.name}
                onOpenChange={(open) => {
                  if (!open) {
                    onSetHoveredColorDot(null);
                  }
                }}
                onChange={(colorValue) => {
                  const newArgb = rgbToArgb(colorValue.toRgb());
                  onUpdatePendingColor(tag.name, newArgb);
                }}
                onChangeComplete={(colorValue) => {
                  const newArgb = rgbToArgb(colorValue.toRgb());
                  onUpdateTagColor(tag.name, newArgb);
                }}
                panelRender={(panel) => (
                  <div
                    onMouseEnter={() => {
                      if (colorPickerCloseTimerRef.current) {
                        clearTimeout(colorPickerCloseTimerRef.current);
                        colorPickerCloseTimerRef.current = null;
                      }
                    }}
                    onMouseLeave={() => {
                      colorPickerCloseTimerRef.current = setTimeout(() => {
                        onSetHoveredColorDot(null);
                      }, 100);
                    }}
                  >
                    {panel}
                  </div>
                )}
              >
                <span
                  onMouseEnter={() => {
                    if (!canWrite) return;
                    if (colorPickerCloseTimerRef.current) {
                      clearTimeout(colorPickerCloseTimerRef.current);
                      colorPickerCloseTimerRef.current = null;
                    }
                    onSetHoveredColorDot(tag.name);
                  }}
                  onMouseLeave={() => {
                    if (!canWrite) return;
                    colorPickerCloseTimerRef.current = setTimeout(() => {
                      onSetHoveredColorDot(null);
                    }, 100);
                  }}
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: isSelected ? '#fff' : displayColor,
                    cursor: canWrite ? 'pointer' : 'default',
                  }}
                />
              </ColorPicker>
              <span style={{ display: 'inline-block', width: 8 }} />
            </span>
            {tag.name}
          </Tag>
        );
      })}
      {canWrite && (
        <Button
          size="small"
          type="dashed"
          icon={<PlusOutlined />}
          onClick={onOpenAddTag}
        />
      )}
      {selectedTags.length > 1 && (
        <Radio.Group
          size="small"
          value={tagMode}
          onChange={(e) => {
            onSetTagMode(e.target.value);
          }}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio.Button value="union">
            <FormattedMessage
              id="pages.addressBook.tagModeUnion"
              defaultMessage="Any"
            />
          </Radio.Button>
          <Radio.Button value="intersection">
            <FormattedMessage
              id="pages.addressBook.tagModeIntersection"
              defaultMessage="All"
            />
          </Radio.Button>
        </Radio.Group>
      )}
    </div>
  );
};

export default TagFilterBar;