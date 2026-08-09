import {
  DeleteOutlined,
  SaveOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useIntl, FormattedMessage, useModel } from '@umijs/max';
import {
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  message as messageApi,
  Popconfirm,
  Row,
  Space,
  Spin,
  Typography,
  Upload,
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
  updateProfile,
  uploadAvatar,
  deleteAvatar,
} from '@/services/rustdesk-console';

const { Text } = Typography;

const BasicInfo: React.FC = () => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const { initialState, refresh } = useModel('@@initialState');
  const { currentUser } = initialState || {};
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);

  const rawAvatarUrl = currentUser?.avatar;
  const avatarUrl =
    rawAvatarUrl && avatarVersion > 0
      ? `${rawAvatarUrl}${rawAvatarUrl.includes('?') ? '&' : '?'}v=${avatarVersion}`
      : rawAvatarUrl;

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({
        display_name: currentUser.display_name,
        email: currentUser.email,
        note: currentUser.note,
      });
    }
  }, [currentUser]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await updateProfile(values);
      messageApi.success(
        intl.formatMessage({
          id: 'pages.user.center.basicInfo.updateSuccess',
          defaultMessage: 'Profile updated successfully',
        }),
      );
      await refresh();
    } catch (error: any) {
      if (error?.errorFields) return;
      messageApi.error(
        intl.formatMessage({
          id: 'pages.user.center.basicInfo.updateFailed',
          defaultMessage: 'Failed to update profile',
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      messageApi.error(
        intl.formatMessage({
          id: 'pages.user.center.avatar.fileTooLarge',
          defaultMessage: 'File size cannot exceed 2MB',
        }),
      );
      return false;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      messageApi.error(
        intl.formatMessage({
          id: 'pages.user.center.avatar.invalidFormat',
          defaultMessage: 'Only JPG, PNG, WebP formats are supported',
        }),
      );
      return false;
    }

    try {
      setUploading(true);
      await uploadAvatar(file);
      messageApi.success(
        intl.formatMessage({
          id: 'pages.user.center.avatar.uploadSuccess',
          defaultMessage: 'Avatar uploaded successfully',
        }),
      );
      setAvatarVersion(Date.now());
      await refresh();
    } catch {
      messageApi.error(
        intl.formatMessage({
          id: 'pages.user.center.avatar.uploadFailed',
          defaultMessage: 'Failed to upload avatar',
        }),
      );
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleDeleteAvatar = async () => {
    try {
      setDeleting(true);
      await deleteAvatar();
      messageApi.success(
        intl.formatMessage({
          id: 'pages.user.center.avatar.deleteSuccess',
          defaultMessage: 'Avatar deleted successfully',
        }),
      );
      setAvatarVersion(0);
      await refresh();
    } catch {
      messageApi.error(
        intl.formatMessage({
          id: 'pages.user.center.avatar.deleteFailed',
          defaultMessage: 'Failed to delete avatar',
        }),
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Spin spinning={saving}>
      <Row gutter={24}>
        {/* Left: Avatar Card */}
        <Col xs={24} md={8}>
          <Card
            style={{ textAlign: 'center' }}
            styles={{
              body: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              },
            }}
          >
            <Avatar
              size={120}
              src={avatarUrl}
              icon={!avatarUrl && <UserOutlined />}
              style={{ backgroundColor: avatarUrl ? undefined : '#1677ff' }}
            />
            <Space>
              <Upload
                showUploadList={false}
                beforeUpload={handleUpload}
                accept=".jpg,.jpeg,.png,.webp"
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  <FormattedMessage
                    id="pages.user.center.avatar.upload"
                    defaultMessage="Upload Avatar"
                  />
                </Button>
              </Upload>
              {avatarUrl && (
                <Popconfirm
                  title={
                    <FormattedMessage
                      id="pages.user.center.avatar.deleteConfirm"
                      defaultMessage="Are you sure to delete your avatar?"
                    />
                  }
                  onConfirm={handleDeleteAvatar}
                  okText={
                    <FormattedMessage
                      id="pages.common.confirm"
                      defaultMessage="Yes"
                    />
                  }
                  cancelText={
                    <FormattedMessage
                      id="pages.common.cancel"
                      defaultMessage="No"
                    />
                  }
                >
                  <Button icon={<DeleteOutlined />} danger loading={deleting}>
                    <FormattedMessage
                      id="pages.user.center.avatar.delete"
                      defaultMessage="Delete Avatar"
                    />
                  </Button>
                </Popconfirm>
              )}
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <FormattedMessage
                id="pages.user.center.avatar.hint"
                defaultMessage="Supports JPG, PNG, WebP, max 2MB, will be resized to 256x256"
              />
            </Text>
          </Card>
        </Col>

        {/* Right: Form Card */}
        <Col xs={24} md={16}>
          <Card>
            <Form form={form} layout="vertical">
              <Form.Item
                label={
                  <FormattedMessage
                    id="pages.user.center.basicInfo.name"
                    defaultMessage="Username"
                  />
                }
              >
                <Input value={currentUser?.name} disabled />
              </Form.Item>

              <Form.Item
                name="display_name"
                label={
                  <FormattedMessage
                    id="pages.user.center.basicInfo.displayName"
                    defaultMessage="Display Name"
                  />
                }
              >
                <Input
                  placeholder={intl.formatMessage({
                    id: 'pages.user.center.basicInfo.displayNamePlaceholder',
                    defaultMessage: 'Enter display name',
                  })}
                />
              </Form.Item>

              <Form.Item
                name="email"
                label={
                  <FormattedMessage
                    id="pages.user.center.basicInfo.email"
                    defaultMessage="Email"
                  />
                }
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'pages.common.pleaseEnterEmail',
                      defaultMessage: 'Please enter email',
                    }),
                  },
                  {
                    type: 'email',
                    message: intl.formatMessage({
                      id: 'pages.common.pleaseEnterValidEmail',
                      defaultMessage: 'Please enter valid email',
                    }),
                  },
                ]}
              >
                <Input
                  placeholder={intl.formatMessage({
                    id: 'pages.common.pleaseEnterEmail',
                    defaultMessage: 'Please enter email',
                  })}
                />
              </Form.Item>

              <Form.Item
                name="note"
                label={
                  <FormattedMessage
                    id="pages.user.center.basicInfo.note"
                    defaultMessage="Note"
                  />
                }
              >
                <Input.TextArea
                  rows={4}
                  placeholder={intl.formatMessage({
                    id: 'pages.common.enterDescription',
                    defaultMessage: 'Enter description',
                  })}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={saving}
                >
                  <FormattedMessage
                    id="pages.common.save"
                    defaultMessage="Save"
                  />
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </Spin>
  );
};

export default BasicInfo;
