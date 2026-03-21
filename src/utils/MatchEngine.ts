import type { Squad, Player } from '../types/rosterManager';

export interface GoalInfo {
  goalScorer: Player;
  assist: Player | null;
  minute: number;
}

export interface Penalties {
  team1Name: string;
  team2Name: string;
  team1Results: ('X' | 'O')[];
  team2Results: ('X' | 'O')[];
}

export interface GSTeamPoints {
  team1Points: number;
  team2Points: number;
}

export interface MatchResult {
  team1Goals: number;
  team2Goals: number;
  team1GoalInfo: GoalInfo[];
  team2GoalInfo: GoalInfo[];
  penalties: Penalties | null;
  cleanSheetNames: Player[];
  pointsInfo: GSTeamPoints | null;
  // substitutions: {
  //   team1: Array<{ playerOut: Player; playerIn: Player; minute: number }>;
  //   team2: Array<{ playerOut: Player; playerIn: Player; minute: number }>;
  // };
}

export type RoundType = 'GROUP' | 'KO' | 'P3';

export function simulateMatch(team1Squad: Squad, team2Squad: Squad, roundType: RoundType): MatchResult {
  return {
    team1Goals: 0,
    team2Goals: 0,
    team1GoalInfo: [],
    team2GoalInfo: [],
    penalties: null,
    cleanSheetNames: [team1Squad.starters.gk.player, team2Squad.starters.gk.player],
    pointsInfo: {
      team1Points: 1,
      team2Points: 1
    }
  }
}
  // In a real implementation, this would be based on player stats, team chemistry, etc.
