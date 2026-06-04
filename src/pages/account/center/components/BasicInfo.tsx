import { SaveOutlined } from '@ant-design/icons';
import { useIntl, FormattedMessage, useModel } from '@umijs/max';
import { Button, Card, Form, Input, message as messageApi, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { updateProfile } from '@/services/rustdesk-console';

const BasicInfo: React.FC = () => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const { initialState, refresh } = useModel('@@initialState');
  const { currentUser } = initialState || {};
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({
        name: currentUser.name,
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
          id: 'pages.account.basicInfo.updateSuccess',
          defaultMessage: 'Profile updated successfully',
        }),
      );
      await refresh();
    } catch (error: any) {
      if (error?.errorFields) return;
      messageApi.error(
        intl.formatMessage({
          id: 'pages.account.basicInfo.updateFailed',
          defaultMessage: 'Failed to update profile',
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title={
        <FormattedMessage
          id="pages.account.basicInfo.title"
          defaultMessage="Basic Information"
        />
      }
      extra={
        <Button
          icon={<SaveOutlined />}
          type="primary"
          onClick={handleSave}
          loading={saving}
        >
          <FormattedMessage id="pages.common.save" defaultMessage="Save" />
        </Button>
      }
    >
      <Spin spinning={saving}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={
              <FormattedMessage
                id="pages.account.basicInfo.name"
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
            <Input
              placeholder={intl.formatMessage({
                id: 'pages.common.pleaseEnterUsername',
                defaultMessage: 'Please enter username',
              })}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={
              <FormattedMessage
                id="pages.account.basicInfo.email"
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
                id="pages.account.basicInfo.note"
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
        </Form>
      </Spin>
    </Card>
  );
};

export default BasicInfo;
