import { history } from '@umijs/max';
import { App } from 'antd';
import { useCallback, useEffect, useRef } from 'react';

export function useUnsavedChanges(
  dirty: boolean,
  discard: () => void,
  label: string,
  zh: boolean,
) {
  const { modal } = App.useApp();
  const confirming = useRef(false);
  const confirmDiscard = useCallback(
    (next: () => void) => {
      if (!dirty) {
        next();
        return;
      }
      if (confirming.current) return;
      confirming.current = true;
      modal.confirm({
        title: zh ? '放弃未保存的修改？' : 'Discard unsaved changes?',
        content: zh
          ? `${label} 的修改尚未保存。继续后将丢失这些修改。`
          : `Changes to ${label} have not been saved. Continuing will discard them.`,
        okText: zh ? '放弃修改并继续' : 'Discard and continue',
        cancelText: zh ? '继续编辑' : 'Keep editing',
        onOk: () => {
          confirming.current = false;
          discard();
          next();
        },
        onCancel: () => {
          confirming.current = false;
        },
      });
    },
    [dirty, discard, label, modal, zh],
  );

  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    const unblock = history.block(({ retry }) => {
      confirmDiscard(() => {
        unblock();
        retry();
      });
    });
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      unblock();
    };
  }, [dirty, confirmDiscard]);

  return confirmDiscard;
}
