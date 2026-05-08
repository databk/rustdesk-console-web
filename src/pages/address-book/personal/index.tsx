import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage } from '@umijs/max';
import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { getPersonalAddressBook } from '@/services/rustdesk-console/addressBook';
import AddressBookContent from '../components/AddressBookContent';

const PersonalAddressBook: React.FC = () => {
  const [abGuid, setAbGuid] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAbGuid = async () => {
      setLoading(true);
      try {
        const result = await getPersonalAddressBook();
        setAbGuid(result.guid);
      } catch (error) {
        console.error('Failed to fetch personal address book:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAbGuid();
  }, []);

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
    <PageContainer>
      <AddressBookContent abGuid={abGuid!} />
    </PageContainer>
  );
};

export default PersonalAddressBook;
