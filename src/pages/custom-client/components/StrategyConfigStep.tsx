import { FormattedMessage, useIntl } from '@umijs/max';
import {
  Input,
  InputNumber,
  Select,
  Switch,
  Tabs,
  Tooltip,
  Segmented,
  Empty,
} from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getStrategyList } from '@/services/rustdesk-console';
import {
  type ConfigOption,
  configCategories,
  configOptionsMap,
  getOptionsByCategory,
} from '@/pages/strategy/configOptions';
import {
  getConfigOptionDescriptionMessageId,
  getConfigOptionLabelMessageId,
  getConfigOptionValueMessageId,
  humanizeConfigOptionKey,
} from '@/pages/strategy/config/i18n';

export type StrategyConfigMode = 'off' | 'default' | 'override';

export type StrategyConfigItemValue = {
  mode: StrategyConfigMode;
  value: string;
};

export type StrategyConfigValues = Record<string, StrategyConfigItemValue>;

interface StrategyConfigStepProps {
  value?: StrategyConfigValues;
  onChange?: (value: StrategyConfigValues) => void;
}

const ConfigOptionControl: React.FC<{
  option: ConfigOption;
  itemValue?: StrategyConfigItemValue;
  onChange?: (val: StrategyConfigItemValue) => void;
}> = ({ option, itemValue, onChange }) => {
  const intl = useIntl();

  const mode: StrategyConfigMode = itemValue?.mode ?? 'off';
  const value: string = itemValue?.value ?? option.defaultValue;

  const formatValue = (rawValue: string) => {
    const messageId = getConfigOptionValueMessageId(option.key, rawValue);
    return messageId
      ? intl.formatMessage({ id: messageId, defaultMessage: rawValue })
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
      {mode !== 'off' && (
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: mode === 'override' ? '#ff4d4f' : '#1677ff',
            marginLeft: 2,
          }}
        />
      )}
    </span>
  );

  const handleModeChange = (newMode: StrategyConfigMode) => {
    if (newMode === 'off') {
      onChange?.({ mode: 'off', value: option.defaultValue });
    } else {
      onChange?.({ mode: newMode, value: value || option.defaultValue });
    }
  };

  const handleValueChange = (newVal: string | undefined) => {
    onChange?.({ mode, value: newVal ?? '' });
  };

  let control: React.ReactNode;

  const disabled = mode === 'off';

  switch (option.type) {
    case 'switch': {
      const displayValue = mode === 'off' ? option.defaultValue : value;
      control = (
        <Switch
          disabled={disabled}
          checked={displayValue === 'Y'}
          onChange={(checked) => handleValueChange(checked ? 'Y' : 'N')}
          checkedChildren={formatValue('Y')}
          unCheckedChildren={formatValue('N')}
        />
      );
      break;
    }
    case 'select': {
      const selectValue = mode === 'off' ? option.defaultValue : value;
      control = (
        <Select
          disabled={disabled}
          value={selectValue}
          onChange={(v) => handleValueChange(v)}
          allowClear
          style={{ width: '100%' }}
          placeholder={formatValue(option.defaultValue)}
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
        mode === 'off' ? Number(option.defaultValue) : Number(value);
      control = (
        <InputNumber
          disabled={disabled}
          value={numValue}
          onChange={(v) =>
            handleValueChange(
              v !== null && v !== undefined ? String(v) : undefined,
            )
          }
          min={option.min}
          max={option.max}
          style={{ width: '100%' }}
          placeholder={formatValue(option.defaultValue)}
        />
      );
      break;
    }
    default: {
      const textValue = mode === 'off' ? '' : value;
      control = (
        <Input
          disabled={disabled}
          value={textValue}
          onChange={(e) => handleValueChange(e.target.value || undefined)}
          placeholder={formatValue(option.defaultValue) || '-'}
        />
      );
      break;
    }
  }

  const modeOptions = [
    {
      value: 'off' as StrategyConfigMode,
      label: intl.formatMessage({
        id: 'pages.customClient.strategyModeOff',
        defaultMessage: 'Off',
      }),
    },
    {
      value: 'default' as StrategyConfigMode,
      label: intl.formatMessage({
        id: 'pages.customClient.strategyModeDefault',
        defaultMessage: 'Default',
      }),
    },
    {
      value: 'override' as StrategyConfigMode,
      label: intl.formatMessage({
        id: 'pages.customClient.strategyModeOverride',
        defaultMessage: 'Override',
      }),
    },
  ];

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
      <div style={{ flex: '0 0 260px', paddingRight: 12, lineHeight: '32px' }}>
        {labelNode}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1 }}>{control}</div>
        <Segmented
          size="small"
          value={mode}
          onChange={handleModeChange}
          options={modeOptions}
        />
      </div>
    </div>
  );
};

