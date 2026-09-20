import { SetMetadata } from '@nestjs/common';

export const CHECK_OWNERSHIP_KEY = 'check_ownership';
export interface OwnershipRule {
  paramName: string; // The URL param containing the owner's userId, e.g. 'userId'
}
export const CheckOwnership = (paramName = 'userId') =>
  SetMetadata(CHECK_OWNERSHIP_KEY, { paramName } as OwnershipRule);
