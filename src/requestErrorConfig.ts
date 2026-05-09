import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { history } from '@umijs/max';
import { message, notification } from 'antd';
import { getToken, removeToken } from '@/utils/auth';

const loginPath = '/user/login';

enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  REDIRECT = 9,
}

interface ResponseStructure {
  success: boolean;
  data: any;
  errorCode?: number;
  errorMessage?: string;
  showType?: ErrorShowType;
}

export const errorConfig: RequestConfig = {
  errorConfig: {
    errorThrower: (res) => {
      const { success, data, errorCode, errorMessage, showType } =
        res as unknown as ResponseStructure;
      if (!success) {
        const error: any = new Error(errorMessage);
        error.name = 'BizError';
        error.info = { errorCode, errorMessage, showType, data };
        throw error;
      }
    },
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;
      if (error.name === 'BizError') {
        const errorInfo: ResponseStructure | undefined = error.info;
        if (errorInfo) {
          const { errorMessage, errorCode } = errorInfo;
          switch (errorInfo.showType) {
            case ErrorShowType.SILENT:
              break;
            case ErrorShowType.WARN_MESSAGE:
              message.warning(errorMessage);
              break;
            case ErrorShowType.ERROR_MESSAGE:
              message.error(errorMessage);
              break;
            case ErrorShowType.NOTIFICATION:
              notification.open({
                description: errorMessage,
                message: errorCode,
              });
              break;
            case ErrorShowType.REDIRECT:
              break;
            default:
              message.error(errorMessage);
          }
        }
      } else if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          removeToken();
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
          history.push(loginPath);
          message.error('Login expired, please login again');
          return;
        }
        if (status === 403) {
          message.error('Access denied');
          return;
        }
        message.error(`Response status: ${status}`);
      } else if (error.request) {
        message.error('No response received, please retry.');
      } else {
        message.error('Request error, please retry.');
      }
    },
  },

  requestInterceptors: [
    (config: RequestOptions) => {
      const token = getToken();
      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
  ],

  responseInterceptors: [
    (response) => {
      return response;
    },
  ],
};
