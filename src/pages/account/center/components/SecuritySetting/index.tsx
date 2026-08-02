import { useIntl, useModel } from '@umijs/max';
import { Col, Form, Row, message as messageApi } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  changePassword,
  deletePasskey,
  disable2FA,
  getPasskeyList,
  getSessions,
  passkeyRegisterBegin,
  passkeyRegisterVerify,
  revokeSession,
  setup2FA,
  togglePasskeyTfa,
  verify2FA,
} from '@/services/rustdesk-console';
import { getTokenJti } from '@/utils/auth';
import {
  isWebAuthnSupported,
  prepareCreationOptions,
  serializeRegistrationResponse,
} from '@/utils/webauthn';
import TwoFactorSection from './components/TwoFactorSection';
import PasskeySection from './components/PasskeySection';
import PasswordSection from './components/PasswordSection';
import SessionSection from './components/SessionSection';

const SecuritySetting: React.FC = () => {
  const intl = useIntl();
  const { initialState, refresh } = useModel('@@initialState');
  const { currentUser } = initialState || {};
  const is2FAEnabled = currentUser?.tfa_enabled === true;
  const isThirdPartyUser = !!currentUser?.third_auth_type;
  const hasPassword = currentUser?.has_password !== false;

  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [setupData, setSetupData] = useState<API.Setup2FAResponse | null>(null);
  const [verifyForm] = Form.useForm<{ code: string }>();

  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableForm] = Form.useForm<{ code: string }>();

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm] = Form.useForm<{
    current_password: string;
    new_password: string;
    confirm_password: string;
  }>();

  const [passkeyList, setPasskeyList] = useState<API.PasskeyCredential[]>([]);
  const [passkeyListLoading, setPasskeyListLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerConfirmLoading, setRegisterConfirmLoading] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [pendingRegistration, setPendingRegistration] =
    useState<API.RegistrationResponseJSON | null>(null);
  const [passkeyTfaLoading, setPasskeyTfaLoading] = useState(false);

  const [sessionList, setSessionList] = useState<API.SessionItem[]>([]);
  const [sessionListLoading, setSessionListLoading] = useState(false);
  const [revokeLoadingJti, setRevokeLoadingJti] = useState<string | null>(null);
  const currentJti = getTokenJti();

  const isPasskeyTfaEnabled =
    currentUser?.info?.other?.passkey_tfa_enabled === true;
  const passkeySupported = isWebAuthnSupported();

  const fetchPasskeyList = async () => {
    setPasskeyListLoading(true);
    try {
      const list = await getPasskeyList();
      setPasskeyList(list);
    } catch {
      // ignore
    } finally {
      setPasskeyListLoading(false);
    }
  };

  useEffect(() => {
    fetchPasskeyList();
  }, []);

  const fetchSessionList = async () => {
    setSessionListLoading(true);
    try {
      const list = await getSessions();
      setSessionList(list);
    } catch {
      // ignore
    } finally {
      setSessionListLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionList();
  }, []);

  const handleRevokeSession = async (jti: string) => {
    setRevokeLoadingJti(jti);
    try {
      await revokeSession(jti);
      messageApi.success(
        intl.formatMessage({
          id: 'pages.account.security.sessions.revokeSuccess',
          defaultMessage: 'Session revoked successfully',
        }),
      );
      await fetchSessionList();
    } catch (error: any) {
      messageApi.error(
        error?.data?.message ||
          intl.formatMessage({
            id: 'pages.account.security.sessions.revokeFailed',
            defaultMessage: 'Failed to revoke session',
          }),
      );
    } finally {
      setRevokeLoadingJti(null);
    }
  };

  const handleRegisterPasskey = async () => {
    setRegisterLoading(true);
    try {
      const options = await passkeyRegisterBegin();
      const publicKey = prepareCreationOptions(options);
      const credential = await navigator.credentials.create({ publicKey });
      if (!credential || !(credential instanceof PublicKeyCredential)) {
        throw new Error('No credential returned');
      }
      const response = serializeRegistrationResponse(credential);
      setPendingRegistration(response);
      setRegisterName('');
      setRegisterModalOpen(true);
    } catch (error: unknown) {
      const err = error as { name?: string };
      if (err?.name !== 'NotAllowedError') {
        messageApi.error(
          intl.formatMessage({
            id: 'pages.account.security.passkey.registerFailed',
            defaultMessage: 'Failed to register Passkey',
          }),
        );
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleConfirmRegister = async () => {
    if (!pendingRegistration) return;
    setRegisterConfirmLoading(true);
    try {
      await passkeyRegisterVerify({
        response: pendingRegistration,
        name: registerName || undefined,
      });
      messageApi.success(
        intl.formatMessage({
          id: 'pages.account.security.passkey.registerSuccess',
          defaultMessage: 'Passkey registered successfully',
        }),
      );
      setRegisterModalOpen(false);
      setPendingRegistration(null);
      await fetchPasskeyList();
      await refresh();
    } catch (error: any) {
      messageApi.error(
        error?.data?.message ||
          intl.formatMessage({
            id: 'pages.account.security.passkey.registerFailed',
            defaultMessage: 'Failed to register Passkey',
          }),
      );
    } finally {
      setRegisterConfirmLoading(false);
    }
  };

  const handleDeletePasskey = async (guid: string) => {
    try {
      await deletePasskey(guid);
      messageApi.success(
        intl.formatMessage({
          id: 'pages.account.security.passkey.deleteSuccess',
          defaultMessage: 'Passkey deleted successfully',
        }),
      );
      await fetchPasskeyList();
      await refresh();
    } catch (error: any) {
      messageApi.error(
        error?.data?.message ||
          intl.formatMessage({
            id: 'pages.account.security.passkey.deleteFailed',
            defaultMessage: 'Failed to delete Passkey',
          }),
      );
    }
  };

  const handleTogglePasskeyTfa = async (enabled: boolean) => {
    setPasskeyTfaLoading(true);
    try {
      await togglePasskeyTfa({ enabled });
      messageApi.success(
        intl.formatMessage({
          id: enabled
            ? 'pages.account.security.passkey.tfaEnabled'
            : 'pages.account.security.passkey.tfaDisabled',
          defaultMessage: enabled
            ? 'Passkey TFA enabled'
            : 'Passkey TFA disabled',
        }),
      );
      await refresh();
    } catch (error: any) {
      messageApi.error(
        error?.data?.message ||
          intl.formatMessage({
            id: 'pages.account.security.passkey.tfaToggleFailed',
            defaultMessage: 'Failed to toggle Passkey TFA',
          }),
      );
    } finally {
      setPasskeyTfaLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    try {
      setSetupLoading(true);
      const data = await setup2FA();
      setSetupData(data);
      setSetupModalOpen(true);
    } catch (error: any) {
      messageApi.error(
        error?.data?.message ||
          intl.formatMessage({
            id: 'pages.account.security.setupFailed',
            defaultMessage: 'Failed to setup 2FA',
          }),
      );
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    try {
      const values = await verifyForm.validateFields();
      setVerifyLoading(true);
      await verify2FA({ code: values.code });
      messageApi.success(
        intl.formatMessage({
          id: 'pages.account.security.enableSuccess',
          defaultMessage: '2FA enabled successfully',
        }),
      );
      setSetupModalOpen(false);
      setSetupData(null);
      verifyForm.resetFields();
      await refresh();
    } catch (error: any) {
      if (error?.errorFields) return;
      messageApi.error(
        error?.data?.message ||
          intl.formatMessage({
            id: 'pages.account.security.enableFailed',
            defaultMessage: 'Failed to enable 2FA',
          }),
      );
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      const values = await disableForm.validateFields();
      setDisableLoading(true);
      await disable2FA({ code: values.code });
      messageApi.success(
        intl.formatMessage({
          id: 'pages.account.security.disableSuccess',
          defaultMessage: '2FA disabled successfully',
        }),
      );
      setDisableModalOpen(false);
      disableForm.resetFields();
      await refresh();
    } catch (error: any) {
      if (error?.errorFields) return;
      messageApi.error(
        error?.data?.message ||
          intl.formatMessage({
            id: 'pages.account.security.disableFailed',
            defaultMessage: 'Failed to disable 2FA',
          }),
      );
    } finally {
      setDisableLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      setPasswordLoading(true);
      await changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      messageApi.success(
        intl.formatMessage({
          id: 'pages.account.security.changePasswordSuccess',
          defaultMessage: 'Password changed successfully',
        }),
      );
      setPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (error: any) {
      if (error?.errorFields) return;
      messageApi.error(
        error?.data?.message ||
          intl.formatMessage({
            id: 'pages.account.security.changePasswordFailed',
            defaultMessage: 'Failed to change password',
          }),
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangePasswordClick = () => {
    if (isThirdPartyUser) {
      messageApi.warning(
        intl.formatMessage({
          id: 'pages.account.security.thirdPartyUser',
          defaultMessage: 'Third-party login users cannot change password',
        }),
      );
      return;
    }
    if (!hasPassword) {
      messageApi.warning(
        intl.formatMessage({
          id: 'pages.account.security.noPasswordUser',
          defaultMessage: 'No password set for this account',
        }),
      );
      return;
    }
    setPasswordModalOpen(true);
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={10}>
        <TwoFactorSection
          is2FAEnabled={is2FAEnabled}
          setupModalOpen={setupModalOpen}
          setupLoading={setupLoading}
          verifyLoading={verifyLoading}
          setupData={setupData}
          verifyForm={verifyForm}
          disableModalOpen={disableModalOpen}
          disableLoading={disableLoading}
          disableForm={disableForm}
          onSetup={handleSetup2FA}
          onVerify={handleVerify2FA}
          onDisable={handleDisable2FA}
          onOpenDisable={() => setDisableModalOpen(true)}
          onCloseSetup={() => {
            setSetupModalOpen(false);
            setSetupData(null);
            verifyForm.resetFields();
          }}
          onCloseDisable={() => {
            setDisableModalOpen(false);
            disableForm.resetFields();
          }}
        />
      </Col>

      <Col xs={24} md={14}>
        <PasskeySection
          passkeySupported={passkeySupported}
          passkeyList={passkeyList}
          passkeyListLoading={passkeyListLoading}
          registerLoading={registerLoading}
          registerModalOpen={registerModalOpen}
          registerConfirmLoading={registerConfirmLoading}
          registerName={registerName}
          isPasskeyTfaEnabled={isPasskeyTfaEnabled}
          passkeyTfaLoading={passkeyTfaLoading}
          onRegisterNameChange={setRegisterName}
          onRegister={handleRegisterPasskey}
          onConfirmRegister={handleConfirmRegister}
          onDelete={handleDeletePasskey}
          onToggleTfa={handleTogglePasskeyTfa}
          onCloseRegister={() => {
            setRegisterModalOpen(false);
            setPendingRegistration(null);
          }}
        />
      </Col>

      <Col xs={24} md={10}>
        <PasswordSection
          isThirdPartyUser={isThirdPartyUser}
          hasPassword={hasPassword}
          passwordModalOpen={passwordModalOpen}
          passwordLoading={passwordLoading}
          passwordForm={passwordForm}
          onChangePasswordClick={handleChangePasswordClick}
          onSubmit={handleChangePassword}
          onCancel={() => {
            setPasswordModalOpen(false);
            passwordForm.resetFields();
          }}
        />
      </Col>

      <Col xs={24} md={14}>
        <SessionSection
          sessionList={sessionList}
          sessionListLoading={sessionListLoading}
          revokeLoadingJti={revokeLoadingJti}
          currentJti={currentJti}
          onRevoke={handleRevokeSession}
        />
      </Col>
    </Row>
  );
};

export default SecuritySetting;
