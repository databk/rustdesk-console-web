import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Alert, Collapse, Modal, Tag, Timeline } from 'antd';
import React from 'react';
import { getBuildProgress } from '@/services/rustdesk-console/custom-client';

interface ProgressModalProps {
  uuid: string;
  open: boolean;
  onClose: () => void;
}

const stepIcon = (
  status: string,
  conclusion: string | null,
): React.ReactNode => {
  if (status === 'completed' && conclusion === 'success')
    return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
  if (status === 'completed' && conclusion === 'failure')
    return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
  if (status === 'in_progress')
    return <LoadingOutlined style={{ color: '#1890ff' }} />;
  if (status === 'queued') return <ClockCircleOutlined />;
  return <MinusCircleOutlined />;
};

const jobColor = (status: string, conclusion: string | null): string => {
  if (status === 'completed' && conclusion === 'success') return 'success';
  if (status === 'completed' && conclusion === 'failure') return 'error';
  if (status === 'in_progress') return 'processing';
  if (status === 'queued') return 'default';
  return 'warning';
};

const ProgressModal: React.FC<ProgressModalProps> = ({
  uuid,
  open,
  onClose,
}) => {
  const intl = useIntl();
  const [progress, setProgress] =
    React.useState<API.CustomClientBuildProgress | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchProgress = React.useCallback(async () => {
    try {
      const data = await getBuildProgress(uuid);
      setProgress(data);
      setError(null);
    } catch {
      setError('Failed to fetch build progress');
    }
  }, [uuid]);

  React.useEffect(() => {
    if (open) {
      fetchProgress();
      pollRef.current = setInterval(fetchProgress, 5000);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [open, fetchProgress]);

  const isDone =
    progress?.runStatus === 'completed' ||
    progress?.runConclusion === 'failure' ||
    progress?.runConclusion === 'success';

  React.useEffect(() => {
    if (isDone && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [isDone]);

  return (
    <Modal
      title={intl.formatMessage({
        id: 'pages.customClient.buildProgress',
        defaultMessage: 'Build Progress',
      })}
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnHidden
    >
      {error && <Alert type="error" message={error} showIcon />}
      {progress && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Tag
              color={jobColor(progress.runStatus, progress.runConclusion)}
            >
              {progress.runStatus}
            </Tag>
            {progress.runConclusion && (
              <Tag>{progress.runConclusion}</Tag>
            )}
          </div>
          <Collapse
            items={progress.jobs.map((job, idx) => ({
              key: String(idx),
              label: (
                <span>
                  <Tag color={jobColor(job.status, job.conclusion)}>
                    {job.name}
                  </Tag>
                </span>
              ),
              children: (
                <Timeline
                  items={job.steps.map((step) => ({
                    dot: stepIcon(step.status, step.conclusion),
                    children: (
                      <span>
                        {step.name}
                        {step.status === 'in_progress' && (
                          <Tag
                            color="processing"
                            style={{ marginLeft: 8 }}
                          >
                            running
                          </Tag>
                        )}
                      </span>
                    ),
                  }))}
                />
              ),
            }))}
            defaultActiveKey={progress.jobs
              .map((j, i) => ({ j, i }))
              .filter(({ j }) => j.status === 'in_progress')
              .map(({ i }) => String(i))}
          />
        </>
      )}
    </Modal>
  );
};

export default ProgressModal;
