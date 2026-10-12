import type { KxVersion } from '../core/crypto';
import type { DisplayOptions } from '../core/display';
import type { SessionErrorCode } from '../core/errors';
import type { ServerProfile } from '../core/profile';
import type { WebClientGrant } from '../core/gateway';
import type { TransportMetrics } from '../core/transport';
import type {
  SessionPermissions,
  SessionState,
  ViewOptions,
} from '../core/session';
import type { FileCommand, FileEvent } from '../files/transfer';
import type { PcmFrame } from '../media/opus';
import type { AudioDiagnostic, AudioMetrics } from '../media/audio-diagnostics';
import type { RecordingReason } from '../media/recorder';
import type { VideoDiagnostics } from '../media/video-diagnostics';
import type { VideoDiagnostic } from '../media/vp9-decoder';
import type {
  CodecPreference,
  VideoCapabilities,
  VideoFormat,
} from '../media/video-codecs';
import type { hbb } from '../protocol';
export type CallState =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'declined'
  | 'timeout'
  | 'failed'
  | 'ended';

export type SessionCommand =
  | {
      type: 'connect';
      profile: ServerProfile;
      id: string;
      account?: string;
      grant: WebClientGrant;
      origin: string;
    }
  | { type: 'password'; password: string; remember?: boolean }
  | { type: 'forget-password' }
  | { type: 'disconnect' | 'shutdown' | 'refresh' }
  | { type: 'metrics'; request?: number }
  | { type: 'codec'; prefer: CodecPreference; trueColor: boolean }
  | { type: 'chat'; text: string; request: number }
  | { type: 'call-start'; callGeneration: number; timestamp: number }
  | { type: 'call-stop'; callGeneration: number }
  | { type: 'voice-pcm'; callGeneration: number; samples: Float32Array }
  | { type: 'record-start'; recordingGeneration: number; maxBytes: number }
  | { type: 'record-stop'; recordingGeneration: number }
  | {
      type: 'record-consumed';
      recordingGeneration: number;
      sequence: number;
      ok: boolean;
    }
  | { type: 'rendered'; displayGeneration: number; drawn?: boolean }
  | {
      type: 'change-resolution';
      request: number;
      display: number;
      width: number;
      height: number;
      displayGeneration: number;
    }
  | { type: 'select-display'; index: number }
  | { type: 'audio'; enabled: boolean }
  | { type: 'read-only'; enabled: boolean }
  | { type: 'view-options'; options: ViewOptions }
  | { type: 'paste'; content: { text: string } | { bytes: Uint8Array } }
  | { type: 'cancel-paste' }
  | {
      type: 'clipboard-context';
      clipboardGeneration: number;
      enabled?: boolean;
    }
  | {
      type: 'files-connect';
      fileGeneration: number;
      grant: WebClientGrant;
      origin: string;
    }
  | { type: 'files-disconnect'; fileGeneration: number }
  | { type: 'files-password'; password: string; fileGeneration: number }
  | { type: 'files-command'; command: FileCommand; fileGeneration: number }
  | { type: 'audio-rendered'; audioGeneration: number }
  | {
      type: 'input';
      input: { keyEvent?: hbb.IKeyEvent; mouseEvent?: hbb.IMouseEvent };
    }
  | { type: 'text'; text: string };
export type Command = SessionCommand & {
  generation: number;
  displayGeneration?: number;
};
type VideoFailureDetails = {
  videoDiagnostic?: VideoDiagnostic;
  videoDisplayGeneration?: number;
  videoSaturationAttempts?: number;
  videoRecovery?: 'key-refresh' | 'software' | 'vp9' | 'closed';
};
export type SessionEvent =
  | { type: 'native-auth'; succeeded: boolean }
  | {
      type: 'credential-status';
      status: 'none' | 'saved' | 'forgotten' | 'unavailable';
    }
  | {
      type: 'display-options';
      options: DisplayOptions;
      displayGeneration: number;
    }
  | {
      type: 'resolution-status';
      request: number;
      status:
        | 'pending'
        | 'confirmed'
        | 'unconfirmed'
        | 'cancelled'
        | 'rejected';
      displayGeneration: number;
    }
  | {
      type: 'paste-status';
      status: 'sending' | 'sent' | 'cancelled' | 'failed' | 'image-too-large';
    }
  | {
      type: 'ready';
      secureContext: boolean;
      videoDecoder: boolean;
      audioDecoder?: boolean;
      videoCapabilities?: VideoCapabilities;
      voiceEncoder?: boolean;
    }
  | { type: 'state'; state: SessionState }
  | { type: 'video-format'; format: VideoFormat; displayGeneration: number }
  | { type: 'encoding'; encoding: hbb.ISupportedEncoding }
  | {
      type: 'chat';
      text: string;
      request?: number;
      incoming: boolean;
      ok?: boolean;
    }
  | { type: 'call-state'; state: CallState; callGeneration: number }
  | { type: 'voice-consumed'; callGeneration: number }
  | {
      type: 'record-chunk';
      recordingGeneration: number;
      sequence: number;
      bytes: Uint8Array;
    }
  | {
      type: 'record-done';
      recordingGeneration: number;
      reason: RecordingReason;
      duration: number;
    }
  | { type: 'security'; kxVersion: KxVersion | undefined }
  | ({
      type: 'error';
      code: SessionErrorCode | 'unsupported' | 'media';
    } & VideoFailureDetails)
  | ({
      type: 'warning';
      code: 'clipboard' | 'audio' | 'files' | 'video';
      audioDiagnostic?: AudioDiagnostic;
      audioGeneration?: number;
    } & VideoFailureDetails)
  | { type: 'permissions'; permissions: SessionPermissions }
  | { type: 'peer'; peer: hbb.IPeerInfo }
  | ({
      type: 'display';
      display: hbb.ISwitchDisplay;
      displayGeneration: number;
    } & VideoFailureDetails)
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
  | ({
      type: 'metrics';
      request?: number;
      received: number;
      decoded: number;
      videoBytes: number;
      delay?: number;
      targetBitrateKbps?: number;
      testDelayReceived?: number;
      testDelayReplied?: number;
      lastProbeAgeMs?: number;
      transport?: TransportMetrics;
      audio?: AudioMetrics;
      audioGeneration?: number;
      displayGeneration: number;
      presenting: boolean;
      pendingFrame: boolean;
    } & VideoDiagnostics)
  | { type: 'files-state'; state: SessionState; fileGeneration: number }
  | { type: 'files-auth'; succeeded: boolean; fileGeneration: number }
  | {
      type: 'files-security';
      kxVersion: KxVersion | undefined;
      fileGeneration: number;
    }
  | { type: 'files-error'; code: SessionErrorCode; fileGeneration: number }
  | { type: 'files-event'; event: FileEvent; fileGeneration: number }
  | { type: 'shutdown-complete' };
export type WorkerEvent = SessionEvent & { generation: number };
