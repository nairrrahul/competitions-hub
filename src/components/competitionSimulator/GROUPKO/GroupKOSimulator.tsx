import React from 'react';
import StagesSection from './StagesSection';
import MatchesSection from './MatchesSection';
import PlayerStatsSection from './PlayerStatsSection';
import type { CompetitionSchedule } from '../../../utils/SchedulerUtils';
import type { Squad } from '../../../types/rosterManager';

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

interface TransformedGroups {
  [groupName: string]: GroupTeamStats[];
}

interface GroupKOSimulatorProps {
  importedCompetition: ImportedCompetition;
  matchSchedule: CompetitionSchedule | null;
  competitionSquads: { [nation: string]: Squad };
}

const GroupKOSimulator: React.FC<GroupKOSimulatorProps> = ({ importedCompetition, matchSchedule, competitionSquads }) => {
  console.log(competitionSquads);
  const transformGroupsData = (): TransformedGroups => {
    const transformed: TransformedGroups = {};
    
    Object.entries(importedCompetition.groups).forEach(([groupName, countries]) => {
      transformed[groupName] = countries.map(country => ({
        countryName: country,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0
      }));
    });
    
    return transformed;
  };

  const transformedGroups = transformGroupsData();

  return (
    <div className="flex h-full p-6 gap-4">
      {/* Left Panel - Stages (full height) */}
      <div className="w-3/8 h-full">
        <StagesSection 
          importedCompetition={importedCompetition} 
          matchSchedule={matchSchedule}
          transformedGroups={transformedGroups}
        />
      </div>
      
      {/* Right Panel - Matches and Player Stats (stacked) */}
      <div className="w-5/8 h-full flex flex-col gap-4">
        <div className="h-1/2">
          <MatchesSection importedCompetition={importedCompetition} matchSchedule={matchSchedule} />
        </div>
        <div className="h-1/2">
          <PlayerStatsSection importedCompetition={importedCompetition} />
        </div>
      </div>
    </div>
  );
};

export default GroupKOSimulator;
