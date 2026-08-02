import { ArrowLeftOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Typography } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import LoginMessage from './LoginMessage';
import { useStyles } from '../styles';

interface VerifyStepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  resetKey: string;
  error: string;
  submitting: boolean;
  onSubmit: (code: string) => void;
  onBack: () => void;
}

const VerifyStep: React.FC<VerifyStepProps> = ({
  icon,
  title,
  description,
  resetKey,
  error,
  submitting,
  onSubmit,
  onBack,
}) => {
  const { styles } = useStyles();
  const intl = useIntl();
  const [otpValue, setOtpValue] = useState('');
  const submittingRef = useRef(false);

  useEffect(() => {
    setOtpValue('');
    submittingRef.current = false;
  }, [resetKey]);

  useEffect(() => {
    if (!submitting) {
      submittingRef.current = false;
    }
  }, [submitting]);

  const handleSubmit = useCallback(
    (code: string) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      onSubmit(code);
    },
    [onSubmit],
  );

  const handleChange = useCallback(
    (value: string) => {
      setOtpValue(value);
      if (value.length === 6) {
        handleSubmit(value);
      }
    },
    [handleSubmit],
  );

  return (
    <div className={styles.verifySection}>
      {error && <LoginMessage content={error} />}

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        {icon}
        <Typography.Title level={5}>{title}</Typography.Title>
        <Typography.Text className={styles.verifyHint}>
          {description}
        </Typography.Text>
      </div>

      <Input.OTP
        key={resetKey}
        length={6}
        value={otpValue}
        onChange={handleChange}
        variant="outlined"
        size="large"
        autoFocus
        className={styles.otpInput}
      />

      <Button
        type="primary"
        size="large"
        block
        loading={submitting}
        disabled={otpValue.length < 6}
        onClick={() => handleSubmit(otpValue)}
      >
        {intl.formatMessage({
          id: 'pages.login.verifyCode.submit',
          defaultMessage: 'Verify',
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

export default VerifyStep;