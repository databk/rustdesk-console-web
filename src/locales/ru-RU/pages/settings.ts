export default {
  'pages.settings.save': 'Сохранить настройки',
  'pages.settings.general': 'Общие настройки',
  'pages.settings.fetchFailed': 'Не удалось загрузить настройки',
  'pages.settings.saveSuccess': 'Настройки успешно сохранены',
  'pages.settings.saveFailed': 'Не удалось сохранить настройки',
  'pages.settings.generalSection.watermark':
    'Водяной знак с именем пользователя',
  'pages.settings.generalSection.watermarkExtra':
    'Отображать имя текущего пользователя поверх каждой страницы для повышения ответственности.',
  'pages.settings.generalSection.language': 'Язык по умолчанию',
  'pages.settings.generalSection.languageExtra':
    'Язык интерфейса по умолчанию для новых посетителей. Авторизованные пользователи сохраняют свои предпочтения.',
  'pages.settings.generalSection.languagePlaceholder':
    'Выберите язык по умолчанию',
  'pages.settings.generalSection.site': 'Сайт',
  'pages.settings.generalSection.frontendUrl': 'URL фронтенда',
  'pages.settings.generalSection.frontendUrlPlaceholder':
    'https://console.example.com',
  'pages.settings.generalSection.backendUrl': 'URL бэкенда',
  'pages.settings.generalSection.backendUrlExtra':
    'Оставьте пустым для использования того же источника, что и фронтенд.',
  'pages.settings.generalSection.backendUrlPlaceholder':
    'https://api.example.com',
  'pages.settings.generalSection.urlInvalid':
    'Пожалуйста, введите корректный URL',
  'pages.settings.generalSection.webauthn': 'WebAuthn / Passkeys',
  'pages.settings.generalSection.webauthnEnabled': 'Включить WebAuthn',
  'pages.settings.generalSection.webauthnEnabledExtra':
    'Разрешить пользователям регистрироваться и входить с помощью ключей доступа (passkeys).',
  'pages.settings.generalSection.webauthnUnsupported':
    'Этот браузер не поддерживает WebAuthn. Вход с помощью passkey будет недоступен для пользователей на неподдерживаемых клиентах.',
  'pages.settings.generalSection.rpName': 'Название полагающейся стороны',
  'pages.settings.generalSection.rpNameExtra':
    'Понятное пользователю название, отображаемое в запросе на использование passkey.',
  'pages.settings.generalSection.rpNamePlaceholder': 'RustDesk Console',
  'pages.settings.generalSection.security': 'Безопасность и обслуживание',
  'pages.settings.generalSection.jwtExpiryDays':
    'Срок действия JWT-токена (дни)',
  'pages.settings.generalSection.jwtExpiryDaysExtra':
    'Количество дней до истечения срока действия токенов пользователей. Должно быть не менее 1.',
  'pages.settings.generalSection.jwtExpiryDaysRequired':
    'Введите положительное целое число',
  'pages.settings.generalSection.auditRetentionDays':
    'Хранение журналов аудита (дни)',
  'pages.settings.generalSection.auditRetentionDaysExtra':
    'Количество дней хранения журналов аудита перед автоматической очисткой. Установите 0 для отключения.',
  'pages.settings.generalSection.auditRetentionDaysRequired':
    'Введите неотрицательное целое число',
  'pages.settings.generalSection.deviceCloneIsolation':
    'Изоляция клонов устройств',
  'pages.settings.generalSection.deviceCloneIsolationWarning':
    'Не отключайте случайно после включения. Устаревший режим не может разрешить производные записи и может создать дубликаты или объединённые устройства. Сделайте резервную копию базы данных перед включением. См. docs/clone-isolation.md.',
  'pages.settings.generalSection.deviceCloneIsolationExtra':
    'Разделять клонированные клиенты с общим UUID, но разными ID RustDesk. Выключено по умолчанию.',
};
