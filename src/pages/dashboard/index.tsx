import { PageContainer } from '@ant-design/pro-components';
import { Col, Row, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  getDashboardOverview,
  getDashboardStatistics,
  getDashboardTrends,
  getDashboardRealtime,
} from '@/services/rustdesk-console/dashboard';
import OverviewCards from './OverviewCards';
import ResourceDistribution from './ResourceDistribution';
import OperationAnalysis from './OperationAnalysis';
import SystemStatus from './SystemStatus';
import TrendCharts from './TrendCharts';
import RealtimeTables from './RealtimeTables';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<API.DashboardOverview>();
  const [statistics, setStatistics] = useState<API.DashboardStatistics>();
  const [trends, setTrends] = useState<API.DashboardTrends>();
  const [realtime, setRealtime] = useState<API.DashboardRealtime>();
  const [trendRange, setTrendRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    fetchAllData();
    const realtimeInterval = setInterval(fetchRealtimeData, 10000);
    const overviewInterval = setInterval(fetchOverviewData, 180000);
    const statisticsInterval = setInterval(fetchStatisticsData, 480000);
    return () => {
      clearInterval(realtimeInterval);
      clearInterval(overviewInterval);
      clearInterval(statisticsInterval);
    };
  }, []);

  useEffect(() => {
    fetchTrendData();
  }, [trendRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [overviewData, statisticsData, realtimeData] = await Promise.all([
        getDashboardOverview(),
        getDashboardStatistics(),
        getDashboardRealtime(),
      ]);
      setOverview(overviewData);
      setStatistics(statisticsData);
      setRealtime(realtimeData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendData = async () => {
    try {
      const trendData = await getDashboardTrends({ range: trendRange });
      setTrends(trendData);
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
    }
  };

  const fetchRealtimeData = async () => {
    try {
      const realtimeData = await getDashboardRealtime();
      setRealtime(realtimeData);
    } catch (error) {
      console.error('Failed to fetch realtime data:', error);
    }
  };

  const fetchOverviewData = async () => {
    try {
      const overviewData = await getDashboardOverview();
      setOverview(overviewData);
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
    }
  };

  const fetchStatisticsData = async () => {
    try {
      const statisticsData = await getDashboardStatistics();
      setStatistics(statisticsData);
    } catch (error) {
      console.error('Failed to fetch statistics data:', error);
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
      {/* Area 1: Overview Statistics Cards */}
      <OverviewCards overview={overview} />

      {/* Area 2: Resource Distribution + Operation Analysis */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12} style={{ display: 'flex' }}>
          <ResourceDistribution statistics={statistics} style={{ flex: 1 }} />
        </Col>
        <Col xs={24} lg={12} style={{ display: 'flex' }}>
          <OperationAnalysis
            statistics={statistics}
            overview={overview}
            style={{ flex: 1 }}
          />
        </Col>
      </Row>

      {/* Area 3: System Status + Trend Charts */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={6} style={{ display: 'flex' }}>
          <SystemStatus
            systemStatus={realtime?.systemStatus}
            style={{ flex: 1 }}
          />
        </Col>
        <Col xs={24} lg={18} style={{ display: 'flex' }}>
          <TrendCharts
            trends={trends}
            trendRange={trendRange}
            onTrendRangeChange={setTrendRange}
            style={{ flex: 1 }}
          />
        </Col>
      </Row>

      {/* Area 4: Active Connections + Recent Events */}
      <div style={{ marginTop: 16 }}>
        <RealtimeTables realtime={realtime} />
      </div>
    </PageContainer>
  );
};

export default Dashboard;
