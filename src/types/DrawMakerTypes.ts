export interface TeamSlot {
  id: string;
  name: string;
  flagCode: string;
  isSelected?: boolean; // For confederation mode
  isHost?: boolean; // For competition mode
}

export interface TeamData {
  presetType: 'manual' | 'confederation' | 'competition';
  selectedCompetition: string;
  selectedConfederation: string;
  manualTeams: number;
  manualGroups: number;
  confederationGroups: number;
  teamSlots: TeamSlot[];
}

export interface GroupStructure {
  [key: string]: number;
}

export interface DrawResult {
  success: boolean;
  groups: { [key: string]: (TeamSlot | null)[] };
}

export interface DisplayGroup {
  name: string;
  teams: (TeamSlot | null)[];
  maxTeams: number;
}
