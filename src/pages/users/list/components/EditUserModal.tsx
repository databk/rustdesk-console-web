import { FormattedMessage, useIntl } from '@umijs/max';
import { Form, Input, Modal, Select, Switch } from 'antd';
import type { FormInstance } from 'antd';
import React from 'react';

interface EditUserModalProps {
  visible: boolean;
  userGroups: API.UserGroupItem[];
  userGroupsLoading: boolean;
  form: FormInstance<API.UpdateUserParams>;
  onSubmit: (values: API.UpdateUserParams) => Promise<void>;
  onCancel: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  visible,
  userGroups,
  userGroupsLoading,
  form,
  onSubmit,
  onCancel,
}) => {
  const intl = useIntl();

  return (
    <Modal
      title={<FormattedMessage id="pages.users.edit" defaultMessage="Edit User" />}
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <Form form={form} onFinish={onSubmit} layout="vertical">
        <Form.Item
          name="name"
          label={
            <FormattedMessage
              id="pages.users.name"
              defaultMessage="Username"
            />
          }
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'pages.common.pleaseEnterUsername',
                defaultMessage: 'Please enter username',
              }),
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="display_name"
          label={
            <FormattedMessage
              id="pages.users.displayName"
              defaultMessage="Display Name"
            />
          }
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="email"
          label={
            <FormattedMessage
              id="pages.users.email"
              defaultMessage="Email"
            />
          }
          rules={[
            {
              type: 'email',
              message: intl.formatMessage({
                id: 'pages.common.pleaseEnterValidEmail',
                defaultMessage: 'Please enter valid email',
              }),
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="note"
          label={<FormattedMessage id="pages.users.note" defaultMessage="Note" />}
        >
          <Input.TextArea />
        </Form.Item>
        <Form.Item
          name="status"
          label={
            <FormattedMessage
              id="pages.users.status"
              defaultMessage="Status"
            />
          }
        >
          <Select
            options={[
              {
                label: intl.formatMessage({
                  id: 'pages.users.active',
                  defaultMessage: 'Active',
                }),
                value: 1,
              },
              {
                label: intl.formatMessage({
                  id: 'pages.users.disabled',
                  defaultMessage: 'Disabled',
                }),
                value: 0,
              },
              {
                label: intl.formatMessage({
                  id: 'pages.users.unverified',
                  defaultMessage: 'Unverified',
                }),
                value: -1,
              },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="user_group_guid"
          label={
            <FormattedMessage
              id="pages.users.userGroup"
              defaultMessage="User Group"
            />
          }
        >
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            loading={userGroupsLoading}
            placeholder={intl.formatMessage({
              id: 'pages.users.selectUserGroup',
              defaultMessage: 'Select user group',
            })}
            options={userGroups.map((group) => ({
              label: group.name,
              value: group.guid,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="is_admin"
          label={
            <FormattedMessage
              id="pages.users.isAdmin"
              defaultMessage="Admin"
            />
          }
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditUserModal;