/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Debonair LTD (Unit-02) — IE Department
 * Role-Based Access Control (RBAC) Tier Summary Table Component
 * (Merged & Delegated to Canonical UnifiedPermissionMatrix)
 */

import React from 'react';
import { RoleTier, UserProfile } from '../types';
import { UnifiedPermissionMatrix } from './UnifiedPermissionMatrix';

export interface RbacTierSummaryTableProps {
  roleTiers: RoleTier[];
  activeTierId: string;
  onSelectTier: (tier: RoleTier) => void;
  profile?: UserProfile;
  onOpenRoleEditor?: (tierId?: string) => void;
}

export const RbacTierSummaryTable: React.FC<RbacTierSummaryTableProps> = ({
  roleTiers,
  activeTierId,
  onSelectTier,
  profile,
  onOpenRoleEditor
}) => {
  return (
    <UnifiedPermissionMatrix
      roleTiers={roleTiers}
      activeTierId={activeTierId}
      profile={profile}
      onSelectTier={onSelectTier}
      onOpenRoleEditor={onOpenRoleEditor}
      initialViewMode="sop_summary"
    />
  );
};
