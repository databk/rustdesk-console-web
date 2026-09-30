export default {
  'webClient.legacyEncryption':
    'The remote device uses a legacy encryption protocol with known security risks. Upgrade the remote client when possible.',
  'webClient.open': 'Connect in browser',
  'webClient.title': 'Web Client',
  'webClient.id': 'Remote ID',
  'webClient.connect': 'Connect',
  'webClient.disconnect': 'Disconnect',
  'webClient.retry': 'Retry',
  'webClient.fullscreen': 'Fullscreen',
  'webClient.password': 'Remote device password',
  'webClient.authenticate': 'Send password',
  'webClient.approval':
    'You can also approve the connection on the remote device.',
  'webClient.disabled': 'Web Client is disabled by the administrator.',
  'webClient.unavailable': 'Web Client is unavailable on this backend.',
  'webClient.notice':
    'Connects through the configured server. Native password or local approval is required. Extensions depend on remote permissions and browser support.',
  'webClient.desktop':
    'Remote desktop. Focus to send keyboard and mouse input.',
  'webClient.keyboardNotice':
    'Click the desktop to control it. Browser/system shortcuts may be reserved. Use Send text for IME/Unicode input. Losing focus releases held keys while input permission is available.',
  'webClient.keyboardDenied':
    'Keyboard and mouse are disabled by the remote device. Previously held keys or buttons may remain pressed; restore permission or press and release them on the remote device.',
  'webClient.clipboard': 'Text clipboard',
  'webClient.clipboardDenied': 'Clipboard is disabled by the remote device.',
  'webClient.localText': 'Paste local text here',
  'webClient.remoteText': 'Remote clipboard text',
  'webClient.sendClipboard': 'Send to remote clipboard',
  'webClient.sendText': 'Send text as input',
  'webClient.copyRemote': 'Copy remote text',
  'webClient.clipboardFallback':
    'Clipboard access was denied. Select and copy the remote text in the box manually.',
  'webClient.state.idle': 'Ready',
  'webClient.state.connecting': 'Connecting',
  'webClient.state.securing': 'Verifying identity',
  'webClient.state.authenticating': 'Authentication required',
  'webClient.state.awaitingApproval': 'Waiting for approval',
  'webClient.state.connected': 'Connected',
  'webClient.state.closed': 'Disconnected',
  'webClient.state.failed': 'Connection failed',
  'webClient.error.configuration':
    'Invalid ID or server profile. IP addresses, URLs and server overrides are unsupported.',
  'webClient.error.identity':
    'Remote identity verification failed. The connection was closed.',
  'webClient.error.encryption':
    'Secure session initialization or message verification failed.',
  'webClient.error.password':
    'The remote device rejected this password. Please try again.',
  'webClient.error.denied': 'The remote device rejected or ended the session.',
  'webClient.error.offline':
    'The remote ID is unavailable or offline on this server.',
  'webClient.error.timeout':
    'The connection timed out. Disconnect and try again.',
  'webClient.error.transport': 'The network connection was interrupted.',
  'webClient.error.protocol':
    'The remote device sent an unsupported protocol message.',
  'webClient.error.overload':
    'The session exceeded its bounded buffer limits and was closed.',
  'webClient.error.unsupported':
    'Requires HTTPS and a browser that passes the VP9 WebCodecs configuration check. Android/iOS compatibility requires device testing.',
  'webClient.error.media': 'Video decoding stopped. Disconnect and reconnect.',
  'webClient.error.worker':
    'The Web Client worker could not be loaded. Check deployment assets.',
  'webClient.error.clipboard':
    'Clipboard access was denied, or data is invalid or too large. Text limit is 1 MiB; use PNG file selection or download as a fallback.',
  'webClient.error.fullscreen':
    'Fullscreen is unavailable in this browser context.',
  'webClient.error.cancelled': 'The operation was cancelled.',
  'menu.webClient': 'Web Client',
  'webClient.display': 'Monitor',
  'webClient.audioStart': 'Play audio',
  'webClient.audioStop': 'Stop audio',
  'webClient.volume': 'Volume',
  'webClient.mute': 'Mute',
  'webClient.unmute': 'Unmute',
  'webClient.audioUnavailable':
    'Opus audio decoding is unavailable in this browser.',
  'webClient.images': 'Image clipboard',
  'webClient.imageRead': 'Send clipboard PNG',
  'webClient.imageFile': 'Choose PNG',
  'webClient.imageCopy': 'Copy remote PNG',
  'webClient.imageDownload': 'Download remote PNG',
  'webClient.imageLimit':
    'PNG only; 4 MiB encoded, 4 million pixels. Use file selection or download if clipboard access is denied.',
  'webClient.files': 'File transfer',
  'webClient.fileAuthNotice':
    'File transfer requires its own remote authentication. Files are processed one at a time; downloads without a file picker are limited to 16 MiB.',
  'webClient.fileConnect': 'Connect files',
  'webClient.fileDisconnect': 'Disconnect files',
  'webClient.filePassword': 'File session password',
  'webClient.filePath': 'Remote directory',
  'webClient.fileBrowse': 'Open directory',
  'webClient.fileUp': 'Parent directory',
  'webClient.fileUpload': 'Upload files',
  'webClient.fileConflict': 'A remote file with this name exists.',
  'webClient.fileSkip': 'Keep remote file',
  'webClient.fileOverwrite': 'Overwrite remote file',
  'webClient.fileCancel': 'Cancel transfer',
  'webClient.filePhase.waiting': 'Waiting for peer',
  'webClient.filePhase.transferring': 'Transferring',
  'webClient.filePhase.conflict': 'Name conflict',
  'webClient.filePhase.verifying': 'Verifying completion',
  'webClient.filePhase.done': 'Completed',
  'webClient.filePhase.skipped': 'Skipped',
  'webClient.filePhase.cancelled': 'Cancelled',
  'webClient.filePhase.error': 'Failed',
  'webClient.touchMode': 'Touch mode',
  'webClient.touchPointer': 'Point / drag',
  'webClient.touchScroll': 'Scroll',
  'webClient.touchZoom': 'Pan zoomed view',
  'webClient.zoomReset': 'Reset zoom',
  'webClient.softKeyboard': 'Keyboard',
  'webClient.softText': 'Keyboard text',
  'webClient.touchNotice':
    'Touch to click, move to drag, hold for right click. Pinch with two fingers to zoom locally; use Scroll mode for the remote wheel. Send keyboard text after IME composition.',
  'webClient.error.audio':
    'Audio is unavailable or exceeded its buffer limit. Check Opus support and enable audio again.',
  'webClient.error.files':
    'File operation failed, was denied, or exceeded a size limit. Retry the file session. Cancelling the save dialog stops the download.',
};
