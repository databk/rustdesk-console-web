import React, { useEffect, useId, useRef, useState } from 'react';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import styles from './index.less';

type Text = (key: string, fallback: string) => string;
export function LegacyEncryptionNotice({
  text,
  context = 'desktop',
  version,
}: {
  text: Text;
  context?: 'desktop' | 'files';
  version?: string;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hover || focus || pinned;
  useEffect(() => {
    if (!pinned) return;
    const close = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setPinned(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [pinned]);
  return (
    <div
      ref={root}
      className={styles.legacyNotice}
      data-legacy-notice
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setFocus(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocus(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          setHover(false);
          setFocus(false);
          setPinned(false);
        }
      }}
    >
      <button
        type="button"
        className={styles.legacyTrigger}
        aria-label={text(
          context === 'files' ? 'legacyFileBadge' : 'legacyBadge',
          context === 'files'
            ? 'File connection: legacy encryption'
            : 'Legacy encryption',
        )}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setPinned(!pinned);
          setHover(false);
          setFocus(false);
        }}
      >
        <SafetyCertificateOutlined />
        {text(
          context === 'files' ? 'legacyFileBadge' : 'legacyBadge',
          context === 'files'
            ? 'File connection: legacy encryption'
            : 'Legacy encryption',
        )}
      </button>
      <div id={id} hidden={!open} className={styles.legacyPopover} role="note">
        <strong>{text('legacyTitle', 'About this encryption warning')}</strong>
        {version && (
          <div className={styles.legacyVersion}>
            {text('remoteVersion', 'Remote client')}: {version}
          </div>
        )}
        <p>
          {text(
            'legacyRisk',
            'This connection uses an older key exchange with a risk of key and nonce reuse across directions. This can weaken confidentiality; it does not mean the connection is unencrypted.',
          )}
        </p>
        <p>
          {text(
            'legacyUpgrade',
            'RustDesk 1.4.9 still uses this exchange. We verified a specific official 1.5.0 nightly build with the new exchange; a stable release containing this change has not been verified. Upgrade the remote client and reconnect; the negotiated exchange determines this warning.',
          )}
        </p>
        <small>
          {text(
            'legacyVerified',
            'Verified 2026-09-30 · Windows nightly asset SHA-256 starts dc446869860d. Nightly is a development build; a version label alone is not proof.',
          )}
        </small>
      </div>
    </div>
  );
}
