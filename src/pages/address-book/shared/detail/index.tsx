import { PageContainer } from '@ant-design/pro-components';
import { useParams } from '@umijs/max';
import React from 'react';
import { Button } from 'antd';
import { useNavigate } from '@umijs/max';
import { ArrowLeftOutlined } from '@ant-design/icons';
import AddressBookContent from '../../components/AddressBookContent';

const SharedAddressBookDetail: React.FC = () => {
  const { guid } = useParams<{ guid: string }>();
  const navigate = useNavigate();

  return (
    <PageContainer
      header={{
        title: 'Shared Address Book',
        extra: [
          <Button
            key="back"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/address-book/shared/list')}
          >
            Back to List
          </Button>,
        ],
      }}
    >
      <AddressBookContent abGuid={guid!} />
    </PageContainer>
  );
};

export default SharedAddressBookDetail;
