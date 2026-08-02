import { useIntl } from '@umijs/max';
import { Form, message as messageApi } from 'antd';
import type { FormInstance } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import {
  getLdapConfig,
  testLdapConfig,
  updateLdapConfig,
} from '@/services/rustdesk-console';

interface ConfigInfo {
  createdAt?: string;
  updatedAt?: string;
}

interface UseLdapConfigResult {
  loading: boolean;
  saving: boolean;
  testing: boolean;
  configExists: boolean;
  configInfo: ConfigInfo;
  form: FormInstance;
  handleSave: () => Promise<void>;
  handleTest: () => Promise<void>;
}

export const useLdapConfig = (): UseLdapConfigResult => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configExists, setConfigExists] = useState(false);
  const [configInfo, setConfigInfo] = useState<ConfigInfo>({});

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const config = await getLdapConfig();
      if (config) {
        setConfigExists(true);
        setConfigInfo({
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
        });
        form.setFieldsValue({
          urls: config.urls || [],
          bindDN: config.bindDN,
          bindCredentials: '******',
          searchBase: config.searchBase,
          searchFilter: config.searchFilter,
          searchAttributes: config.searchAttributes || [],
          groupSearchBase: config.groupSearchBase,
          groupSearchFilter: config.groupSearchFilter,
          adminGroups: config.adminGroups || [],
          tlsOptions: config.tlsOptions || {},
          enabled: config.enabled,
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch LDAP config:', error);
      if (error?.response?.status === 404) {
        setConfigExists(false);
      } else {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const submitData: any = {
        urls: values.urls?.filter((u: string) => u?.trim()),
        bindDN: values.bindDN,
        searchBase: values.searchBase,
        searchFilter: values.searchFilter,
        searchAttributes: values.searchAttributes?.filter((a: string) =>
          a?.trim(),
        ),
        groupSearchBase: values.groupSearchBase,
        groupSearchFilter: values.groupSearchFilter,
        adminGroups: values.adminGroups?.filter((g: string) => g?.trim()),
        tlsOptions: values.tlsOptions,
        enabled: values.enabled,
      };

      if (values.bindCredentials && values.bindCredentials !== '******') {
        submitData.bindCredentials = values.bindCredentials;
      }

      await updateLdapConfig(submitData);
      messageApi.success(
        intl.formatMessage({
          id: 'pages.ldap.saveSuccess',
          defaultMessage: 'LDAP configuration saved successfully',
        }),
      );

      await fetchConfig();
    } catch (error: any) {
      console.error('Failed to save LDAP config:', error);
      if (error?.errorFields) {
        return;
      }
      messageApi.error(
        intl.formatMessage({
          id: 'pages.ldap.saveFailed',
          defaultMessage: 'Failed to save LDAP configuration',
        }),
      );
    } finally {
      setSaving(false);
    }
  }, [form, intl, fetchConfig]);

  const handleTest = useCallback(async () => {
    try {
      const values = await form.validateFields([
        'urls',
        'bindDN',
        'searchBase',
        'searchFilter',
      ]);
      setTesting(true);

      const testData: any = {
        urls: values.urls?.filter((u: string) => u?.trim()),
        bindDN: values.bindDN,
        searchBase: values.searchBase,
        searchFilter: values.searchFilter,
      };

      const password = form.getFieldValue('bindCredentials');
      if (password && password !== '******') {
        testData.bindCredentials = password;
      }

      const result = await testLdapConfig(testData);

      if (result.success) {
        messageApi.success(
          result.message ||
            intl.formatMessage({
              id: 'pages.ldap.testSuccess',
              defaultMessage: 'LDAP connection test successful',
            }),
        );
      } else {
        messageApi.error(
          result.message ||
            intl.formatMessage({
              id: 'pages.ldap.testFailed',
              defaultMessage: 'LDAP connection test failed',
            }),
        );
      }
    } catch (error: any) {
      console.error('Failed to test LDAP config:', error);
      if (error?.errorFields) {
        return;
      }
      messageApi.error(
        intl.formatMessage({
          id: 'pages.ldap.testFailed',
          defaultMessage: 'LDAP connection test failed',
        }),
      );
    } finally {
      setTesting(false);
    }
  }, [form, intl]);

  return {
    loading,
    saving,
    testing,
    configExists,
    configInfo,
    form,
    handleSave,
    handleTest,
  };
};