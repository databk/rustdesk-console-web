import { useLocation, useModel, useNavigate, useParams } from '@umijs/max';
import React from 'react';
import PersonalAddressBook from '@/pages/address-book/personal';

const SharedAddressBookDetail: React.FC = () => {
  const { guid } = useParams<{ guid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { initialState } = useModel('@@initialState');
  const state = location.state as { name?: string; rule?: 1 | 2 | 3 };
  const name = state?.name || '';
  const queryRule = Number(new URLSearchParams(location.search).get('rule'));
  const rule = queryRule >= 1 && queryRule <= 3 ? queryRule : state?.rule || 1;
  const canWrite = initialState?.currentUser?.is_admin === true || rule >= 2;

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
