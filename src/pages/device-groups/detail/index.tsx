import { useLocation, useNavigate, useParams } from '@umijs/max';
import React from 'react';
import DeviceList from '@/pages/devices/list';

const DeviceGroupDetail: React.FC = () => {
  const { guid } = useParams<{ guid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const name = (location.state as { name?: string })?.name || '';

  return (
    <DeviceList
      deviceGroupGuid={guid}
      title={name}
      onBack={() => navigate('/groups/device')}
    />
  );
};

export default DeviceGroupDetail;
