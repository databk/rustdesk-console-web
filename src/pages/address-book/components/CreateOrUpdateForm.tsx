import { Modal, Form, Input, Select, message } from 'antd';
import { useState } from 'react';
import { useIntl } from '@umijs/max';
import { addPeer, updatePeer } from '@/services/rustdesk-console/addressBook';

type CreateOrUpdateFormProps = {
  isCreate: boolean;
  visible: boolean;
  setModalVisible: (visible: boolean) => void;
  actionRef: any;
  initialValues: API.AbPeer | undefined;
  personal: boolean;
  profile: API.SharedAbProfile;
  abTags: API.AbTag[];
};

const CreateOrUpdateForm: React.FC<CreateOrUpdateFormProps> = (props) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const intl = useIntl();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (props.isCreate) {
        await addPeer(props.profile.guid, {
          id: values.id,
          alias: values.alias,
          note: values.note,
          tags: values.tags,
        });
        message.success(
          intl.formatMessage({
            id: 'pages.addressBook.peerAdded',
            defaultMessage: 'Peer added successfully',
          }),
        );
      } else {
        await updatePeer(props.profile.guid, {
          id: props.initialValues?.id,
          alias: values.alias,
          note: values.note,
          tags: values.tags,
        });
        message.success(
          intl.formatMessage({
            id: 'pages.addressBook.peerUpdated',
            defaultMessage: 'Peer updated successfully',
          }),
        );
      }

      props.setModalVisible(false);
      form.resetFields();
      props.actionRef.current?.reload();
    } catch (error) {
      message.error(
        intl.formatMessage({
          id: props.isCreate
            ? 'pages.addressBook.peerAddFailed'
            : 'pages.addressBook.peerUpdateFailed',
          defaultMessage: props.isCreate
            ? 'Failed to add peer'
            : 'Failed to update peer',
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={intl.formatMessage({
        id: props.isCreate
          ? 'pages.addressBook.addPeer'
          : 'pages.common.edit',
        defaultMessage: props.isCreate ? 'Add Peer' : 'Edit',
      })}
      open={props.visible}
      onCancel={() => {
        props.setModalVisible(false);
        form.resetFields();
      }}
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={
          props.isCreate
            ? {}
            : {
                id: props.initialValues?.id,
                alias: props.initialValues?.alias,
                note: props.initialValues?.note,
                tags: props.initialValues?.tags,
              }
        }
      >
        <Form.Item
          name="id"
          label={intl.formatMessage({
            id: 'pages.common.id',
            defaultMessage: 'ID',
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'pages.common.pleaseEnterPeerId',
                defaultMessage: 'Please enter peer ID',
              }),
            },
          ]}
        >
          <Input disabled={!props.isCreate} />
        </Form.Item>
        <Form.Item
          name="alias"
          label={intl.formatMessage({
            id: 'pages.addressBook.alias',
            defaultMessage: 'Alias',
          })}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="note"
          label={intl.formatMessage({
            id: 'pages.addressBook.note',
            defaultMessage: 'Note',
          })}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item
          name="tags"
          label={intl.formatMessage({
            id: 'pages.addressBook.tags',
            defaultMessage: 'Tags',
          })}
        >
          <Select
            mode="multiple"
            placeholder={intl.formatMessage({
              id: 'pages.addressBook.selectTags',
              defaultMessage: 'Select tags',
            })}
            options={props.abTags.map((tag) => ({
              label: tag.name,
              value: tag.name,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateOrUpdateForm;
