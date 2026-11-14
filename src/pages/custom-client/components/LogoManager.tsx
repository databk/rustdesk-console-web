import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import type { UploadProps } from 'antd';
import { App, Button, List, Space, Spin, Tag, Upload } from 'antd';
import React from 'react';
import {
  deleteLogo,
  getLogoList,
  uploadLogo,
} from '@/services/rustdesk-console/custom-client';

const ALLOWED_LOGO_FILES = [
  'logo.png',
  'logo_light.png',
  'logo_dark.png',
  'icon.png',
  'icon.ico',
];

interface LogoManagerProps {
  open: boolean;
}

const LogoManager: React.FC<LogoManagerProps> = ({ open }) => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const [logos, setLogos] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploadingFile, setUploadingFile] = React.useState<string | null>(null);
  const reqIdRef = React.useRef(0);

  const loadLogos = React.useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    try {
      const list = await getLogoList();
      if (reqId !== reqIdRef.current) return;
      setLogos(list);
    } catch {
      if (reqId !== reqIdRef.current) return;
      msgApi.error('Failed to load logos');
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [msgApi]);

  React.useEffect(() => {
    if (open) {
      loadLogos();
    }
  }, [open, loadLogos]);

  const handleUpload = async (filename: string, file: File) => {
    setUploadingFile(filename);
    try {
      await uploadLogo(filename, file);
      msgApi.success(`Uploaded ${filename}`);
      await loadLogos();
    } catch {
      msgApi.error(`Failed to upload ${filename}`);
    } finally {
      setUploadingFile(null);
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      await deleteLogo(filename);
      msgApi.success(`Deleted ${filename}`);
      await loadLogos();
    } catch {
      msgApi.error(`Failed to delete ${filename}`);
    }
  };

  const getUploadProps = (filename: string): UploadProps => ({
    accept: filename.endsWith('.ico') ? '.ico' : '.png',
    showUploadList: false,
    beforeUpload: (file) => {
      handleUpload(filename, file);
      return false;
    },
  });

  return (
    <Spin spinning={loading}>
      <List
        size="small"
        dataSource={ALLOWED_LOGO_FILES}
        renderItem={(filename) => {
          const isUploaded = logos.includes(filename);
          const isUploading = uploadingFile === filename;
          return (
            <List.Item
              actions={[
                <Upload key="upload" {...getUploadProps(filename)}>
                  <Button
                    size="small"
                    icon={<UploadOutlined />}
                    loading={isUploading}
                  >
                    {isUploaded ? 'Replace' : 'Upload'}
                  </Button>
                </Upload>,
                isUploaded && (
                  <Button
                    key="delete"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(filename)}
                  />
                ),
              ].filter(Boolean)}
            >
              <Space>
                <span>{filename}</span>
                {isUploaded ? (
                  <Tag color="green">Uploaded</Tag>
                ) : (
                  <Tag color="default">Not uploaded</Tag>
                )}
              </Space>
            </List.Item>
          );
        }}
      />
    </Spin>
  );
};

export default LogoManager;
