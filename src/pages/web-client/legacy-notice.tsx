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
        <strong>{text('legacyTitle', 'Legacy encryption')}</strong>
        {version && (
          <div className={styles.legacyVersion}>
            {text('remoteVersion', 'Remote client')}: {version}
          </div>
        )}
        <p>
          {text(
            'legacyRisk',
            'This connection is encrypted, but the older method has a known risk that can weaken the privacy of transferred content.',
          )}
        </p>
        <p>
          {text(
            'legacyUpgrade',
            'Update RustDesk on the remote device, then reconnect.',
          )}
        </p>
        <p className={styles.legacyCompatibility}>
          {text(
            'legacyCompatibility',
            'RustDesk 1.4.9 uses the older method. The new method has been verified in a specific official 1.5.0 nightly build. Nightly is a development build; the version number alone does not guarantee the change.',
          )}
        </p>
      </div>
    </div>
  );
}
