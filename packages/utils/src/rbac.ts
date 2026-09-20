import { UserRole, EnterprisePermission } from '@alpha/types';

export const ROLE_PERMISSIONS: Record<UserRole, readonly EnterprisePermission[]> = {
  [UserRole.ADMIN]: [
    EnterprisePermission.VIEW_CLIENT_TELEMETRY,
    EnterprisePermission.MANAGE_CLIENT_PROGRAM,
    EnterprisePermission.MANAGE_CLIENT_NUTRITION,
    EnterprisePermission.EXPORT_ORG_DATA,
    EnterprisePermission.MANAGE_ORG_MEMBERS,
    EnterprisePermission.MANAGE_ORG_SETTINGS,
    EnterprisePermission.AUDIT_LOG_READ,
    EnterprisePermission.EXPORT_PERSONAL_DATA,
    EnterprisePermission.ERASE_PERSONAL_DATA,
  ],
  [UserRole.ORG_ADMIN]: [
    EnterprisePermission.VIEW_CLIENT_TELEMETRY,
    EnterprisePermission.MANAGE_CLIENT_PROGRAM,
    EnterprisePermission.MANAGE_CLIENT_NUTRITION,
    EnterprisePermission.EXPORT_ORG_DATA,
    EnterprisePermission.MANAGE_ORG_MEMBERS,
    EnterprisePermission.MANAGE_ORG_SETTINGS,
    EnterprisePermission.AUDIT_LOG_READ,
    EnterprisePermission.EXPORT_PERSONAL_DATA,
    EnterprisePermission.ERASE_PERSONAL_DATA,
  ],
  [UserRole.COACH]: [
    EnterprisePermission.VIEW_CLIENT_TELEMETRY,
    EnterprisePermission.MANAGE_CLIENT_PROGRAM,
    EnterprisePermission.EXPORT_PERSONAL_DATA,
  ],
  [UserRole.TRAINER]: [
    EnterprisePermission.VIEW_CLIENT_TELEMETRY,
    EnterprisePermission.MANAGE_CLIENT_PROGRAM,
    EnterprisePermission.EXPORT_PERSONAL_DATA,
  ],
  [UserRole.NUTRITIONIST]: [
    EnterprisePermission.VIEW_CLIENT_TELEMETRY,
    EnterprisePermission.MANAGE_CLIENT_NUTRITION,
    EnterprisePermission.EXPORT_PERSONAL_DATA,
  ],
  [UserRole.ATHLETE]: [
    EnterprisePermission.EXPORT_PERSONAL_DATA,
    EnterprisePermission.ERASE_PERSONAL_DATA,
  ],
};

export const RbacUtil = {
  /**
   * Check if a user role has a specific enterprise permission
   */
  hasPermission(role: UserRole, permission: EnterprisePermission): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  },

  /**
   * Check if a user role has all of the required permissions
   */
  hasAllPermissions(role: UserRole, permissions: EnterprisePermission[]): boolean {
    return permissions.every((p) => this.hasPermission(role, p));
  },

  /**
   * Check if a user role has at least one of the required permissions
   */
  hasAnyPermission(role: UserRole, permissions: EnterprisePermission[]): boolean {
    return permissions.some((p) => this.hasPermission(role, p));
  },

  /**
   * Strict Tenant Boundary Enforcement:
   * Super Admins can access any tenant for cross-system auditing.
   * All other roles are strictly locked to their assigned organizationId.
   */
  canAccessTenant(
    userOrgId: string | undefined | null,
    targetOrgId: string,
    role: UserRole,
  ): boolean {
    if (role === UserRole.ADMIN) {
      return true;
    }
    if (!userOrgId || !targetOrgId) {
      return false;
    }
    return userOrgId === targetOrgId;
  },

  /**
   * Validate if an email address belongs to one of the organization's whitelisted domains
   */
  isDomainAllowed(email: string, allowedDomains: string[]): boolean {
    if (!allowedDomains || allowedDomains.length === 0) {
      return true; // No domain restrictions configured
    }
    const domain = email.split('@')[1]?.toLowerCase().trim();
    if (!domain) return false;

    return allowedDomains.some((d) => d.toLowerCase().trim() === domain);
  },
};
