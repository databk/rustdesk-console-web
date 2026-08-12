export type ConfigOptionType = 'switch' | 'select' | 'number' | 'text';

export type ConfigOption = {
  key: string;
  label: string;
  category: string;
  type: ConfigOptionType;
  defaultValue: string;
  options?: string[];
  min?: number;
  max?: number;
  description?: string;
};

export type ConfigCategory = {
  key: string;
};
