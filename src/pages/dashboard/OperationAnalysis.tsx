import {
  ApiOutlined,
  FileOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { FormattedMessage } from '@umijs/max';
import { Card, Col, Row, Space, Statistic, Typography } from 'antd';
import React, { type CSSProperties } from 'react';

const { Text } = Typography;

const sectionStyle: CSSProperties = {
  padding: '12px 0',
};

const sectionTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#8c8c8c',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

interface OperationAnalysisProps {
  statistics?: API.DashboardStatistics;
  overview?: API.DashboardOverview;
  style?: CSSProperties;
}

const OperationAnalysis: React.FC<OperationAnalysisProps> = ({
  statistics,
  overview,
  style,
}) => {
  return (
    <Card
      style={style}
      title={
        <Space>
          <ApiOutlined style={{ color: '#722ed1' }} />
          <FormattedMessage
            id="pages.dashboard.operationAnalysis"
            defaultMessage="Operation Analysis"
          />
        </Space>
      }
      size="small"
      styles={{ body: { padding: '8px 16px' } }}
    >
      {/* Connection Analysis */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <ApiOutlined style={{ color: '#722ed1', marginRight: 6 }} />
          <FormattedMessage
            id="pages.dashboard.connectionAnalysis"
            defaultMessage="Connection Analysis"
          />
        </div>
        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title={
                <FormattedMessage
                  id="pages.dashboard.successRate"
                  defaultMessage="Success Rate"
                />
              }
              value={statistics?.connectionAnalysis.successRate || 0}
              suffix="%"
              valueStyle={{ color: '#52c41a', fontSize: 20 }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title={
                <FormattedMessage
                  id="pages.dashboard.failureCount"
                  defaultMessage="Failure Count"
                />
              }
              value={statistics?.connectionAnalysis.failureCount || 0}
              valueStyle={{ color: '#f5222d', fontSize: 20 }}
              prefix={<CloseCircleOutlined />}
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 4 }}>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <FormattedMessage
                id="pages.dashboard.avgDuration"
                defaultMessage="Avg Duration"
              />
              : {statistics?.connectionAnalysis.avgDuration || 0}{' '}
              <FormattedMessage id="pages.dashboard.min" defaultMessage="min" />
            </Text>
          </Col>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <FormattedMessage
                id="pages.dashboard.totalDuration"
                defaultMessage="Total Duration"
              />
              : {statistics?.connectionAnalysis.totalDuration || 0}{' '}
              <FormattedMessage id="pages.dashboard.min" defaultMessage="min" />
            </Text>
          </Col>
        </Row>
      </div>

      {/* File Transfer */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <FileOutlined style={{ color: '#13c2c2', marginRight: 6 }} />
          <FormattedMessage
            id="pages.dashboard.fileTransfer"
            defaultMessage="File Transfer"
          />
        </div>
        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title={
                <FormattedMessage
                  id="pages.dashboard.uploadCount"
                  defaultMessage="Upload"
                />
              }
              value={statistics?.fileTransfer.uploadCount || 0}
              valueStyle={{ fontSize: 20 }}
              prefix={<CloudUploadOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title={
                <FormattedMessage
                  id="pages.dashboard.downloadCount"
                  defaultMessage="Download"
                />
              }
              value={statistics?.fileTransfer.downloadCount || 0}
              valueStyle={{ fontSize: 20 }}
              prefix={<CloudDownloadOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 4 }}>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <FormattedMessage
                id="pages.dashboard.transferredToday"
                defaultMessage="Today"
              />
              : {overview?.files.transferred || 0}
            </Text>
          </Col>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <FormattedMessage
                id="pages.dashboard.totalSize"
                defaultMessage="Total Size"
              />
              : {overview?.files.totalSize || '0 B'}
            </Text>
          </Col>
        </Row>
      </div>
    </Card>
  );
};

export default OperationAnalysis;
