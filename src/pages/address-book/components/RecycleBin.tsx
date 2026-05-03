import { Modal, Empty } from 'antd';
import { useIntl } from '@umijs/max';

type RecycleBinProps = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  personal: boolean;
  profile: API.SharedAbProfile;
  abTags: API.AbTag[];
  closeChangedCallback: () => void;
};

const RecycleBin: React.FC<RecycleBinProps> = (props) => {
  const intl = useIntl();

  return (
    <Modal
      title={intl.formatMessage({
        id: 'pages.addressBook.recycleBin',
        defaultMessage: 'Recycle Bin',
      })}
      open={props.visible}
      onCancel={() => props.setVisible(false)}
      footer={null}
      width={800}
    >
      <Empty
        description={intl.formatMessage({
          id: 'pages.addressBook.recycleBinEmpty',
          defaultMessage: 'Recycle bin is empty',
        })}
      />
    </Modal>
  );
};

export default RecycleBin;
