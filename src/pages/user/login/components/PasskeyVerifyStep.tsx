import { ArrowLeftOutlined, KeyOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Typography } from 'antd';
import React, { useEffect, useRef } from 'react';
import LoginMessage from './LoginMessage';
import { useStyles } from '../styles';

interface PasskeyVerifyStepProps {
  error: string;
  submitting: boolean;
  onVerify: () => void;
  onBack: () => void;
}

const PasskeyVerifyStep: React.FC<PasskeyVerifyStepProps> = ({
  error,
  submitting,
  onVerify,
  onBack,
}) => {
  const { styles } = useStyles();
  const intl = useIntl();
  const verifyRef = useRef(onVerify);
  verifyRef.current = onVerify;

  useEffect(() => {
    verifyRef.current();
  }, []);

  return (
    <div className={styles.verifySection}>
      {error && <LoginMessage content={error} />}

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <KeyOutlined className={styles.verifyIcon} />
        <Typography.Title level={5}>
          {intl.formatMessage({
            id: 'pages.login.passkeyCheck.title',
            defaultMessage: 'Passkey Verification',
          })}
        </Typography.Title>
        <Typography.Text className={styles.verifyHint}>
          {intl.formatMessage({
            id: 'pages.login.passkeyCheck.description',
            defaultMessage: 'Use your Passkey to complete sign-in',
          })}
        </Typography.Text>
      </div>

      <Button
        type="primary"
        size="large"
        block
        loading={submitting}
        icon={<KeyOutlined />}
        onClick={onVerify}
      >
        {intl.formatMessage({
          id: 'pages.login.passkey.verify',
          defaultMessage: 'Verify with Passkey',
        })}
      </Button>

      <Button
        size="large"
        block
        style={{ marginTop: 12 }}
        icon={<ArrowLeftOutlined />}
        onClick={onBack}
      >
        {intl.formatMessage({
          id: 'pages.login.back',
          defaultMessage: 'Back',
        })}
      </Button>
    </div>
  );
};

export default PasskeyVerifyStep;