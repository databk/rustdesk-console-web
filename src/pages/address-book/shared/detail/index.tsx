import {
  useAccess,
  useLocation,
  useModel,
  useNavigate,
  useParams,
} from '@umijs/max';
import React from 'react';
import PersonalAddressBook from '@/pages/address-book/personal';

const SharedAddressBookDetail: React.FC = () => {
  const { guid } = useParams<{ guid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const access = useAccess();
  const { initialState } = useModel('@@initialState');
  const state = location.state as { name?: string; rule?: 1 | 2 | 3 };
  const name = state?.name || '';
  const rule = state?.rule || 1;
  const canWrite =
    access.canAddressBooksEdit &&
    (initialState?.currentUser?.is_admin === true || rule >= 2);

  return (
    <PersonalAddressBook
      guid={guid}
      title={name}
      canWrite={canWrite}
      onBack={() => navigate('/address-book/shared')}
    />
  );
};

export default SharedAddressBookDetail;
