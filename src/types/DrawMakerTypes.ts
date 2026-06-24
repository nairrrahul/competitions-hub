export interface TeamSlot {
  id: string;
  name: string;
  flagCode: string;
  isSelected?: boolean; // For confederation mode
  isHost?: boolean; // For competition mode
  isHighlighted?: boolean; // For playoff paths mode - right-click to highlight
}

export interface TeamData {
  presetType: PresetType;
  selectedCompetition: string;
  selectedConfederation: string;
  manualTeams: number;
  manualGroups: number;
  confederationGroups: number;
  homeAwayPairs: number;
  bracketTeams: number;
  playoffPaths?: number;
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

export type PresetType = 'manual' | 'confederation' | 'competition' | 'homeaway' | 'bracket' | 'playoffpaths';
export type Confederation = 'AFC' | 'CAF' | 'OFC' | 'UEFA' | 'CONCACAF' | 'CONMEBOL';