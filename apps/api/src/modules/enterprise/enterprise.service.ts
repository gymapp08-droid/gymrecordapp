import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  IEnterpriseOrgSettings,
  EnterpriseTier,
  UserRole,
} from '@alpha/types';
import { RbacUtil } from '@alpha/utils';
import { UpdateOrgSettingsDto } from '@alpha/validation';

export const DEFAULT_TIER_SEATS: Record<EnterpriseTier, number> = {
  STARTER: 10,
  PROFESSIONAL: 50,
  ENTERPRISE: 1000,
};

@Injectable()
export class EnterpriseService {
  // In-memory store for enterprise organization settings
  private readonly orgSettings = new Map<string, IEnterpriseOrgSettings>();
  private readonly orgMembers = new Map<string, string[]>(); // orgId -> userIds

  async getOrgSettings(orgId: string): Promise<IEnterpriseOrgSettings> {
    const existing = this.orgSettings.get(orgId);
    if (existing) {
      return existing;
    }

    const defaultSettings: IEnterpriseOrgSettings = {
      id: `settings_${orgId}`,
      organizationId: orgId,
      tier: 'PROFESSIONAL',
      maxSeats: DEFAULT_TIER_SEATS.PROFESSIONAL,
      allowedDomains: [],
      enforceSso: false,
      dataRetentionDays: 365,
      customBranding: {
        companyName: `Organization ${orgId}`,
        primaryColor: '#00F0FF',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.orgSettings.set(orgId, defaultSettings);
    return defaultSettings;
  }

  async updateOrgSettings(
    orgId: string,
    dto: UpdateOrgSettingsDto,
    actingUserRole: UserRole,
  ): Promise<IEnterpriseOrgSettings> {
    if (actingUserRole !== UserRole.ADMIN && actingUserRole !== UserRole.ORG_ADMIN) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only ORG_ADMIN or ADMIN can modify enterprise organization settings',
      });
    }

    const current = await this.getOrgSettings(orgId);
    const tier = (dto.tier || current.tier) as EnterpriseTier;
    const maxSeats = dto.maxSeats ?? (dto.tier ? DEFAULT_TIER_SEATS[tier] : current.maxSeats);

    const updated: IEnterpriseOrgSettings = {
      ...current,
      tier,
      maxSeats,
      allowedDomains: dto.allowedDomains ?? current.allowedDomains,
      enforceSso: dto.enforceSso ?? current.enforceSso,
      dataRetentionDays: dto.dataRetentionDays ?? current.dataRetentionDays,
      customBranding: {
        ...current.customBranding,
        ...dto.customBranding,
      },
      updatedAt: new Date().toISOString(),
    };

    this.orgSettings.set(orgId, updated);
    return updated;
  }

  async checkSeatAvailability(orgId: string): Promise<{
    seatsUsed: number;
    maxSeats: number;
    available: boolean;
    remaining: number;
  }> {
    const settings = await this.getOrgSettings(orgId);
    const members = this.orgMembers.get(orgId) || [];
    const seatsUsed = members.length;
    const maxSeats = settings.maxSeats;
    const remaining = Math.max(0, maxSeats - seatsUsed);

    return {
      seatsUsed,
      maxSeats,
      available: seatsUsed < maxSeats,
      remaining,
    };
  }

  async assignMember(orgId: string, userId: string, userEmail: string): Promise<boolean> {
    const settings = await this.getOrgSettings(orgId);

    // Validate domain whitelist if configured
    if (!RbacUtil.isDomainAllowed(userEmail, settings.allowedDomains)) {
      throw new BadRequestException({
        code: 'DOMAIN_NOT_ALLOWED',
        message: `Email ${userEmail} does not belong to allowed domains: [${settings.allowedDomains.join(', ')}]`,
      });
    }

    // Validate seat availability
    const seats = await this.checkSeatAvailability(orgId);
    if (!seats.available) {
      throw new BadRequestException({
        code: 'SEAT_LIMIT_EXCEEDED',
        message: `Organization has reached its enterprise seat limit of ${seats.maxSeats}`,
      });
    }

    const currentMembers = this.orgMembers.get(orgId) || [];
    if (!currentMembers.includes(userId)) {
      currentMembers.push(userId);
      this.orgMembers.set(orgId, currentMembers);
    }

    return true;
  }

  async removeMember(orgId: string, userId: string): Promise<boolean> {
    const currentMembers = this.orgMembers.get(orgId) || [];
    const filtered = currentMembers.filter((id) => id !== userId);
    this.orgMembers.set(orgId, filtered);
    return true;
  }

  async getMembers(orgId: string): Promise<string[]> {
    return this.orgMembers.get(orgId) || [];
  }
}
