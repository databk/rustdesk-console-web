import {
  FormattedMessage,
  useLocation,
  useNavigate,
  useParams,
} from '@umijs/max';
import React from 'react';
import PersonalAddressBook from '@/pages/address-book/personal';

const SharedAddressBookDetail: React.FC = () => {
  const { guid } = useParams<{ guid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const name = (location.state as { name?: string })?.name || '';

  return (
    <PersonalAddressBook
      guid={guid}
      title={name}
      onBack={() => navigate('/address-book/shared')}
    />
  );
};

export default SharedAddressBookDetail;
