import { useIntl } from '@umijs/max';
import { App, Button, Divider } from 'antd';
import React, { useState } from 'react';
import { oidcAuth } from '@/services/rustdesk-console/auth';
import { getDeviceInfo } from '../utils';
import { useStyles } from '../styles';
import OidcIcon from '@/components/OidcIcon';

interface OidcLoginProps {
  options: API.OidcLoginInfo[];
  loading: boolean;
}

const OidcLogin: React.FC<OidcLoginProps> = ({ options, loading }) => {
  const { styles } = useStyles();
  const intl = useIntl();
  const { message } = App.useApp();
  const [oidcLoading, setOidcLoading] = useState<string>('');

  if (options.length === 0) return null;

  const handleOidcLogin = async (provider: string) => {
    if (loading || oidcLoading) return;

    setOidcLoading(provider);
    try {
      const deviceInfo = getDeviceInfo();
      const callbackUrl = `${window.location.origin}/#/dashboard`;

      const response = await oidcAuth({
        op: provider,
        deviceInfo,
        callbackUrl,
      });

      if (response.url) {
        window.location.href = response.url;
      } else {
        message.error(
          intl.formatMessage({
            id: 'pages.login.oidc.authFailed',
            defaultMessage: 'Failed to get authorization URL',
          }),
        );
      }
    } catch (error: unknown) {
      const err = error as {
        response?: {
          status?: number;
          data?: { error?: string; message?: string };
        };
      };
      const errorMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        intl.formatMessage({
          id: 'pages.login.oidc.authFailed',
          defaultMessage: 'Failed to initiate OIDC login',
        });
      message.error(errorMsg);
    } finally {
      setOidcLoading('');
    }
  };

  return (
    <div className={styles.oidcSection}>
      <Divider className={styles.oidcDivider}>
        {intl.formatMessage({
          id: 'pages.login.oidc.divider',
          defaultMessage: 'Or continue with',
        })}
      </Divider>
      {options.map((item) => {
        return (
          <Button
            key={item.name}
            className={styles.oidcButton}
            disabled={loading || oidcLoading !== ''}
            loading={oidcLoading === item.name}
            onClick={() => handleOidcLogin(item.name)}
          >
            <OidcIcon name={item.name} icon={item.icon} />
            {intl.formatMessage(
              {
                id: 'pages.login.oidc.continueWith',
                defaultMessage: 'Continue with {provider}',
              },
              { provider: item.name },
            )}
          </Button>
        );
      })}
    </div>
  );
};

export default OidcLogin;
