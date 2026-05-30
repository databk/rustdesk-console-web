import { FormattedMessage } from '@umijs/max';
import { Alert, Descriptions, Modal, Typography } from 'antd';
import React from 'react';

interface TestResultModalProps {
  open: boolean;
  onClose: () => void;
  result: API.OidcTestResult | null;
}

const TestResultModal: React.FC<TestResultModalProps> = ({
  open,
  onClose,
  result,
}) => {
  return (
    <Modal
      title={
        <FormattedMessage
          id="pages.oidcProviders.testResult"
          defaultMessage="Test Connection Result"
        />
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
    >
      {result && (
        <>
          <Alert
            type={result.success ? 'success' : 'error'}
            message={result.message}
            showIcon
            style={{ marginBottom: 16 }}
          />
          {result.success && result.endpoints && (
            <Descriptions
              column={1}
              size="small"
              bordered
              title={
                <FormattedMessage
                  id="pages.oidcProviders.discoveredEndpoints"
                  defaultMessage="Discovered Endpoints"
                />
              }
            >
              <Descriptions.Item
                label={
                  <FormattedMessage
                    id="pages.oidcProviders.authorizationEndpoint"
                    defaultMessage="Authorization Endpoint"
                  />
                }
              >
                <Typography.Text copyable code>
                  {result.endpoints.authorization_endpoint}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <FormattedMessage
                    id="pages.oidcProviders.tokenEndpoint"
                    defaultMessage="Token Endpoint"
                  />
                }
              >
                <Typography.Text copyable code>
                  {result.endpoints.token_endpoint}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <FormattedMessage
                    id="pages.oidcProviders.userinfoEndpoint"
                    defaultMessage="Userinfo Endpoint"
                  />
                }
              >
                <Typography.Text copyable code>
                  {result.endpoints.userinfo_endpoint}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <FormattedMessage
                    id="pages.oidcProviders.jwksUri"
                    defaultMessage="JWKS URI"
                  />
                }
              >
                <Typography.Text copyable code>
                  {result.endpoints.jwks_uri}
                </Typography.Text>
              </Descriptions.Item>
            </Descriptions>
          )}
        </>
      )}
    </Modal>
  );
};

export default TestResultModal;
