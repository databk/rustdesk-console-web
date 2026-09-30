export default {
  'webClient.legacyEncryption':
    'O dispositivo remoto usa um protocolo de criptografia antigo com riscos de segurança conhecidos. Atualize o cliente remoto quando possível.',
  'webClient.open': 'Conectar no navegador',
  'webClient.title': 'Cliente Web',
  'webClient.id': 'ID remoto',
  'webClient.connect': 'Conectar',
  'webClient.disconnect': 'Desconectar',
  'webClient.retry': 'Tentar novamente',
  'webClient.fullscreen': 'Tela cheia',
  'webClient.password': 'Senha do dispositivo remoto',
  'webClient.authenticate': 'Enviar senha',
  'webClient.approval':
    'Você também pode aprovar a conexão no dispositivo remoto.',
  'webClient.disabled': 'O administrador desativou o Cliente Web.',
  'webClient.unavailable': 'O Cliente Web não está disponível neste servidor.',
  'webClient.notice':
    'Conecta pelo servidor configurado. Exige senha nativa ou aprovação local. Extensões dependem das permissões remotas e do navegador.',
  'webClient.desktop':
    'Área de trabalho remota. Clique para controlar teclado e mouse.',
  'webClient.keyboardNotice':
    'Clique na tela para controlar. Atalhos do navegador/sistema podem ser reservados. Use Enviar texto para IME/Unicode. As teclas são liberadas ao perder o foco enquanto a entrada remota estiver permitida.',
  'webClient.keyboardDenied':
    'O dispositivo remoto desativou teclado e mouse. Teclas ou botões anteriormente pressionados podem continuar assim; restaure a permissão ou pressione e solte-os no dispositivo remoto.',
  'webClient.clipboard': 'Área de transferência de texto',
  'webClient.clipboardDenied':
    'O dispositivo remoto desativou a área de transferência.',
  'webClient.localText': 'Cole o texto local aqui',
  'webClient.remoteText': 'Texto da área de transferência remota',
  'webClient.sendClipboard': 'Enviar para a área de transferência remota',
  'webClient.sendText': 'Enviar texto como entrada',
  'webClient.copyRemote': 'Copiar texto remoto',
  'webClient.clipboardFallback':
    'A permissão foi negada. Selecione e copie o texto manualmente.',
  'webClient.state.idle': 'Pronto',
  'webClient.state.connecting': 'Conectando',
  'webClient.state.securing': 'Verificando identidade',
  'webClient.state.authenticating': 'Autenticação necessária',
  'webClient.state.awaitingApproval': 'Aguardando aprovação',
  'webClient.state.connected': 'Conectado',
  'webClient.state.closed': 'Desconectado',
  'webClient.state.failed': 'Falha na conexão',
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
    'Requer HTTPS e suporte à configuração VP9 do WebCodecs. A compatibilidade Android/iOS exige testes em dispositivos.',
  'webClient.error.media': 'Video decoding stopped. Disconnect and reconnect.',
  'webClient.error.worker':
    'The Web Client worker could not be loaded. Check deployment assets.',
  'webClient.error.clipboard':
    'Acesso negado ou dados inválidos ou grandes demais. Texto: até 1 MiB. Para PNG, selecione um arquivo ou baixe a imagem.',
  'webClient.error.fullscreen':
    'Fullscreen is unavailable in this browser context.',
  'webClient.error.cancelled': 'The operation was cancelled.',
  'menu.webClient': 'Cliente Web',
  'webClient.display': 'Monitor',
  'webClient.audioStart': 'Reproduzir áudio',
  'webClient.audioStop': 'Parar áudio',
  'webClient.volume': 'Volume',
  'webClient.mute': 'Silenciar',
  'webClient.unmute': 'Ativar som',
  'webClient.audioUnavailable':
    'A decodificação de áudio Opus não está disponível neste navegador.',
  'webClient.images': 'Área de transferência de imagens',
  'webClient.imageRead': 'Enviar PNG da área de transferência',
  'webClient.imageFile': 'Selecionar PNG',
  'webClient.imageCopy': 'Copiar PNG remoto',
  'webClient.imageDownload': 'Baixar PNG remoto',
  'webClient.imageLimit':
    'Somente PNG: até 4 MiB e 4 milhões de pixels. Se o acesso for negado, selecione um arquivo ou baixe a imagem.',
  'webClient.files': 'Transferência de arquivos',
  'webClient.fileAuthNotice':
    'A sessão de arquivos exige autenticação remota própria. Os arquivos são processados um por vez; sem gravação em fluxo, o limite de download é 16 MiB.',
  'webClient.fileConnect': 'Conectar arquivos',
  'webClient.fileDisconnect': 'Desconectar arquivos',
  'webClient.filePassword': 'Senha da sessão de arquivos',
  'webClient.filePath': 'Diretório remoto',
  'webClient.fileBrowse': 'Abrir diretório',
  'webClient.fileUp': 'Diretório pai',
  'webClient.fileUpload': 'Enviar arquivos',
  'webClient.fileConflict': 'Já existe um arquivo remoto com esse nome.',
  'webClient.fileSkip': 'Manter arquivo remoto',
  'webClient.fileOverwrite': 'Substituir arquivo remoto',
  'webClient.fileCancel': 'Cancelar transferência',
  'webClient.filePhase.waiting': 'Aguardando confirmação',
  'webClient.filePhase.transferring': 'Transferindo',
  'webClient.filePhase.conflict': 'Conflito de nome',
  'webClient.filePhase.verifying': 'Verificando conclusão',
  'webClient.filePhase.done': 'Concluído',
  'webClient.filePhase.skipped': 'Ignorado',
  'webClient.filePhase.cancelled': 'Cancelado',
  'webClient.filePhase.error': 'Falhou',
  'webClient.touchMode': 'Modo de toque',
  'webClient.touchPointer': 'Apontar / arrastar',
  'webClient.touchScroll': 'Rolar',
  'webClient.touchZoom': 'Mover imagem ampliada',
  'webClient.zoomReset': 'Redefinir zoom',
  'webClient.softKeyboard': 'Teclado',
  'webClient.softText': 'Texto do teclado',
  'webClient.touchNotice':
    'Toque para clicar, mova para arrastar e segure para clicar com o botão direito. Use dois dedos para ampliar e o modo Rolar para a rolagem remota. Envie o texto após a composição do IME.',
  'webClient.error.audio':
    'Áudio indisponível ou limite de buffer excedido. Verifique o suporte a Opus e ative novamente.',
  'webClient.error.files':
    'A operação falhou, foi negada ou excedeu o limite. Tente reconectar a sessão de arquivos. Cancelar o salvamento interrompe o download.',
};
