import React from 'react';
import StagesSection from './StagesSection';
import MatchesSection from './MatchesSection';
import PlayerStatsSection from './PlayerStatsSection';
import type { Squad } from '../../../types/rosterManager';
import type { RearrangedSchedule } from '../SimulatorTab';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  groups: { [key: string]: string[] };
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

interface GroupKOSimulatorProps {
  importedCompetition: ImportedCompetition;
  matchSchedule: RearrangedSchedule;
  competitionSquads: { [nation: string]: Squad };
  transformedStandings: TransformedGroups
}

const GroupKOSimulator: React.FC<GroupKOSimulatorProps> = ({ importedCompetition, matchSchedule, competitionSquads, transformedStandings }) => {
  const [selectedStage, setSelectedStage] = React.useState<string>('');

  console.log(competitionSquads);
  
  return (
    <div className="flex h-full p-6 gap-4">
      {/* Left Panel - Stages (full height) */}
      <div className="w-3/8 h-full">
        <StagesSection 
          importedCompetition={importedCompetition} 
          matchSchedule={matchSchedule}
          transformedGroups={transformedStandings}
          selectedStage={selectedStage}
          setSelectedStage={setSelectedStage}
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

export default GroupKOSimulator;
