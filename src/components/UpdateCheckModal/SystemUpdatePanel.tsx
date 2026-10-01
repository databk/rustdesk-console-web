import { useIntl } from '@umijs/max';
import { Alert, Button, Checkbox, Descriptions, Space, Spin, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { type ComponentChange, isTerminalJob } from '@/services/rustdesk-console/systemUpdate';
import { useSystemUpdate } from './useSystemUpdate';

const { Text, Paragraph, Link } = Typography;
const manualUrl = 'https://github.com/databk/rustdesk-console#readme';

function reasonKey(code?: string) {
  if (!code) return 'blocked';
  if (code === 'HELPER_VERIFY_FAILED') return 'internalUpdateFailed';
  if (/HELPER|UPDATER|SOCKET|NOT_CONFIGURED/.test(code)) return 'helperUnavailable';
  if (/UNSUPPORTED|INSTALLATION|DEPLOYMENT|CONFIG|PLATFORM/.test(code)) return 'deploymentBlocked';
  if (/BACKUP|MYSQL|SQLITE|DATABASE|SPACE|DISK|DATA_DIR/.test(code)) return 'backupBlocked';
  if (/RELEASE|MANIFEST|ARTIFACT|INCOMPATIBLE|SOURCE/.test(code)) return 'releaseBlocked';
  if (/PLAN|CONCURRENT|JOB_ACTIVE|IDEMPOTENCY/.test(code)) return 'planChanged';
  if (/INVALID_RESPONSE|PROTOCOL/.test(code)) return 'protocolMismatch';
  if (/WEB_VERSION/.test(code)) return 'verifyPending';
  return 'requestFailed';
}

const ComponentVersions = ({ components, historical }: { components: ComponentChange[]; historical: boolean }) => {
  const intl = useIntl();
  const text = (key: string) => intl.formatMessage({ id: `app.systemUpdate.${key}` });
  return <Space orientation='vertical' size={12} style={{ width: '100%' }}>
    {components.map(component => <div key={component.component} style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: 12, overflowWrap: 'anywhere' }}>
      <Space wrap>
        <Text strong>{intl.formatMessage({ id: `app.updateCheck.${component.component === 'web' ? 'frontend' : 'backend'}` })}</Text>
        {!historical && <Tag color={component.action === 'update' ? 'blue' : 'default'}>{text(component.action)}</Tag>}
      </Space>
      <Descriptions size='small' column={1} items={[
        { key: 'current', label: text(historical ? 'jobFrom' : 'current'), children: component.current },
        { key: 'target', label: text(historical ? 'jobTarget' : 'target'), children: component.target },
      ]} />
      {component.releaseUrl.startsWith('https://github.com/databk/rustdesk-console') &&
        <Link href={component.releaseUrl} target='_blank' rel='noopener noreferrer'>{intl.formatMessage({ id: 'app.updateCheck.viewRelease' })}</Link>}
    </div>)}
  </Space>;
};

