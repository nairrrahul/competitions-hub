import React from 'react';
import RoundRobinStagesSection from './RoundRobinStagesSection';
import MatchesSection from '../GROUPKO/MatchesSection';
import PlayerStatsSection from '../GROUPKO/PlayerStatsSection';
import type { Squad } from '../../../types/rosterManager';
import type { RearrangedSchedule } from '../SimulatorTab';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  isHA?: boolean;
  groups?: { [key: string]: string[] };
  pairs?: { home: string; away: string }[];
}

interface GroupTeamStats {
  countryName: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface TransformedGroups {
  [groupName: string]: GroupTeamStats[];
}

interface RoundRobinSimulatorProbs {
  importedCompetition: ImportedCompetition;
  matchSchedule: RearrangedSchedule;
  competitionSquads: { [nation: string]: Squad };
  transformedStandings: TransformedGroups
}

const RoundRobinSimulator: React.FC<RoundRobinSimulatorProbs> = ({ importedCompetition, matchSchedule, competitionSquads, transformedStandings }) => {

  console.log(competitionSquads);
  
  return (
    <div className="flex h-full p-6 gap-4">
      {/* Left Panel - Stages (full height) */}
      <div className="w-3/8 h-full">
        <RoundRobinStagesSection 
          importedCompetition={importedCompetition} 
          transformedGroups={transformedStandings}
        />
      </div>
      
      {/* Right Panel - Matches and Player Stats (stacked) */}
      <div className="w-5/8 h-full flex flex-col gap-4">
        <div className="h-1/2">
          <MatchesSection importedCompetition={importedCompetition} matchSchedule={matchSchedule} />
        </div>
        <div className="h-1/2">
          <PlayerStatsSection importedCompetition={importedCompetition} matchSchedule={matchSchedule} />
        </div>
      </div>
    </div>
  );
};

export default RoundRobinSimulator;
