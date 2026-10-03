import type { KxVersion } from '../core/crypto';
import type { SessionErrorCode } from '../core/errors';
import type { ServerProfile } from '../core/profile';
import type { SessionPermissions, SessionState } from '../core/session';
import type { FileCommand, FileEvent } from '../files/transfer';
import type { PcmFrame } from '../media/opus';
import type { hbb } from '../protocol';

export type SessionCommand =
  | { type: 'connect'; profile: ServerProfile; id: string }
  | { type: 'password'; password: string }
  | { type: 'disconnect' | 'shutdown' | 'metrics' | 'refresh' }
  | { type: 'rendered'; displayGeneration: number }
  | { type: 'select-display'; index: number }
  | { type: 'audio'; enabled: boolean }
  | { type: 'image'; bytes: Uint8Array }
  | { type: 'paste'; content: { text: string } | { bytes: Uint8Array } }
  | { type: 'cancel-paste' }
  | { type: 'clipboard-context'; clipboardGeneration: number }
  | { type: 'files-connect' | 'files-disconnect'; fileGeneration: number }
  | { type: 'files-password'; password: string; fileGeneration: number }
  | { type: 'files-command'; command: FileCommand; fileGeneration: number }
  | { type: 'audio-rendered'; audioGeneration: number }
  | {
      type: 'input';
      input: { keyEvent?: hbb.IKeyEvent; mouseEvent?: hbb.IMouseEvent };
    }
  | { type: 'clipboard' | 'text'; text: string };
export type Command = SessionCommand & {
  generation: number;
  displayGeneration?: number;
};
export type SessionEvent =
  | {
      type: 'paste-status';
      status: 'sending' | 'sent' | 'cancelled' | 'failed';
    }
  | {
      type: 'ready';
      secureContext: boolean;
      videoDecoder: boolean;
      audioDecoder?: boolean;
    }
  | { type: 'state'; state: SessionState }
  | { type: 'security'; kxVersion: KxVersion | undefined }
  | { type: 'error'; code: SessionErrorCode | 'unsupported' | 'media' }
  | { type: 'warning'; code: 'clipboard' | 'audio' | 'files' }
  | { type: 'permissions'; permissions: SessionPermissions }
  | { type: 'peer'; peer: hbb.IPeerInfo }
  | { type: 'display'; display: hbb.ISwitchDisplay; displayGeneration: number }
  | { type: 'frame'; frame: VideoFrame; displayGeneration: number }
  | { type: 'audio-frame'; pcm: PcmFrame; audioGeneration: number }
  | { type: 'audio-reset'; audioGeneration: number }
  | { type: 'image'; bytes: Uint8Array; clipboardGeneration: number }
  | { type: 'clipboard'; text: string; clipboardGeneration: number }
  | { type: 'cursor-position'; position: hbb.ICursorPosition }
  | { type: 'cursor-id'; id: string }
  | {
      type: 'cursor';
      cursor: Omit<hbb.ICursorData, 'id'> & { id: string; colors: Uint8Array };
    }
  | {
      type: 'metrics';
      decoded: number;
      presenting: boolean;
      pendingFrame: boolean;
    }
  | { type: 'files-state'; state: SessionState; fileGeneration: number }
  | {
      type: 'files-security';
      kxVersion: KxVersion | undefined;
      fileGeneration: number;
    }
  | { type: 'files-error'; code: SessionErrorCode; fileGeneration: number }
  | { type: 'files-event'; event: FileEvent; fileGeneration: number }
  | { type: 'shutdown-complete' };
export type WorkerEvent = SessionEvent & { generation: number };
