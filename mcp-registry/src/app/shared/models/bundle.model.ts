export interface Bundle {
  bundleId: string;
  name: string;
  description: string;
  toolIds: string[];
  version: string;
  createdAt: string;
  updatedAt: string;
  ownerTeam: string;
  tags: string[];
  active: boolean;
}