const StrategyConfigStep: React.FC<StrategyConfigStepProps> = ({
  value = {},
  onChange,
}) => {
  const intl = useIntl();
  const [strategyList, setStrategyList] = useState<API.StrategyItem[]>([]);
  const [selectedStrategyGuid, setSelectedStrategyGuid] = useState<
    string | undefined
  >();
  const [localValue, setLocalValue] = useState<StrategyConfigValues>({
    ...value,
  });

  useEffect(() => {
    setLocalValue({ ...value });
  }, [value]);

  useEffect(() => {
    getStrategyList({ pageSize: 100 })
      .then((res) => {
        setStrategyList(res.data || []);
      })
      .catch(() => {
        setStrategyList([]);
      });
  }, []);

  const handleChange = useCallback(
    (key: string, val: StrategyConfigItemValue) => {
      const newObj = { ...localValue };
      if (val.mode === 'off') {
        delete newObj[key];
      } else {
        newObj[key] = val;
      }
      setLocalValue(newObj);
      onChange?.(newObj);
    },
    [localValue, onChange],
  );

  const handleStrategySelect = (guid: string) => {
    setSelectedStrategyGuid(guid);
    const strategy = strategyList.find((s) => s.guid === guid);
    const configOptions = strategy?.config_options ?? {};
    const newValues: StrategyConfigValues = {};
    Object.entries(configOptions).forEach(([key, val]) => {
      if (configOptionsMap[key]) {
        newValues[key] = { mode: 'default', value: val };
      }
    });
    setLocalValue(newValues);
    onChange?.(newValues);
  };

  const handleClearStrategy = () => {
    setSelectedStrategyGuid(undefined);
    setLocalValue({});
    onChange?.({});
  };

  const activeCount = Object.keys(localValue).filter(
    (key) => localValue[key]?.mode !== 'off',
  ).length;
  const overrideCount = Object.keys(localValue).filter(
    (key) => localValue[key]?.mode === 'override',
  ).length;
  const defaultCount = Object.keys(localValue).filter(
    (key) => localValue[key]?.mode === 'default',
  ).length;

  const allCategories = useMemo(() => configCategories, []);
  const tabItems = useMemo(
    () =>
      allCategories.map((cat) => {
        const options = getOptionsByCategory(cat.key);
        const categoryActiveCount = options.filter(
          (opt) => localValue[opt.key]?.mode !== 'off',
        ).length;
        return {
          key: cat.key,
          label: (
            <span>
              {intl.formatMessage({
                id: `pages.strategies.category.${cat.key}`,
                defaultMessage: cat.label,
              })}
              {categoryActiveCount > 0 && (
                <span style={{ color: '#1677ff', fontSize: 12, marginLeft: 4 }}>
                  ({categoryActiveCount})
                </span>
              )}
            </span>
          ),
          children: (
            <div>
              {options.map((opt) => (
                <ConfigOptionControl
                  key={opt.key}
                  option={opt}
                  itemValue={localValue[opt.key]}
                  onChange={(val) => handleChange(opt.key, val)}
                />
              ))}
            </div>
          ),
        };
      }),
    [allCategories, localValue, handleChange, intl],
  );

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          gap: 12,
        }}
      >
        <Select
          style={{ flex: 1 }}
          allowClear
          placeholder={intl.formatMessage({
            id: 'pages.customClient.selectStrategyPlaceholder',
            defaultMessage: 'Select a strategy as base preset (optional)',
          })}
          value={selectedStrategyGuid}
          onChange={(val) => {
            if (val) {
              handleStrategySelect(val);
            } else {
              handleClearStrategy();
            }
          }}
          options={strategyList.map((s) => ({
            value: s.guid,
            label: s.name,
          }))}
        />
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {defaultCount > 0 && (
            <span style={{ color: '#1677ff', fontSize: 12 }}>
              <FormattedMessage
                id="pages.customClient.defaultCount"
                defaultMessage="{count} default"
                values={{ count: defaultCount }}
              />
            </span>
          )}
          {overrideCount > 0 && (
            <span style={{ color: '#ff4d4f', fontSize: 12 }}>
              <FormattedMessage
                id="pages.customClient.overrideCount"
                defaultMessage="{count} override"
                values={{ count: overrideCount }}
              />
            </span>
          )}
          {activeCount === 0 && (
            <span style={{ color: '#999', fontSize: 12 }}>
              <FormattedMessage
                id="pages.customClient.noConfigSelected"
                defaultMessage="No config selected"
              />
            </span>
          )}
        </div>
      </div>

      {allCategories.length === 0 ? (
        <Empty
          description={intl.formatMessage({
            id: 'pages.customClient.noStrategyOptions',
            defaultMessage: 'No strategy options available',
          })}
        />
      ) : (
        <Tabs items={tabItems} size="small" />
      )}
    </div>
  );
};

export default StrategyConfigStep;
