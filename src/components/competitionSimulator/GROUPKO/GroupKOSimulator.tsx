import React from 'react';
import StagesSection from './StagesSection';
import MatchesSection from './MatchesSection';
import PlayerStatsSection from './PlayerStatsSection';
import type { CompetitionSchedule, Match } from '../../../utils/SchedulerUtils';
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

interface MatchInformation {
  stage: 'GROUP' | 'KO' | 'P3';
  group: string | null;
  match: Match;
}

export interface RearrangedSchedule {
  [matchday: number]: MatchInformation[];
}

interface GroupKOSimulatorProps {
  importedCompetition: ImportedCompetition;
  matchSchedule: CompetitionSchedule | null;
  competitionSquads: { [nation: string]: Squad };
  transformedSquads: TransformedGroups
}

const GroupKOSimulator: React.FC<GroupKOSimulatorProps> = ({ importedCompetition, matchSchedule, competitionSquads, transformedSquads }) => {

  console.log(matchSchedule);

  function convertToMatchdayList(input: CompetitionSchedule): RearrangedSchedule {
    const result: RearrangedSchedule = {};

    for (const [outerKey, innerObj] of Object.entries(input)) {
      for (const [numKeyStr, arr] of Object.entries(innerObj)) {
        const numKey = Number(numKeyStr);

        if (!result[numKey]) {
          result[numKey] = [];
        }

        for (const item of arr) {
          result[numKey].push({
            stage: "GROUP",
            group: outerKey,
            match: item,
          });
        }
      }
    }

    return result;
  }

  let orderedMatchdays: RearrangedSchedule = {};
  if (matchSchedule) {
    orderedMatchdays = convertToMatchdayList(matchSchedule);
  }
  
  return (
    <div className="flex h-full p-6 gap-4">
      {/* Left Panel - Stages (full height) */}
      <div className="w-3/8 h-full">
        <StagesSection 
          importedCompetition={importedCompetition} 
          matchSchedule={matchSchedule}
          transformedGroups={transformedSquads}
        />
      </div>
      
      {/* Right Panel - Matches and Player Stats (stacked) */}
      <div className="w-5/8 h-full flex flex-col gap-4">
        <div className="h-1/2">
          <MatchesSection importedCompetition={importedCompetition} matchSchedule={orderedMatchdays} />
        </div>
        <div className="h-1/2">
          <PlayerStatsSection importedCompetition={importedCompetition} />
        </div>
      </div>
    </div>
  );
};

export default GroupKOSimulator;
