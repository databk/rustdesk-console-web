import { PageContainer } from '@ant-design/pro-components';
import { Spin } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  getDashboard,
  getDashboardTrends,
} from '@/services/rustdesk-console/dashboard';
import DashboardContent from './DashboardContent';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<API.DashboardData>();
  const [trends, setTrends] = useState<API.DashboardTrends>();
  const [trendRange, setTrendRange] = useState<'7d' | '30d' | '90d'>('7d');
  const trendRequestGeneration = useRef(0);

  useEffect(() => {
    fetchDashboardData();
    const dataInterval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(dataInterval);
  }, []);

  useEffect(() => {
    fetchTrendData();
  }, [trendRange]);

  const fetchDashboardData = async () => {
    try {
      const dashboardData = await getDashboard();
      setData(dashboardData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendData = async () => {
    const generation = ++trendRequestGeneration.current;
    try {
      const trendData = await getDashboardTrends({ range: trendRange });
      if (generation === trendRequestGeneration.current) {
        setTrends(trendData);
      }
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Spin
          size="large"
          style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <DashboardContent
        data={data}
        trends={trends}
        trendRange={trendRange}
        onTrendRangeChange={setTrendRange}
      />
    </PageContainer>
  );
};

export default Dashboard;
