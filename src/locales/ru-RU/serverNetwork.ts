export default {
  'pages.servers.network.title': 'Настройки сети',
  'pages.servers.network.selection': 'Управление перегрузкой TCP',
  'pages.servers.network.aboutTitle': 'Об управлении перегрузкой TCP',
  'pages.servers.network.resultDetails': 'Подробности определения алгоритма',
  'pages.servers.network.unknown': 'Не удалось определить',
  'pages.servers.network.loading': 'Определение…',
  'pages.servers.network.multiple': 'По сетевому шаблону',
  'pages.servers.network.notConnected': 'Нет подключения',
  'pages.servers.network.notApplicable': 'TCP не используется',
  'pages.servers.network.about.system':
    'Текущая конфигурация TCP в наблюдаемой сети. Отдельные соединения могут использовать другой алгоритм.',
  'pages.servers.network.about.entry':
    'Алгоритм соединения, отправляющего изображение браузеру. При наличии прокси это последний входной прокси.',
  'pages.servers.network.about.relay':
    'Алгоритм соединения, отправляющего изображение от hbbr к веб-шлюзу.',
  'pages.servers.network.about.modify':
    'Управление перегрузкой TCP относится к сетевым механизмам системы. Здесь показаны только результаты чтения. Изменения выполняются в соответствующей системе, контейнере или приложении.',
  'pages.servers.network.currentConfiguration':
    'Алгоритм управления перегрузкой TCP отдельного соединения может отличаться от конфигурации системы.',
  'pages.servers.network.actualConnection':
    'Фактический алгоритм прочитан для этого отправляющего соединения.',
  'pages.servers.network.registeredAlgorithms': 'Доступные алгоритмы',
  'pages.servers.network.commonAlgorithms':
    'Типичные алгоритмы системы; поддержка на этой машине не подтверждена.',
  'pages.servers.network.algorithm': 'Алгоритм',
  'pages.servers.network.feature': 'Особенности',
  'pages.servers.network.suitable': 'Применение (результат нужно измерить)',
  'pages.servers.network.system.linux': 'Linux',
  'pages.servers.network.system.windows': 'Windows',
  'pages.servers.network.system.macos': 'macOS',
  'pages.servers.network.system.unknown': 'Система неизвестна',
  'pages.servers.network.deployment.native': 'Прямое развёртывание',
  'pages.servers.network.deployment.container': 'В контейнере',
  'pages.servers.network.deployment.kubernetes': 'В Kubernetes',
  'pages.servers.network.deployment.unknown': 'Развёртывание неизвестно',
  'pages.servers.network.scope.host': 'Эта система',
  'pages.servers.network.scope.container': 'Сеть контейнера',
  'pages.servers.network.scope.namespace': 'Изолированная сеть',
  'pages.servers.network.scope.unknown': 'Область наблюдения неизвестна',
  'pages.servers.network.reason.permission_denied':
    'Сервису недоступно чтение этой сети.',
  'pages.servers.network.reason.tool_unavailable':
    'Средства диагностики системы недоступны.',
  'pages.servers.network.reason.source_unavailable':
    'Не удалось прочитать сведения системы.',
  'pages.servers.network.reason.invalid_response':
    'Сведения неполные или недействительные.',
  'pages.servers.network.reason.platform_unobservable':
    'Не удалось прочитать алгоритм этого соединения в данной системе.',
  'pages.servers.network.reason.namespace_unobservable':
    'Сеть отправителя недоступна для чтения.',
  'pages.servers.network.reason.proxy_unobservable':
    'Входной прокси не сообщает фактический алгоритм этого соединения.',
  'pages.servers.network.reason.connection_not_found':
    'Подходящее отправляющее соединение не найдено.',
  'pages.servers.network.reason.ambiguous_connection':
    'Найдено несколько соединений; сессия не определена.',
  'pages.servers.network.reason.not_connected':
    'У сессии нет активного соединения.',
  'pages.servers.network.reason.not_tcp': 'Этот путь не использует TCP.',
  'pages.servers.network.reason.system_selected':
    'Система выбирает алгоритм по шаблону или политике соединения; единое значение не подтверждено.',
  'pages.servers.network.guide.reno.feature': 'Снижает скорость после потерь',
  'pages.servers.network.guide.reno.suitable':
    'Обычные сети с приоритетом совместимости',
  'pages.servers.network.guide.cubic.feature':
    'Регулирует скорость по окну перегрузки',
  'pages.servers.network.guide.cubic.suitable':
    'Публичные и высокоскоростные сети',
  'pages.servers.network.guide.bbr.feature': 'Оценивает полосу и задержку',
  'pages.servers.network.guide.bbr.suitable':
    'Дальние связи с высокой задержкой',
  'pages.servers.network.guide.hybrid.feature': 'Учитывает потери и задержку',
  'pages.servers.network.guide.hybrid.suitable': 'Баланс скорости и задержки',
  'pages.servers.network.guide.dctcp.feature':
    'Раннее обнаружение перегрузки через ECN',
  'pages.servers.network.guide.dctcp.suitable':
    'Сети центров обработки данных с ECN',
  'pages.servers.network.guide.prague.feature':
    'Использует очереди L4S с малой задержкой',
  'pages.servers.network.guide.prague.suitable': 'Сети и приложения с L4S',
  'pages.servers.network.guide.delay.feature':
    'Реагирует на задержку в очередях',
  'pages.servers.network.guide.delay.suitable':
    'Сети, требующие уменьшения очередей',
  'pages.servers.network.guide.background.feature':
    'Уступает полосу другим потокам',
  'pages.servers.network.guide.background.suitable':
    'Фоновые загрузки и низкий приоритет',
  'pages.servers.network.guide.other.feature':
    'Алгоритм, предоставленный системой',
  'pages.servers.network.guide.other.suitable':
    'См. документацию алгоритма в системе',
  'pages.servers.network.scopeLabel': 'Область чтения: ',
  'pages.servers.network.scopeContext.console':
    'Область чтения: сетевое окружение Console.',
  'pages.servers.network.scopeContext.node':
    'Область чтения: сетевое окружение зарегистрированного узла управления.',
  'pages.servers.network.managementUnavailable':
    'Управление сервером не подключено',
  'pages.servers.network.managementSetup':
    'Подключите управление для просмотра и управления hbbs и hbbr. Сведения о сети остаются доступными.',
};
