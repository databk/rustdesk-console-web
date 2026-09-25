import { FormattedMessage, useIntl } from '@umijs/max';
import {
  Button,
  Input,
  InputNumber,
  Select,
  Switch,
  Tabs,
  Tooltip,
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import {
  getConfigOptionDescriptionMessageId,
  getConfigOptionLabelMessageId,
  getConfigOptionValueMessageId,
  humanizeConfigOptionKey,
} from '../config/i18n';
import {
  type ConfigOption,
  configCategories,
  configOptionsMap,
  getOptionsByCategory,
} from '../configOptions';

interface ConfigOptionsFormProps {
  value?: Record<string, string>;
  onChange?: (value: Record<string, string>) => void;
  disabled?: boolean;
}

const ConfigOptionControl: React.FC<{
  option: ConfigOption;
  value?: string;
  onChange?: (value: string | undefined) => void;
  disabled?: boolean;
}> = ({ option, value, onChange, disabled }) => {
  const intl = useIntl();

  const isDefault = value === undefined || value === option.defaultValue;

  const formatValue = (rawValue: string) => {
    const messageId = getConfigOptionValueMessageId(option.key, rawValue);
    return messageId
      ? intl.formatMessage({
          id: messageId,
          defaultMessage: rawValue,
        })
      : rawValue;
  };

  const defaultValueLabel = formatValue(option.defaultValue);
  const description = option.description
    ? intl.formatMessage({
        id: getConfigOptionDescriptionMessageId(option.key),
        defaultMessage: option.description,
      })
    : intl.formatMessage(
        {
          id: 'pages.strategies.defaultValue',
          defaultMessage: 'Default: {value}',
        },
        { value: defaultValueLabel },
      );

  const handleReset = () => {
    onChange?.(undefined);
  };

  const labelNode = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Tooltip title={description}>
        <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
          {intl.formatMessage({
            id: getConfigOptionLabelMessageId(option.key),
            defaultMessage: humanizeConfigOptionKey(option.key),
          })}
        </span>
      </Tooltip>
      {!isDefault && (
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#1677ff',
            marginLeft: 2,
          }}
        />
      )}
    </span>
  );

  let control: React.ReactNode;

  switch (option.type) {
    case 'switch': {
      const displayValue = value ?? option.defaultValue;
      control = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Switch
            disabled={disabled}
            checked={displayValue === 'Y'}
            onChange={(checked) => onChange?.(checked ? 'Y' : 'N')}
            checkedChildren={formatValue('Y')}
            unCheckedChildren={formatValue('N')}
          />
          <span style={{ color: '#999', fontSize: 12 }}>
            {isDefault
              ? intl.formatMessage({
                  id: 'pages.strategies.defaultLabel',
                  defaultMessage: 'Default',
                })
              : intl.formatMessage(
                  {
                    id: 'pages.strategies.defaultValue',
                    defaultMessage: 'Default: {value}',
                  },
                  { value: defaultValueLabel },
                )}
          </span>
        </div>
      );
      break;
    }
    case 'select': {
      const selectValue = value ?? option.defaultValue;
      control = (
        <Select
          disabled={disabled}
          value={selectValue}
          onChange={(v) =>
            onChange?.(v === option.defaultValue ? undefined : v)
          }
          allowClear
          placeholder={intl.formatMessage(
            {
              id: 'pages.strategies.defaultValue',
              defaultMessage: 'Default: {value}',
            },
            { value: defaultValueLabel },
          )}
          style={{ width: '100%' }}
        >
          {option.options?.map((opt) => (
            <Select.Option key={opt} value={opt}>
              {formatValue(opt)}
            </Select.Option>
          ))}
        </Select>
      );
      break;
    }
    case 'number': {
      const numValue =
        value !== undefined ? Number(value) : Number(option.defaultValue);
      control = (
        <InputNumber
          disabled={disabled}
          value={numValue}
          onChange={(v) =>
            onChange?.(
              v !== null && v !== undefined && String(v) !== option.defaultValue
                ? String(v)
                : undefined,
            )
          }
          min={option.min}
          max={option.max}
          style={{ width: '100%' }}
          placeholder={intl.formatMessage(
            {
              id: 'pages.strategies.defaultValue',
              defaultMessage: 'Default: {value}',
            },
            { value: defaultValueLabel },
          )}
        />
      );
      break;
    }
    default:
      control = (
        <Input
          disabled={disabled}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value || undefined)}
          placeholder={intl.formatMessage(
            {
              id: 'pages.strategies.defaultValue',
              defaultMessage: 'Default: {value}',
            },
            { value: defaultValueLabel || '-' },
          )}
        />
      );
      break;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '6px 0',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <div style={{ flex: '0 0 320px', paddingRight: 12, lineHeight: '32px' }}>
        {labelNode}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1 }}>{control}</div>
        {!disabled && !isDefault && (
          <Tooltip
            title={intl.formatMessage({
              id: 'pages.strategies.resetToDefault',
              defaultMessage: 'Reset to default',
            })}
          >
            <Button size="small" variant="text" onClick={handleReset}>
              ↺
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

const ConfigOptionsForm: React.FC<ConfigOptionsFormProps> = ({
  value = {},
  onChange,
  disabled = false,
}) => {
  const intl = useIntl();
  const [localValue, setLocalValue] = useState<Record<string, string>>({
    ...value,
  });

  useEffect(() => {
    setLocalValue({ ...value });
  }, [value]);

  const handleChange = useCallback(
    (key: string, val: string | undefined) => {
      const newObj = { ...localValue };
      if (val === undefined || val === '') {
        delete newObj[key];
      } else {
        newObj[key] = val;
      }
      setLocalValue(newObj);
      onChange?.(newObj);
    },
    [localValue, onChange],
  );

  const handleResetAll = useCallback(() => {
    setLocalValue({});
    onChange?.({});
  }, [onChange]);

  const modifiedCount = Object.keys(localValue).filter((key) => {
    const opt = configOptionsMap[key];
    if (!opt) return true;
    return localValue[key] !== opt.defaultValue;
  }).length;

  const tabItems = configCategories.map((cat) => {
    const options = getOptionsByCategory(cat.key);
    return {
      key: cat.key,
      label: (
        <span>
          {intl.formatMessage({
            id: `pages.strategies.category.${cat.key}`,
            defaultMessage: cat.label,
          })}
          <span style={{ color: '#999', fontSize: 12, marginLeft: 4 }}>
            ({options.length})
          </span>
        </span>
      ),
      children: (
        <div>
          {options.map((opt) => (
            <ConfigOptionControl
              key={opt.key}
              option={opt}
              value={localValue[opt.key]}
              disabled={disabled}
              onChange={(val) => handleChange(opt.key, val)}
            />
          ))}
        </div>
      ),
    };
  });

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span style={{ color: '#666', fontSize: 13 }}>
          <FormattedMessage
            id="pages.strategies.modifiedSummary"
            defaultMessage="{count} config(s) modified"
            values={{ count: modifiedCount }}
          />
        </span>
        {!disabled && modifiedCount > 0 && (
          <Button size="small" onClick={handleResetAll}>
            <FormattedMessage
              id="pages.strategies.resetAll"
              defaultMessage="Reset All"
            />
          </Button>
        )}
      </div>
      <Tabs items={tabItems} size="small" />
    </div>
  );
};

export default ConfigOptionsForm;
