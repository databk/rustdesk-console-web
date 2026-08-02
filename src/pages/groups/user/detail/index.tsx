import { useLocation, useNavigate, useParams } from '@umijs/max';
import React from 'react';
import UserList from '@/pages/users/list';

const UserGroupDetail: React.FC = () => {
  const { guid } = useParams<{ guid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const name = (location.state as { name?: string })?.name || '';

  return (
    <UserList
      userGroupGuid={guid}
      title={name}
      onBack={() => navigate('/groups/user')}
    />
  );
};

export default UserGroupDetail;
