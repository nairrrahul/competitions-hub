import React from 'react';
import PlayoffStagesSection from './PlayoffStagesSection';
import PlayoffMatchesSection from './PlayoffMatchesSection';
import PlayerStatsSection from '../KNOCKOUT/PlayerStatsSection';
import type { RearrangedSchedule } from '../SimulatorTab';
import type { Squad } from '../../../types/rosterManager';

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
  competitionSquads: { [nation: string]: Squad };
  viewMatchday: number;
  setViewMatchday: React.Dispatch<React.SetStateAction<number>>;
  onSimulatePath: (pathName: string) => void;
}

const PlayoffSimulator: React.FC<Props> = ({ importedCompetition, matchSchedule, competitionSquads, viewMatchday, setViewMatchday, onSimulatePath }) => {
  const [selectedStage, setSelectedStage] = React.useState<string>('');

  return (
    <div className="flex h-full p-6 gap-4">
      <div className="w-3/8 h-full">
        <PlayoffStagesSection matchSchedule={matchSchedule} selectedStage={selectedStage} setSelectedStage={setSelectedStage} />
      </div>

      <div className="w-5/8 h-full flex flex-col gap-4">
        <div className="h-1/2">
          <PlayoffMatchesSection importedCompetition={importedCompetition} matchSchedule={matchSchedule} currentMatchday={viewMatchday} setCurrentMatchday={setViewMatchday} onSimulatePath={onSimulatePath} />
        </div>
        <div className="h-1/2">
          <PlayerStatsSection importedCompetition={importedCompetition} matchSchedule={matchSchedule} />
        </div>
      </div>
    </div>
  );
};

export default PlayoffSimulator;
