import {
  CameraOutlined,
  CodeOutlined,
  FileSyncOutlined,
  FundProjectionScreenOutlined,
  QuestionOutlined,
  RetweetOutlined,
} from '@ant-design/icons';
import React from 'react';

export const renderConnTypeIcon = (type?: number) => {
  switch (type) {
    case -1:
      return <QuestionOutlined />;
    case 0:
      return <FundProjectionScreenOutlined />;
    case 1:
      return <FileSyncOutlined />;
    case 2:
      return <RetweetOutlined />;
    case 3:
      return <CameraOutlined />;
    case 4:
      return <CodeOutlined />;
    default:
      return <QuestionOutlined />;
  }
};

export const getConnTypeMsgId = (type?: number): string => {
  switch (type) {
    case -1:
      return 'pages.audits.connType.notLoggedIn';
    case 0:
      return 'pages.audits.connType.remoteDesktop';
    case 1:
      return 'pages.audits.connType.fileTransfer';
    case 2:
      return 'pages.audits.connType.portTransfer';
    case 3:
      return 'pages.audits.connType.viewCamera';
    case 4:
      return 'pages.audits.connType.terminal';
    default:
      return 'pages.audits.connType.notLoggedIn';
  }
};
