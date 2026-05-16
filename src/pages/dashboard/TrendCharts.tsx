import { ApiOutlined, UserOutlined, AlertOutlined } from '@ant-design/icons';
import { Area, Column } from '@ant-design/plots';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Card, Select, Space, Tabs, Typography } from 'antd';
import React, { type CSSProperties, useMemo, useState } from 'react';

const { Text } = Typography;

interface TrendChartsProps {
  trends?: API.DashboardTrends;
  trendRange: '7d' | '30d' | '90d';
  onTrendRangeChange: (range: '7d' | '30d' | '90d') => void;
  style?: CSSProperties;
}

const noDataPlaceholder = (
  <div
    style={{
      height: 280,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Text type="secondary">
      <FormattedMessage id="pages.dashboard.noData" defaultMessage="No data" />
    </Text>
  </div>
);

const TrendCharts: React.FC<TrendChartsProps> = ({
  trends,
  trendRange,
  onTrendRangeChange,
  style,
}) => {
  const intl = useIntl();

  const connectionChartData = useMemo(() => {
    if (!trends?.connectionTrend) return [];
    return trends.connectionTrend.flatMap((item) => [
      {
        date: item.date,
        value: item.count,
        type: intl.formatMessage({
          id: 'pages.dashboard.connectionCount',
          defaultMessage: 'Count',
        }),
      },
      {
        date: item.date,
        value: item.avgDuration,
        type: intl.formatMessage({
          id: 'pages.dashboard.avgDuration',
          defaultMessage: 'Avg Duration',
        }),
      },
    ]);
  }, [trends?.connectionTrend, intl]);

  const userActiveChartData = useMemo(() => {
    if (!trends?.userActiveTrend) return [];
    return trends.userActiveTrend.flatMap((item) => [
      {
        date: item.date,
        value: item.newUsers,
        type: intl.formatMessage({
          id: 'pages.dashboard.newUsers',
          defaultMessage: 'New Users',
        }),
      },
      {
        date: item.date,
        value: item.activeUsers,
        type: intl.formatMessage({
          id: 'pages.dashboard.activeUsers',
          defaultMessage: 'Active Users',
        }),
      },
    ]);
  }, [trends?.userActiveTrend, intl]);

  const alarmChartData = useMemo(() => {
    if (!trends?.alarmTrend) return [];
    return trends.alarmTrend.flatMap((item) => [
      { date: item.date, value: item.critical, type: 'Critical' },
      { date: item.date, value: item.warning, type: 'Warning' },
      { date: item.date, value: item.info, type: 'Info' },
    ]);
  }, [trends?.alarmTrend]);

  return (
    <Card
      style={style}
      size="small"
      title={
        <Space>
          <FormattedMessage
            id="pages.dashboard.trendData"
            defaultMessage="Trend Data"
          />
          <Select
            value={trendRange}
            onChange={onTrendRangeChange}
            size="small"
            options={[
              {
                value: '7d',
                label: intl.formatMessage({
                  id: 'pages.dashboard.7days',
                  defaultMessage: '7 Days',
                }),
              },
              {
                value: '30d',
                label: intl.formatMessage({
                  id: 'pages.dashboard.30days',
                  defaultMessage: '30 Days',
                }),
              },
              {
                value: '90d',
                label: intl.formatMessage({
                  id: 'pages.dashboard.90days',
                  defaultMessage: '90 Days',
                }),
              },
            ]}
            style={{ width: 100 }}
          />
        </Space>
      }
    >
      <Tabs
        defaultActiveKey="connection"
        items={[
          {
            key: 'connection',
            label: (
              <Space size={4}>
                <ApiOutlined />
                <FormattedMessage
                  id="pages.dashboard.connectionTrend"
                  defaultMessage="Connection Trend"
                />
              </Space>
            ),
            children:
              connectionChartData.length > 0 ? (
                <Area
                  data={connectionChartData}
                  xField="date"
                  yField="value"
                  colorField="type"
                  height={280}
                  legend={{ position: 'top-right' }}
                  axis={{
                    y: { title: false },
                    x: { title: false },
                  }}
                />
              ) : (
                noDataPlaceholder
              ),
          },
          {
            key: 'user',
            label: (
              <Space size={4}>
                <UserOutlined />
                <FormattedMessage
                  id="pages.dashboard.userActiveTrend"
                  defaultMessage="User Active Trend"
                />
              </Space>
            ),
            children:
              userActiveChartData.length > 0 ? (
                <Column
                  data={userActiveChartData}
                  xField="date"
                  yField="value"
                  colorField="type"
                  group
                  height={280}
                  legend={{ position: 'top-right' }}
                  axis={{
                    y: { title: false },
                    x: { title: false },
                  }}
                />
              ) : (
                noDataPlaceholder
              ),
          },
          {
            key: 'alarm',
            label: (
              <Space size={4}>
                <AlertOutlined />
                <FormattedMessage
                  id="pages.dashboard.alarmTrend"
                  defaultMessage="Alarm Trend"
                />
              </Space>
            ),
            children:
              alarmChartData.length > 0 ? (
                <Column
                  data={alarmChartData}
                  xField="date"
                  yField="value"
                  colorField="type"
                  group
                  height={280}
                  color={['#f5222d', '#faad14', '#1890ff']}
                  legend={{ position: 'top-right' }}
                  axis={{
                    y: { title: false },
                    x: { title: false },
                  }}
                />
              ) : (
                noDataPlaceholder
              ),
          },
        ]}
      />
    </Card>
  );
};

export default TrendCharts;
