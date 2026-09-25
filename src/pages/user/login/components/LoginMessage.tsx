import { Alert } from 'antd';
import React from 'react';

const LoginMessage: React.FC<{ content: string }> = ({ content }) => (
  <Alert style={{ marginBottom: 24 }} title={content} type="error" showIcon />
);

export default LoginMessage;
