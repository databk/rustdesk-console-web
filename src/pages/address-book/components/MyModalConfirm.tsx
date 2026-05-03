import { Modal } from 'antd';
import { ReactNode } from 'react';

type MyModalConfirmProps = {
  title: string;
  onConfirm: () => void;
  okText?: string;
  cancelText?: string;
  children: ReactNode;
};

const MyModalConfirm: React.FC<MyModalConfirmProps> = (props) => {
  const handleClick = () => {
    Modal.confirm({
      title: props.title,
      content: props.children,
      okText: props.okText || 'OK',
      cancelText: props.cancelText || 'Cancel',
      onOk: props.onConfirm,
    });
  };

  return <span onClick={handleClick}>{props.children}</span>;
};

export default MyModalConfirm;
