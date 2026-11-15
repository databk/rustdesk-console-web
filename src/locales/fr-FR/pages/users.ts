export default {
  'pages.users.list': 'Liste des utilisateurs',
  'pages.users.name': 'Nom',
  'pages.users.displayName': "Nom d'affichage",
  'pages.users.email': 'E-mail',
  'pages.users.note': 'Note',
  'pages.users.status': 'Statut',
  'pages.users.create': 'Créer un utilisateur',
  'pages.users.createSuccess': 'Utilisateur créé',
  'pages.users.createFailed': "Échec de la création de l'utilisateur",
  'pages.users.deleteSuccess': 'Utilisateur supprimé',
  'pages.users.deleteFailed': "Échec de la suppression de l'utilisateur",
  'pages.users.deleteConfirm':
    'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
  'pages.users.userGroup': "Groupe d'utilisateurs",
  'pages.users.selectUserGroup': "Sélectionner un groupe d'utilisateurs",
  'pages.users.inviteSuccess': 'Invitation envoyée',
  'pages.users.inviteFailed': "Échec de l'envoi de l'invitation",
  'pages.users.active': 'Actif',
  'pages.users.disabled': 'Désactivé',
  'pages.users.unverified': 'Non vérifié',
  'pages.users.strategy': 'Stratégie',
  'pages.users.invite': 'Inviter un utilisateur',
  'pages.users.password': 'Mot de passe',
  'pages.users.isAdmin': 'Admin',
  'pages.users.normalUser': 'Normal',
  'pages.users.edit': "Modifier l'utilisateur",
  'pages.users.updateSuccess': 'Utilisateur mis à jour',
  'pages.users.updateFailed': "Échec de la mise à jour de l'utilisateur",
  'pages.users.security': 'Sécurité',
  'pages.users.securitySettings': 'Paramètres de sécurité',
  'pages.users.securityUpdateSuccess': 'Paramètres de sécurité mis à jour',
  'pages.users.securityUpdateFailed':
    'Échec de la mise à jour des paramètres de sécurité',
  'pages.users.tfaEnforce': "Imposer l'authentification à deux facteurs",
  'pages.users.emailVerification': "Exiger la vérification de l'e-mail",
  'pages.users.resetPassword': 'Réinitialiser le mot de passe',
  'pages.users.resetPasswordTooltip':
    'Laisser vide pour conserver le mot de passe actuel',
  'pages.users.confirmPassword': 'Confirmer le mot de passe',
  'pages.users.passwordMismatch': 'Les mots de passe ne correspondent pas',
  'pages.users.passwordTooShort':
    'Le mot de passe doit contenir au moins 6 caractères',
  'pages.users.forceLogout': 'Déconnexion',
  'pages.users.forceLogoutSuccess': 'Déconnexion forcée réussie',
  'pages.users.forceLogoutFailed': 'Échec de la déconnexion forcée',
  'pages.users.batchEnable': 'Activer en lot',
  'pages.users.batchDisable': 'Désactiver en lot',
  'pages.users.batchForceLogout': 'Forcer la déconnexion en lot',
  'pages.users.batchEnableConfirm':
    'Êtes-vous sûr de vouloir activer les utilisateurs sélectionnés ?',
  'pages.users.batchDisableConfirm':
    'Êtes-vous sûr de vouloir désactiver les utilisateurs sélectionnés ?',
  'pages.users.batchForceLogoutConfirm':
    'Êtes-vous sûr de vouloir forcer la déconnexion des utilisateurs sélectionnés ?',
  'pages.users.batchEnableSuccess':
    '{count} utilisateur(s) activé(s) avec succès',
  'pages.users.batchEnableFailed': "Échec de l'activation des utilisateurs",
  'pages.users.batchEnablePartialFailed':
    '{success} utilisateur(s) activé(s) avec succès, {failed} échec(s)',
  'pages.users.batchDisableSuccess':
    '{count} utilisateur(s) désactivé(s) avec succès',
  'pages.users.batchDisableFailed':
    'Échec de la désactivation des utilisateurs',
  'pages.users.batchDisablePartialFailed':
    '{success} utilisateur(s) désactivé(s) avec succès, {failed} échec(s)',
  'pages.users.batchForceLogoutSuccess': 'Déconnexion forcée en lot réussie',
  'pages.users.batchForceLogoutFailed':
    'Échec de la déconnexion forcée des utilisateurs',
  'pages.users.admin': 'Admin',
  'pages.users.me': 'Moi',
  'pages.users.addRole': 'Ajouter un rôle',
  'pages.users.deviceGroupScope': "Groupes d'appareils sélectionnés",
  'pages.users.deviceGroupScopeRequired':
    "Sélectionnez au moins un groupe d'appareils pour une attribution de groupe d'appareils",
  'pages.users.duplicateRole':
    "Un rôle ne peut être attribué qu'une seule fois",
  'pages.users.effectiveScope': 'Portée effective',
  'pages.users.globalScope': 'Global',
  'pages.users.protectedAccount': 'Compte protégé',
  'pages.users.protectedAccountInfo':
    'Les comptes protégés ne peuvent être gérés que par le super administrateur.',
  'pages.users.systemOwnerStatusBlocked':
    'Le propriétaire du système ne peut pas être activé ou désactivé.',
  'pages.users.systemOwnerMutationBlocked':
    'Le propriétaire du système ne peut pas être désactivé ni supprimé.',
  'pages.users.removeRole': 'Retirer le rôle',
  'pages.users.roleAssignmentTitle': 'Rôle {number}',
  'pages.users.roleEligibility.assign_not_allowed':
    'Vous ne pouvez pas attribuer ce rôle',
  'pages.users.roleEligibility.missing_caller_scope':
    "Votre portée d'autorisation est insuffisante",
  'pages.users.roleEligibility.missing_permission':
    'Il vous manque une autorisation requise par ce rôle',
  'pages.users.roleEligibility.protected_role':
    'Les rôles protégés ne peuvent être attribués ou retirés que par le super administrateur',
  'pages.users.roleEligibility.protected_target': 'Le compte cible est protégé',
  'pages.users.roleEligibility.remove_not_allowed':
    'Vous ne pouvez pas retirer ce rôle',
  'pages.users.roleEligibility.role_grants_roles_assign':
    "Les rôles qui accordent l'attribution de rôles ne peuvent être gérés que par le super administrateur",
  'pages.users.roleEligibility.scope_exceeds_caller':
    'La portée du rôle dépasse vos autorisations',
  'pages.users.roleEligibility.self_target':
    'Vous ne pouvez pas modifier vos propres rôles',
  'pages.users.roleEligibility.super_admin_target':
    'Les rôles ordinaires ne peuvent être attribués au super administrateur',
  'pages.users.roleRequired': 'Sélectionnez un rôle pour chaque attribution',
  'pages.users.roles': 'Rôles',
  'pages.users.rolesLoadFailed': 'Échec du chargement des rôles utilisateur',
  'pages.users.rolesSaveFailed':
    "Échec de l'enregistrement des rôles utilisateur",
  'pages.users.rolesSaved': 'Rôles utilisateur enregistrés',
  'pages.users.rolesScopeInfo':
    "Les attributions globales remplacent les attributions plus restreintes de groupes d'appareils.",
  'pages.users.rolesTitle': 'Rôles de {name}',
  'pages.users.scopeMode': 'Mode de portée du rôle',
  'pages.users.selectDeviceGroups':
    "Sélectionnez un ou plusieurs groupes d'appareils",
  'pages.users.selectRole': 'Sélectionner un rôle',
  'pages.users.superAdmin': 'Super administrateur',
  'pages.users.systemCapabilities': 'Capacités système',
  'pages.users.systemCapability.device_groups.manage':
    "Gérer la structure des groupes d'appareils",
  'pages.users.systemCapability.identity_sources.manage':
    "Gérer les sources d'identité",
  'pages.users.systemCapability.roles.create': 'Créer des définitions de rôles',
  'pages.users.systemCapability.roles.delete':
    'Supprimer des définitions de rôles',
  'pages.users.systemCapability.roles.edit':
    'Modifier des définitions de rôles',
  'pages.users.systemCapability.settings.manage':
    'Gérer les paramètres système',
  'pages.users.unsupportedDeviceGroupScope':
    "La portée de groupe d'appareils n'est disponible que pour les rôles contenant des actions sur les appareils et l'attribution de stratégies",
  'pages.users.searchNamePlaceholder': "Rechercher par nom d'utilisateur",
  'pages.users.searchEmailPlaceholder': 'Rechercher par email',
  'pages.users.searchStrategyPlaceholder': 'Rechercher par stratégie',
  'pages.users.searchUserGroupPlaceholder':
    "Rechercher par groupe d'utilisateurs",
};
