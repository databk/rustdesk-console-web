export default {
  'webClient.legacyEncryption':
    'Удалённое устройство использует устаревший протокол шифрования с известными рисками безопасности. По возможности обновите удалённый клиент.',
  'webClient.open': 'Подключиться в браузере',
  'webClient.title': 'Веб-клиент',
  'webClient.id': 'ID удалённого устройства',
  'webClient.connect': 'Подключиться',
  'webClient.disconnect': 'Отключиться',
  'webClient.retry': 'Повторить',
  'webClient.fullscreen': 'Полный экран',
  'webClient.password': 'Пароль удалённого устройства',
  'webClient.authenticate': 'Отправить пароль',
  'webClient.approval':
    'Можно также подтвердить подключение на удалённом устройстве.',
  'webClient.disabled': 'Веб-клиент отключён администратором.',
  'webClient.unavailable': 'Веб-клиент недоступен на этом сервере.',
  'webClient.notice':
    'Соединение через настроенный сервер. Требуется пароль устройства или локальное подтверждение. Расширения зависят от разрешений и возможностей браузера.',
  'webClient.desktop':
    'Удалённый рабочий стол. Нажмите для управления клавиатурой и мышью.',
  'webClient.keyboardNotice':
    'Нажмите на экран для управления. Системные и браузерные сочетания могут быть перехвачены. Для IME/Unicode используйте отправку текста. При потере фокуса клавиши отпускаются, если удалённый ввод разрешён.',
  'webClient.keyboardDenied':
    'Клавиатура и мышь отключены удалённым устройством. Ранее нажатые клавиши или кнопки мыши могут оставаться зажатыми; восстановите разрешение или нажмите и отпустите их на удалённом устройстве.',
  'webClient.clipboard': 'Текстовый буфер обмена',
  'webClient.clipboardDenied': 'Буфер обмена отключён удалённым устройством.',
  'webClient.localText': 'Вставьте локальный текст здесь',
  'webClient.remoteText': 'Текст удалённого буфера обмена',
  'webClient.sendClipboard': 'Отправить в удалённый буфер обмена',
  'webClient.sendText': 'Ввести текст',
  'webClient.copyRemote': 'Скопировать удалённый текст',
  'webClient.clipboardFallback':
    'Доступ к буферу обмена запрещён. Выделите и скопируйте текст вручную.',
  'webClient.state.idle': 'Готов',
  'webClient.state.connecting': 'Подключение',
  'webClient.state.securing': 'Проверка личности',
  'webClient.state.authenticating': 'Требуется аутентификация',
  'webClient.state.awaitingApproval': 'Ожидание подтверждения',
  'webClient.state.connected': 'Подключено',
  'webClient.state.closed': 'Отключено',
  'webClient.state.failed': 'Ошибка подключения',
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
    'Требуются HTTPS и поддержка конфигурации VP9 WebCodecs. Совместимость Android/iOS проверяется на устройствах.',
  'webClient.error.media': 'Video decoding stopped. Disconnect and reconnect.',
  'webClient.error.worker':
    'The Web Client worker could not be loaded. Check deployment assets.',
  'webClient.error.clipboard':
    'Доступ к буферу отклонён, данные повреждены или слишком велики. Текст: до 1 МиБ. Для PNG используйте выбор файла или скачивание.',
  'webClient.error.fullscreen':
    'Fullscreen is unavailable in this browser context.',
  'webClient.error.cancelled': 'The operation was cancelled.',
  'menu.webClient': 'Веб-клиент',
  'webClient.display': 'Монитор',
  'webClient.audioStart': 'Включить звук',
  'webClient.audioStop': 'Выключить звук',
  'webClient.volume': 'Громкость',
  'webClient.mute': 'Без звука',
  'webClient.unmute': 'Включить звук',
  'webClient.audioUnavailable':
    'В этом браузере недоступно декодирование Opus.',
  'webClient.images': 'Буфер изображений',
  'webClient.imageRead': 'Отправить PNG из буфера',
  'webClient.imageFile': 'Выбрать PNG',
  'webClient.imageCopy': 'Копировать удалённый PNG',
  'webClient.imageDownload': 'Скачать удалённый PNG',
  'webClient.imageLimit':
    'Только PNG: до 4 МиБ и 4 млн пикселей. При отказе доступа выберите файл или скачайте изображение.',
  'webClient.files': 'Передача файлов',
  'webClient.fileAuthNotice':
    'Для файлов требуется отдельная удалённая аутентификация. Файлы обрабатываются по одному; без потоковой записи скачивание ограничено 16 МиБ.',
  'webClient.fileConnect': 'Подключить файлы',
  'webClient.fileDisconnect': 'Отключить файлы',
  'webClient.filePassword': 'Пароль файловой сессии',
  'webClient.filePath': 'Удалённая папка',
  'webClient.fileBrowse': 'Открыть папку',
  'webClient.fileUp': 'Родительская папка',
  'webClient.fileUpload': 'Загрузить файлы',
  'webClient.fileConflict': 'Удалённый файл с таким именем уже существует.',
  'webClient.fileSkip': 'Сохранить удалённый файл',
  'webClient.fileOverwrite': 'Заменить удалённый файл',
  'webClient.fileCancel': 'Отменить передачу',
  'webClient.filePhase.waiting': 'Ожидание подтверждения',
  'webClient.filePhase.transferring': 'Передача',
  'webClient.filePhase.conflict': 'Конфликт имён',
  'webClient.filePhase.verifying': 'Проверка завершения',
  'webClient.filePhase.done': 'Завершено',
  'webClient.filePhase.skipped': 'Пропущено',
  'webClient.filePhase.cancelled': 'Отменено',
  'webClient.filePhase.error': 'Ошибка',
  'webClient.touchMode': 'Режим касаний',
  'webClient.touchPointer': 'Указатель / перетаскивание',
  'webClient.touchScroll': 'Прокрутка',
  'webClient.touchZoom': 'Перемещение увеличенного вида',
  'webClient.zoomReset': 'Сбросить масштаб',
  'webClient.softKeyboard': 'Клавиатура',
  'webClient.softText': 'Текст клавиатуры',
  'webClient.touchNotice':
    'Касание — щелчок, движение — перетаскивание, удержание — правая кнопка. Два пальца меняют локальный масштаб. Для удалённой прокрутки выберите режим прокрутки. Отправляйте текст после завершения ввода IME.',
  'webClient.error.audio':
    'Звук недоступен или превышен лимит буфера. Проверьте поддержку Opus и включите звук снова.',
  'webClient.error.files':
    'Операция отклонена, завершилась ошибкой или превышен лимит. Повторите файловую сессию. Отмена сохранения останавливает загрузку.',
};
