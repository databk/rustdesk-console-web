import { Modal, Form, Select, message } from 'antd';
import { useState } from 'react';
import { useIntl } from '@umijs/max';
import { setAbPeersTags } from '@/services/rustdesk-console/addressBook';

type SetTagModalProps = {
  visible: boolean;
  setModalVisible: (visible: boolean) => void;
  actionRef: any;
  profile: API.SharedAbProfile;
  abPeers: API.AbPeer[];
  abTags: API.AbTag[];
};

const SetTagModal: React.FC<SetTagModalProps> = (props) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const intl = useIntl();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await setAbPeersTags({
        guids: props.abPeers.map((x) => x.guid),
        tags: values.tags || [],
        ab: props.profile.guid,
      });
      message.success(
        intl.formatMessage({
          id: 'pages.addressBook.setTagsSuccess',
          defaultMessage: 'Tags set successfully',
        }),
      );
      props.setModalVisible(false);
      form.resetFields();
      props.actionRef.current?.reload();
    } catch (error) {
      message.error(
        intl.formatMessage({
          id: 'pages.addressBook.setTagsFailed',
          defaultMessage: 'Failed to set tags',
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={intl.formatMessage({
        id: 'pages.addressBook.setTags',
        defaultMessage: 'Set Tags',
      })}
      open={props.visible}
      onCancel={() => {
        props.setModalVisible(false);
        form.resetFields();
      }}
      onOk={handleOk}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
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

export default SetTagModal;
