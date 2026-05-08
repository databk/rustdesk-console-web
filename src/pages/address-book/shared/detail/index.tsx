import { PageContainer } from '@ant-design/pro-components';
import { useParams } from '@umijs/max';
import React, { useEffect, useState } from 'react';
import { Button, Spin } from 'antd';
import { useNavigate } from '@umijs/max';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getSharedAddressBook } from '@/services/rustdesk-console/addressBook';
import AddressBookContent from '../../components/AddressBookContent';

const SharedAddressBookDetail: React.FC = () => {
  const { guid } = useParams<{ guid: string }>();
  const navigate = useNavigate();
  const [addressBookName, setAddressBookName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAddressBookInfo = async () => {
      if (!guid) return;
      setLoading(true);
      try {
        const result = await getSharedAddressBook(guid);
        setAddressBookName(result.name || '');
      } catch (error) {
        console.error('Failed to fetch shared address book info:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAddressBookInfo();
  }, [guid]);

  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={{
        title: addressBookName || 'Shared Address Book',
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