export default function SystemUpdatePanel({ open }: { open: boolean }) {
  const intl = useIntl();
  const text = (key: string, values?: Record<string, string | number>) => intl.formatMessage({ id: `app.systemUpdate.${key}` }, values);
  const update = useSystemUpdate(open);
  const [acknowledged, setAcknowledged] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { setAcknowledged(false); }, [update.plan?.planId, open]);
  useEffect(() => {
    if (!open || !update.plan) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [open, update.plan?.planId]);
  const expired = update.plan ? Date.parse(update.plan.expiresAt) <= now : false;
  const blockers = [...new Map((update.plan?.blockers || update.capabilities?.blockers || []).map(blocker => [JSON.stringify(blocker), blocker])).values()];
  const components = update.job?.components || update.plan?.components;
  const busy = ['checking', 'submitting', 'tracking', 'reconnecting'].includes(update.state);
  const canExecute = update.state === 'preview' && update.plan?.executable && update.plan.changes && !blockers.length && !expired;
  const retryAllowed = update.pending && update.state === 'reconnecting';
  const status = update.job?.status;
  const jobReason = reasonKey(update.job?.resultCode || undefined);
  const internalReason = (key: string) => key === 'helperUnavailable' || key === 'internalUpdateFailed';

  return <Space orientation='vertical' size={12} style={{ width: '100%', marginBottom: 20 }} aria-live='polite'>
    <Text strong>{text('title')}</Text>
    {update.state === 'checking' && <Spin tip={text('checking')}><div style={{ minHeight: 40 }} /></Spin>}
    {update.state === 'unsupported' && <Alert showIcon type='info' title={text('unsupported')} description={<Link href={manualUrl} target='_blank' rel='noopener noreferrer'>{text('manual')}</Link>} />}
    {update.capabilities?.deployment && <Text type='secondary'>{text(update.capabilities.deployment)} · {update.capabilities.database === 'mysql' ? 'MySQL' : 'SQLite'}</Text>}
    {components && <ComponentVersions components={components} historical={Boolean(update.job)} />}
    {blockers.map(blocker => <Alert key={JSON.stringify(blocker)} showIcon type='warning' title={text(reasonKey(blocker.code))} description={internalReason(reasonKey(blocker.code)) ? undefined : blocker.message} />)}
    {update.state === 'blocked' && !blockers.length && <Alert showIcon type='warning' title={text('blocked')} />}
    {update.state === 'blocked' && <Link href={manualUrl} target='_blank' rel='noopener noreferrer'>{text('manual')}</Link>}
    {update.plan && <Space orientation='vertical' style={{ width: '100%' }}>
      {!update.plan.changes && <Alert type='success' showIcon title={text('noChanges')} />}
      {update.plan.changes && <Alert type='warning' showIcon title={text('downtime')} description={text('backup', { database: update.plan.backup.database === 'mysql' ? 'MySQL' : 'SQLite' })} />}
      <Text type='secondary'>{text('expires', { time: new Date(update.plan.expiresAt).toLocaleString() })}</Text>
      {expired && <Alert type='warning' showIcon title={text('planChanged')} />}
    </Space>}
    {(canExecute || retryAllowed) && <Checkbox checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)}>{text('confirm')}</Checkbox>}
    {canExecute && <Button type='primary' disabled={!acknowledged} onClick={() => void update.submit(acknowledged)}>{text('title')}</Button>}
    {update.state === 'submitting' && <Button type='primary' loading disabled>{text('submitting')}</Button>}
    {update.state === 'reconnecting' && <Alert type='warning' showIcon title={text('reconnecting')} description={text('recoveryHelp')} />}
    {retryAllowed && <Button disabled={!acknowledged} onClick={() => void update.submit(acknowledged)}>{text('retrySubmission')}</Button>}
    {update.state === 'auth' && <Alert type='error' showIcon title={text(update.error?.status === 403 ? 'forbidden' : 'loginExpired')} />}
    {update.error && !['auth', 'reconnecting'].includes(update.state) && <Alert type='warning' showIcon title={text(reasonKey(update.error.code))} />}
    {update.job && <>
      <Alert showIcon type={status === 'succeeded' ? 'success' : status === 'queued' || status === 'running' ? 'info' : 'warning'} title={text(`status.${status}`)} description={isTerminalJob(update.job) ? undefined : text(`phase.${update.job.phase}`)} />
      <Paragraph style={{ margin: 0, overflowWrap: 'anywhere' }}>{text('jobId', { id: update.job.jobId })}</Paragraph>
      {update.job.safeMessage && <Paragraph type='secondary' style={{ margin: 0 }}>{internalReason(jobReason) ? text(jobReason) : update.job.safeMessage}</Paragraph>}
      {status === 'recovery_required' && <Alert type='error' title={text('recoveryHelp')} description={update.job.recoveryGuidance || undefined} />}
      {status === 'succeeded' && <>
        <Alert type={update.verified ? 'success' : 'info'} title={text(update.verified ? 'webVerified' : 'verifyPending')} />
        <Button onClick={() => window.location.reload()}>{text('refreshPage')}</Button>
      </>}
    </>}
    {!busy && update.state !== 'auth' && update.state !== 'unsupported' && status !== 'recovery_required' &&
      <Button onClick={() => void (update.capabilities?.ready ? update.preview() : update.reconnect())}>{text('preview')}</Button>}
    {update.state === 'reconnecting' && <Button onClick={update.reconnect}>{text('reconnect')}</Button>}
  </Space>;
}
