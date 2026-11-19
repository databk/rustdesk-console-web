export default {
  'pages.users.list': 'Lista de usuarios',
  'pages.users.name': 'Nombre',
  'pages.users.displayName': 'Nombre visible',
  'pages.users.email': 'Correo electrónico',
  'pages.users.note': 'Nota',
  'pages.users.status': 'Estado',
  'pages.users.create': 'Crear usuario',
  'pages.users.createSuccess': 'Usuario creado',
  'pages.users.createFailed': 'No se pudo crear el usuario',
  'pages.users.deleteSuccess': 'Usuario eliminado',
  'pages.users.deleteFailed': 'No se pudo eliminar el usuario',
  'pages.users.deleteConfirm': '¿Seguro que quieres eliminar este usuario?',
  'pages.users.userGroup': 'Grupo de usuarios',
  'pages.users.selectUserGroup': 'Selecciona un grupo de usuarios',
  'pages.users.inviteSuccess': 'Invitación enviada',
  'pages.users.inviteFailed': 'No se pudo enviar la invitación',
  'pages.users.active': 'Activo',
  'pages.users.disabled': 'Desactivado',
  'pages.users.unverified': 'Sin verificar',
  'pages.users.roles': 'Roles',
  'pages.users.rolesTitle': 'Roles de {name}',
  'pages.users.rolesLoadFailed': 'No se pudieron cargar los roles del usuario',
  'pages.users.rolesSaveFailed': 'No se pudieron guardar los roles del usuario',
  'pages.users.rolesSaved': 'Roles del usuario guardados',
  'pages.users.addRole': 'Añadir rol',
  'pages.users.superAdmin': 'Superadministrador',
  'pages.users.roleAssignmentTitle': 'Rol {number}',
  'pages.users.selectRole': 'Seleccionar rol',
  'pages.users.removeRole': 'Quitar rol',
  'pages.users.roleRequired': 'Selecciona un rol en cada asignación',
  'pages.users.duplicateRole': 'Un rol solo se puede asignar una vez',
  'pages.users.scopeMode': 'Modo de ámbito del rol',
  'pages.users.globalScope': 'Global',
  'pages.users.deviceGroupScope': 'Grupos de dispositivos seleccionados',
  'pages.users.selectDeviceGroups':
    'Selecciona uno o varios grupos de dispositivos',
  'pages.users.unsupportedDeviceGroupScope':
    'El ámbito por grupo de dispositivos solo está disponible para roles que incluyen acciones sobre dispositivos y asignación de estrategias',
  'pages.users.deviceGroupScopeRequired':
    'Selecciona al menos un grupo de dispositivos para una asignación por grupo de dispositivos',
  'pages.users.rolesScopeInfo':
    'Las concesiones globales prevalecen sobre las concesiones más limitadas por grupo de dispositivos.',
  'pages.users.protectedAccount': 'Cuenta protegida',
  'pages.users.protectedAccountInfo':
    'Las cuentas protegidas solo las puede gestionar el superadministrador.',
  'pages.users.systemOwnerStatusBlocked':
    'El propietario del sistema no se puede activar ni desactivar.',
  'pages.users.systemOwnerMutationBlocked':
    'El propietario del sistema no se puede desactivar ni eliminar.',
  'pages.users.systemCapabilities': 'Capacidades del sistema',
  'pages.users.systemCapability.roles.create': 'Crear definiciones de roles',
  'pages.users.systemCapability.roles.edit': 'Editar definiciones de roles',
  'pages.users.systemCapability.roles.delete': 'Eliminar definiciones de roles',
  'pages.users.systemCapability.settings.manage':
    'Gestionar la configuración del sistema',
  'pages.users.systemCapability.device_groups.manage':
    'Gestionar la estructura de grupos de dispositivos',
  'pages.users.systemCapability.identity_sources.manage':
    'Gestionar los orígenes de identidad',
  'pages.users.roleEligibility.assign_not_allowed':
    'No puedes asignar este rol',
  'pages.users.roleEligibility.remove_not_allowed': 'No puedes quitar este rol',
  'pages.users.roleEligibility.protected_role':
    'Solo el superadministrador puede asignar o quitar roles protegidos',
  'pages.users.roleEligibility.protected_target':
    'La cuenta de destino está protegida',
  'pages.users.roleEligibility.super_admin_target':
    'No se pueden asignar roles normales al superadministrador',
  'pages.users.roleEligibility.self_target':
    'No puedes cambiar tus propios roles',
  'pages.users.roleEligibility.missing_caller_scope':
    'Tu ámbito de permisos es insuficiente',
  'pages.users.roleEligibility.scope_exceeds_caller':
    'El ámbito del rol supera tus permisos',
  'pages.users.roleEligibility.missing_permission':
    'Te falta un permiso que requiere este rol',
  'pages.users.roleEligibility.role_grants_roles_assign':
    'Solo el superadministrador puede gestionar roles que conceden la asignación de roles',
  'pages.users.effectiveScope': 'Ámbito efectivo',
  'pages.users.strategy': 'Estrategia',
  'pages.users.invite': 'Invitar usuario',
  'pages.users.password': 'Contraseña',
  'pages.users.isAdmin': 'Administrador',
  'pages.users.normalUser': 'Usuario normal',
  'pages.users.edit': 'Editar usuario',
  'pages.users.updateSuccess': 'Usuario actualizado',
  'pages.users.updateFailed': 'No se pudo actualizar el usuario',
  'pages.users.security': 'Seguridad',
  'pages.users.securitySettings': 'Configuración de seguridad',
  'pages.users.securityUpdateSuccess': 'Configuración de seguridad actualizada',
  'pages.users.securityUpdateFailed':
    'No se pudo actualizar la configuración de seguridad',
  'pages.users.tfaEnforce': 'Exigir la autenticación en dos pasos',
  'pages.users.emailVerification':
    'Exigir la verificación del correo electrónico',
  'pages.users.resetPassword': 'Restablecer contraseña',
  'pages.users.resetPasswordTooltip':
    'Déjalo vacío para mantener la contraseña actual',
  'pages.users.confirmPassword': 'Confirmar contraseña',
  'pages.users.passwordMismatch': 'Las contraseñas no coinciden',
  'pages.users.passwordTooShort':
    'La contraseña debe tener al menos 6 caracteres',
  'pages.users.forceLogout': 'Cerrar sesión',
  'pages.users.forceLogoutSuccess': 'Cierre de sesión forzado correctamente',
  'pages.users.forceLogoutFailed': 'No se pudo forzar el cierre de sesión',
  'pages.users.batchEnable': 'Activar en lote',
  'pages.users.batchDisable': 'Desactivar en lote',
  'pages.users.batchForceLogout': 'Forzar cierre de sesión en lote',
  'pages.users.batchEnableConfirm':
    '¿Seguro que quieres activar los usuarios seleccionados?',
  'pages.users.batchDisableConfirm':
    '¿Seguro que quieres desactivar los usuarios seleccionados?',
  'pages.users.batchForceLogoutConfirm':
    '¿Seguro que quieres forzar el cierre de sesión de los usuarios seleccionados?',
  'pages.users.batchEnableSuccess':
    '{count} usuario(s) activado(s) correctamente',
  'pages.users.batchEnableFailed': 'No se pudieron activar los usuarios',
  'pages.users.batchEnablePartialFailed':
    '{success} usuario(s) activado(s) correctamente, {failed} con error',
  'pages.users.batchDisableSuccess':
    '{count} usuario(s) desactivado(s) correctamente',
  'pages.users.batchDisableFailed': 'No se pudieron desactivar los usuarios',
  'pages.users.batchDisablePartialFailed':
    '{success} usuario(s) desactivado(s) correctamente, {failed} con error',
  'pages.users.batchForceLogoutSuccess':
    'Cierre de sesión forzado en lote correctamente',
  'pages.users.batchForceLogoutFailed':
    'No se pudo forzar el cierre de sesión de los usuarios',
  'pages.users.admin': 'Administrador',
  'pages.users.me': 'Tú',
  'pages.users.searchNamePlaceholder': 'Buscar por nombre de usuario',
  'pages.users.searchEmailPlaceholder': 'Buscar por correo electrónico',
  'pages.users.searchStrategyPlaceholder': 'Buscar por estrategia',
  'pages.users.searchUserGroupPlaceholder': 'Buscar por grupo de usuarios',
};
