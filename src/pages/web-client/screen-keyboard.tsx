import { MinusOutlined } from '@ant-design/icons';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { MAX_TEXT_BYTES } from '@/features/web-client/clipboard/text';
import type { hbb } from '@/features/web-client/protocol';
import {
  KEYBOARD_ROWS,
  NAVIGATION_ROWS,
  VirtualKeyboard,
  type VirtualKey,
} from '@/features/web-client/input/virtual-keyboard';
import styles from './index.less';
import windowStyles from './session-tools.less';
import { useToolWindow } from './use-tool-window';

export interface ScreenKeyboardHandle {
  release(): void;
}
type Props = {
  open: boolean;
  allowed: boolean;
  reason?: string;
  revision: string;
  send: (input: { keyEvent: hbb.IKeyEvent }) => boolean;
  sendText: (value: string) => void;
  onClose: (ownedFocus: boolean) => void;
  text: (
    key: string,
    fallback: string,
    values?: Record<string, string | number>,
  ) => string;
};
export const ScreenKeyboard = forwardRef<ScreenKeyboardHandle, Props>(
  function ScreenKeyboard(
    { open, allowed, reason, revision, send, sendText, onClose, text },
    ref,
  ) {
    const window = useToolWindow(
      open,
      { width: 880, height: 374 },
      { width: 680, height: 360 },
    );
    const callbacks = useRef({ send, allowed });
    callbacks.current = { send, allowed };
    const keyboard = useRef<VirtualKeyboard | undefined>(undefined);
    if (!keyboard.current)
      keyboard.current = new VirtualKeyboard((value) =>
        callbacks.current.send(value),
      );
    const [held, setHeld] = useState<string[]>([]);
    const [tab, setTab] = useState<'keys' | 'text'>('keys');
    const [draft, setDraft] = useState('');
    const [tooLong, setTooLong] = useState(false);
    const release = () => {
      keyboard.current?.release();
      setHeld([]);
    };
    useImperativeHandle(ref, () => ({ release }));
    useEffect(() => {
      release();
      if (!open || !allowed) return;
      window.panel.current
        ?.querySelector<HTMLButtonElement>('[data-keyboard-tab]')
        ?.focus({ preventScroll: true });
    }, [open]);
    useEffect(() => {
      release();
    }, [allowed, revision]);
    useEffect(() => {
      setDraft('');
      setTooLong(false);
    }, [revision.split(':')[0]]);
    useEffect(() => {
      const hidden = () => {
        if (document.hidden) release();
      };
      globalThis.window.addEventListener('blur', release);
      document.addEventListener('visibilitychange', hidden);
      return () => {
        globalThis.window.removeEventListener('blur', release);
        document.removeEventListener('visibilitychange', hidden);
        keyboard.current?.release();
      };
    }, []);
    const close = () => {
      const ownedFocus = !!window.panel.current?.contains(
        document.activeElement,
      );
      release();
      onClose(ownedFocus);
    };
    const keyButton = (value: VirtualKey) => {
      const side =
        value.modifier && value.code.endsWith('Left')
          ? 'keyboardLeftKey'
          : value.modifier && value.code.endsWith('Right')
            ? 'keyboardRightKey'
            : '';
      const name = side
        ? text(
            side,
            side === 'keyboardLeftKey' ? 'Left {key}' : 'Right {key}',
            { key: value.label },
          ).replace('{key}', value.label)
        : value.label;
      return (
        <button
          key={value.code}
          type="button"
          className={styles.keyboardKey}
          data-keyboard-key={value.code}
          style={{ flexGrow: value.width ?? 1 }}
          aria-label={text('keyboardKey', 'Send {key} key', {
            key: name,
          }).replace('{key}', name)}
          title={name}
          aria-pressed={value.modifier ? held.includes(value.code) : undefined}
          disabled={!allowed}
          onClick={() => {
            if (!callbacks.current.allowed) return;
            keyboard.current?.press(value);
            setHeld(keyboard.current?.heldCodes() ?? []);
          }}
        >
          {value.label}
        </button>
      );
    };
    return (
      <section
        ref={window.panel}
        className={`${windowStyles.toolDialog} ${styles.screenKeyboard}`}
        style={window.style}
        {...window.events}
        role="dialog"
        aria-modal="false"
        aria-label={text('screenKeyboard', 'Screen keyboard')}
        data-screen-keyboard
        hidden={!open}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            release();
        }}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === 'Escape' && !event.nativeEvent.isComposing) close();
        }}
      >
        <header>
          <button
            type="button"
            className={windowStyles.toolDrag}
            aria-label={text('keyboardMove', 'Move screen keyboard')}
            {...window.control()}
          >
            <strong>{text('screenKeyboard', 'Screen keyboard')}</strong>
          </button>
          <button
            type="button"
            aria-label={text('keyboardClose', 'Minimize screen keyboard')}
            onClick={close}
          >
            <MinusOutlined />
          </button>
        </header>
        <div
          className={styles.keyboardTabs}
          role="tablist"
          aria-label={text('screenKeyboard', 'Screen keyboard')}
        >
          {(['keys', 'text'] as const).map((value) => (
            <button
              key={value}
              data-keyboard-tab
              type="button"
              role="tab"
              aria-selected={tab === value}
              aria-controls={`web-client-keyboard-${value}`}
              onClick={() => {
                release();
                setTab(value);
              }}
            >
              {text(
                value === 'keys' ? 'keyboardKeysTab' : 'keyboardTextTab',
                value === 'keys' ? 'Keys' : 'Text input',
              )}
            </button>
          ))}
        </div>
        <div
          id="web-client-keyboard-keys"
          role="tabpanel"
          hidden={tab !== 'keys'}
          className={styles.keyboardPage}
        >
          <div className={styles.keyboardLayout}>
            <div className={styles.keyboardMain}>
              {KEYBOARD_ROWS.map((row) => (
                <div key={row[0].code} className={styles.keyboardRow}>
                  {row.map(keyButton)}
                </div>
              ))}
            </div>
            <div className={styles.keyboardNavigation}>
              {NAVIGATION_ROWS.map((row) => (
                <div
                  key={row.find((value) => !!value)?.code}
                  className={styles.keyboardRow}
                >
                  {row
                    .filter((value): value is VirtualKey => !!value)
                    .map(keyButton)}
                </div>
              ))}
            </div>
          </div>
          <p className={styles.toolHelp}>
            {reason ||
              text(
                'keyboardModifierHint',
                'Select modifiers, then click another key to send a shortcut. Modifiers are released when the keyboard closes or loses focus.',
              )}
          </p>
        </div>
        <div
          id="web-client-keyboard-text"
          role="tabpanel"
          hidden={tab !== 'text'}
          className={styles.keyboardTextPage}
        >
          <textarea
            aria-label={text('softText', 'Keyboard text')}
            value={draft}
            disabled={!allowed}
            maxLength={MAX_TEXT_BYTES}
            onChange={(event) => {
              setDraft(event.target.value);
              setTooLong(false);
            }}
          />
          <p className={styles.toolHelp}>
            {reason ||
              text(
                'keyboardTextHint',
                'Compose text with your input method, then send it. Text is sent without modifiers.',
              )}
          </p>
          {tooLong && (
            <p role="status">
              {text('keyboardTextTooLong', 'Text exceeds the sending limit.')}
            </p>
          )}
          <button
            type="button"
            disabled={!allowed || !draft}
            onClick={() => {
              if (!callbacks.current.allowed || !draft) return;
              if (new TextEncoder().encode(draft).byteLength > MAX_TEXT_BYTES) {
                setTooLong(true);
                return;
              }
              release();
              sendText(draft);
              setDraft('');
            }}
          >
            {text('sendText', 'Send text')}
          </button>
        </div>
        {(['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const).map((edge) => (
          <button
            key={edge}
            type="button"
            className={windowStyles.toolResize}
            data-tool-resize={edge}
            aria-label={text('keyboardResize', 'Resize screen keyboard')}
            tabIndex={edge === 'se' ? 0 : -1}
            {...window.control(edge)}
          />
        ))}
      </section>
    );
  },
);
