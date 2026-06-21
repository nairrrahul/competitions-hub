import React from 'react';
import StagesSection from './StagesSection.tsx';
import MatchesSection from './MatchesSection.tsx';
import PlayerStatsSection from './PlayerStatsSection.tsx';
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

interface HomeAwaySimulatorProps {
  importedCompetition: ImportedCompetition;
  matchSchedule: RearrangedSchedule;
  competitionSquads: { [nation: string]: Squad };
  viewMatchday: number;
  setViewMatchday: React.Dispatch<React.SetStateAction<number>>;
}

const HomeAwaySimulator: React.FC<HomeAwaySimulatorProps> = ({ importedCompetition, matchSchedule, competitionSquads, viewMatchday, setViewMatchday }) => {
  const [selectedStage, setSelectedStage] = React.useState<string>('');

  console.log("hola", competitionSquads);

  return (
    <div className="flex h-full p-6 gap-4">
      {/* Left Panel - Stages (full height) */}
      <div className="w-3/8 h-full">
        <StagesSection
          importedCompetition={importedCompetition}
          matchSchedule={matchSchedule}
          selectedStage={selectedStage}
          setSelectedStage={setSelectedStage}
        />
      </div>

      {/* Right Panel - Matches and Player Stats (stacked) */}
      <div className="w-5/8 h-full flex flex-col gap-4">
        <div className="h-1/2">
          <MatchesSection importedCompetition={importedCompetition} matchSchedule={matchSchedule} currentMatchday={viewMatchday} setCurrentMatchday={setViewMatchday} />
        </div>
        <div className="h-1/2">
          <PlayerStatsSection importedCompetition={importedCompetition} matchSchedule={matchSchedule} />
        </div>
      </div>
    </div>
  );
};

export default HomeAwaySimulator;
