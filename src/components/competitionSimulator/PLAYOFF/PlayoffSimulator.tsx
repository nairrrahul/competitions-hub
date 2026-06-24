import React from 'react';
import PlayoffStagesSection from './PlayoffStagesSection';
import PlayoffMatchesSection from './PlayoffMatchesSection';
import PlayerStatsSection from '../KNOCKOUT/PlayerStatsSection';
import type { RearrangedSchedule } from '../SimulatorTab';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  isHA?: boolean;
}

interface Props {
  importedCompetition: ImportedCompetition;
  matchSchedule: RearrangedSchedule;
  viewMatchday: number;
  setViewMatchday: React.Dispatch<React.SetStateAction<number>>;
}

const PlayoffSimulator: React.FC<Props> = ({ importedCompetition, matchSchedule, viewMatchday, setViewMatchday }) => {
  const [selectedStage, setSelectedStage] = React.useState<string>('');

  return (
    <div className="flex h-full p-6 gap-4">
      <div className="w-3/8 h-full">
        <PlayoffStagesSection matchSchedule={matchSchedule} selectedStage={selectedStage} setSelectedStage={setSelectedStage} />
      </div>

      <div className="w-5/8 h-full flex flex-col gap-4">
        <div className="h-1/2">
          <PlayoffMatchesSection importedCompetition={importedCompetition} matchSchedule={matchSchedule} currentMatchday={viewMatchday} setCurrentMatchday={setViewMatchday} />
        </div>
        <div className="h-1/2">
          <PlayerStatsSection importedCompetition={importedCompetition} matchSchedule={matchSchedule} />
        </div>
      </div>
    </div>
  );
};

export default PlayoffSimulator;
