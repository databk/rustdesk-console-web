export default {
  'pages.users.list': 'Список пользователей',
  'pages.users.name': 'Имя',
  'pages.users.displayName': 'Отображаемое имя',
  'pages.users.email': 'Email',
  'pages.users.note': 'Примечание',
  'pages.users.status': 'Статус',
  'pages.users.create': 'Создать пользователя',
  'pages.users.createSuccess': 'Пользователь создан',
  'pages.users.createFailed': 'Не удалось создать пользователя',
  'pages.users.deleteSuccess': 'Пользователь удален',
  'pages.users.deleteFailed': 'Не удалось удалить пользователя',
  'pages.users.deleteConfirm':
    'Вы уверены, что хотите удалить этого пользователя?',
  'pages.users.userGroup': 'Группа пользователей',
  'pages.users.selectUserGroup': 'Выберите группу пользователей',
  'pages.users.inviteSuccess': 'Приглашение отправлено',
  'pages.users.inviteFailed': 'Не удалось отправить приглашение',
  'pages.users.active': 'Активен',
  'pages.users.disabled': 'Отключен',
  'pages.users.unverified': 'Не подтвержден',
  'pages.users.roles': 'Роли',
  'pages.users.rolesTitle': 'Роли пользователя {name}',
  'pages.users.rolesLoadFailed': 'Не удалось загрузить роли пользователя',
  'pages.users.rolesSaveFailed': 'Не удалось сохранить роли пользователя',
  'pages.users.rolesSaved': 'Роли пользователя сохранены',
  'pages.users.addRole': 'Добавить роль',
  'pages.users.superAdmin': 'Суперадминистратор',
  'pages.users.roleAssignmentTitle': 'Роль {number}',
  'pages.users.selectRole': 'Выберите роль',
  'pages.users.removeRole': 'Удалить роль',
  'pages.users.roleRequired': 'Выберите роль для каждого назначения',
  'pages.users.duplicateRole': 'Каждую роль можно назначить только один раз',
  'pages.users.scopeMode': 'Область действия роли',
  'pages.users.globalScope': 'Глобально',
  'pages.users.deviceGroupScope': 'Выбранные группы устройств',
  'pages.users.selectDeviceGroups':
    'Выберите одну или несколько групп устройств',
  'pages.users.unsupportedDeviceGroupScope':
    'Область по группам устройств доступна только для ролей с действиями над устройствами или назначением стратегий',
  'pages.users.deviceGroupScopeRequired':
    'Выберите хотя бы одну группу устройств',
  'pages.users.rolesScopeInfo':
    'Глобальные права перекрывают права для отдельных групп устройств.',
  'pages.users.protectedAccount': 'Защищённый аккаунт',
  'pages.users.protectedAccountInfo':
    'Управлять защищёнными аккаунтами может только суперадминистратор.',
  'pages.users.systemOwnerStatusBlocked':
    'Владельца системы нельзя активировать или отключить.',
  'pages.users.systemOwnerMutationBlocked':
    'Владельца системы нельзя отключить или удалить.',
  'pages.users.systemCapabilities': 'Системные возможности',
  'pages.users.systemCapability.roles.create': 'Создание определений ролей',
  'pages.users.systemCapability.roles.edit': 'Изменение определений ролей',
  'pages.users.systemCapability.roles.delete': 'Удаление определений ролей',
  'pages.users.systemCapability.settings.manage':
    'Управление системными настройками',
  'pages.users.systemCapability.device_groups.manage':
    'Управление структурой групп устройств',
  'pages.users.systemCapability.identity_sources.manage':
    'Управление источниками удостоверений',
  'pages.users.roleEligibility.assign_not_allowed':
    'Вы не можете назначить эту роль',
  'pages.users.roleEligibility.remove_not_allowed':
    'Вы не можете удалить эту роль',
  'pages.users.roleEligibility.protected_role':
    'Защищённые роли может назначать или удалять только суперадминистратор',
  'pages.users.roleEligibility.protected_target': 'Целевой аккаунт защищён',
  'pages.users.roleEligibility.super_admin_target':
    'Обычные роли нельзя назначать суперадминистратору',
  'pages.users.roleEligibility.self_target': 'Нельзя изменять собственные роли',
  'pages.users.roleEligibility.missing_caller_scope':
    'Недостаточный охват разрешений',
  'pages.users.roleEligibility.scope_exceeds_caller':
    'Охват роли превышает ваши разрешения',
  'pages.users.roleEligibility.missing_permission':
    'У вас нет разрешения, необходимого для этой роли',
  'pages.users.roleEligibility.role_grants_roles_assign':
    'Роли, предоставляющие назначение ролей, может изменять только суперадминистратор',
  'pages.users.effectiveScope': 'Фактическая область действия',
  'pages.users.strategy': 'Стратегия',
  'pages.users.invite': 'Пригласить пользователя',
  'pages.users.password': 'Пароль',
  'pages.users.isAdmin': 'Администратор',
  'pages.users.normalUser': 'Обычный',
  'pages.users.edit': 'Редактировать пользователя',
  'pages.users.updateSuccess': 'Пользователь обновлен',
  'pages.users.updateFailed': 'Не удалось обновить пользователя',
  'pages.users.security': 'Безопасность',
  'pages.users.securitySettings': 'Настройки безопасности',
  'pages.users.securityUpdateSuccess': 'Настройки безопасности обновлены',
  'pages.users.securityUpdateFailed':
    'Не удалось обновить настройки безопасности',
  'pages.users.tfaEnforce': 'Обязательная двухфакторная аутентификация',
  'pages.users.emailVerification': 'Требовать подтверждение email',
  'pages.users.resetPassword': 'Сбросить пароль',
  'pages.users.resetPasswordTooltip':
    'Оставьте пустым, чтобы сохранить текущий пароль',
  'pages.users.confirmPassword': 'Подтвердите пароль',
  'pages.users.passwordMismatch': 'Пароли не совпадают',
  'pages.users.passwordTooShort': 'Пароль должен содержать не менее 6 символов',
  'pages.users.forceLogout': 'Принудительный выход',
  'pages.users.forceLogoutSuccess': 'Принудительный выход выполнен успешно',
  'pages.users.forceLogoutFailed': 'Не удалось выполнить принудительный выход',
  'pages.users.batchEnable': 'Массовое включение',
  'pages.users.batchDisable': 'Массовое отключение',
  'pages.users.batchForceLogout': 'Массовый принудительный выход',
  'pages.users.batchEnableConfirm':
    'Вы уверены, что хотите включить выбранных пользователей?',
  'pages.users.batchDisableConfirm':
    'Вы уверены, что хотите отключить выбранных пользователей?',
  'pages.users.batchForceLogoutConfirm':
    'Вы уверены, что хотите выполнить принудительный выход для выбранных пользователей?',
  'pages.users.batchEnableSuccess': 'Успешно включено {count} пользователь(ей)',
  'pages.users.batchEnableFailed': 'Не удалось включить пользователей',
  'pages.users.batchEnablePartialFailed':
    'Успешно включено {success} пользователь(ей), {failed} не удалось',
  'pages.users.batchDisableSuccess':
    'Успешно отключено {count} пользователь(ей)',
  'pages.users.batchDisableFailed': 'Не удалось отключить пользователей',
  'pages.users.batchDisablePartialFailed':
    'Успешно отключено {success} пользователь(ей), {failed} не удалось',
  'pages.users.batchForceLogoutSuccess':
    'Массовый принудительный выход выполнен успешно',
  'pages.users.batchForceLogoutFailed':
    'Не удалось выполнить массовый принудительный выход',
  'pages.users.admin': 'Администратор',
  'pages.users.me': 'Я',
  'pages.users.searchNamePlaceholder': 'Поиск по имени пользователя',
  'pages.users.searchEmailPlaceholder': 'Поиск по email',
  'pages.users.searchStrategyPlaceholder': 'Поиск по стратегии',
  'pages.users.searchUserGroupPlaceholder': 'Поиск по группе пользователей',
};
