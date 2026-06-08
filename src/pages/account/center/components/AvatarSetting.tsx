import {
  DeleteOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useIntl, FormattedMessage, useModel } from '@umijs/max';
import {
  Avatar,
  Button,
  Card,
  message as messageApi,
  Popconfirm,
  Space,
  Upload,
  Typography,
} from 'antd';
import React, { useState } from 'react';
import { uploadAvatar, deleteAvatar } from '@/services/rustdesk-console';
import { getAvatarUrl } from '@/utils/avatar';

const { Text } = Typography;

const AvatarSetting: React.FC = () => {
  const intl = useIntl();
  const { initialState, refresh } = useModel('@@initialState');
  const { currentUser } = initialState || {};
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const avatarUrl = getAvatarUrl(currentUser?.avatar);

  const handleUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      messageApi.error(
        intl.formatMessage({
          id: 'pages.account.avatar.fileTooLarge',
          defaultMessage: 'File size cannot exceed 2MB',
        }),
      );
      return false;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      messageApi.error(
        intl.formatMessage({
          id: 'pages.account.avatar.invalidFormat',
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
          id: 'pages.account.avatar.uploadSuccess',
          defaultMessage: 'Avatar uploaded successfully',
        }),
      );
      await refresh();
    } catch {
      messageApi.error(
        intl.formatMessage({
          id: 'pages.account.avatar.uploadFailed',
          defaultMessage: 'Failed to upload avatar',
        }),
      );
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteAvatar();
      messageApi.success(
        intl.formatMessage({
          id: 'pages.account.avatar.deleteSuccess',
          defaultMessage: 'Avatar deleted successfully',
        }),
      );
      await refresh();
    } catch {
      messageApi.error(
        intl.formatMessage({
          id: 'pages.account.avatar.deleteFailed',
          defaultMessage: 'Failed to delete avatar',
        }),
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card
      title={
        <FormattedMessage
          id="pages.account.avatar.title"
          defaultMessage="Avatar Settings"
        />
      }
    >
      <Space
        direction="vertical"
        align="center"
        style={{ width: '100%' }}
        size="large"
      >
        <Avatar
          size={128}
          src={avatarUrl}
          icon={!avatarUrl && <UserOutlined />}
          style={{ backgroundColor: avatarUrl ? undefined : '#1677ff' }}
        />
        <Text type="secondary">
          <FormattedMessage
            id="pages.account.avatar.hint"
            defaultMessage="Supports JPG, PNG, WebP, max 2MB, will be resized to 256x256"
          />
        </Text>
        <Space>
          <Upload
            showUploadList={false}
            beforeUpload={handleUpload}
            accept=".jpg,.jpeg,.png,.webp"
          >
            <Button icon={<UploadOutlined />} loading={uploading}>
              <FormattedMessage
                id="pages.account.avatar.upload"
                defaultMessage="Upload Avatar"
              />
            </Button>
          </Upload>
          {currentUser?.avatar && (
            <Popconfirm
              title={
                <FormattedMessage
                  id="pages.account.avatar.deleteConfirm"
                  defaultMessage="Are you sure to delete your avatar?"
                />
              }
              onConfirm={handleDelete}
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
                  id="pages.account.avatar.delete"
                  defaultMessage="Delete Avatar"
                />
              </Button>
            </Popconfirm>
          )}
        </Space>
      </Space>
    </Card>
  );
};

export default AvatarSetting;
