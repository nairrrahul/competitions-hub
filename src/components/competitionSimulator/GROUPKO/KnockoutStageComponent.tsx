import React from 'react';
import type { MatchInformation } from '../SimulatorTab';
import MatchRow from '../MatchRow';

interface KnockoutStageComponentProps {
  matchSchedule: MatchInformation[] | null;
}

const ROUND_NAMES_BY_MATCH_COUNT: { [count: number]: string } = {
  16: 'Round of 32',
  8: 'Round of 16',
  4: 'Quarterfinals',
  2: 'Semifinals',
  1: 'Final',
};

const getRoundName = (matches: MatchInformation[] | null): string => {
  if (!matches || matches.length === 0) return 'Knockout Stage';

  const firstStage = matches[0]?.stage || 'KO';
  const stageLabel = ROUND_NAMES_BY_MATCH_COUNT[matches.length];

  if (firstStage === 'P3') {
    return 'Third Place Playoff';
  }

  if (stageLabel) {
    return stageLabel;
  }

  return firstStage === 'KO' ? 'Knockout Stage' : `${firstStage} Stage`;
};

const KnockoutStageComponent: React.FC<KnockoutStageComponentProps> = ({ matchSchedule }) => {

  const renderNoData = () => (
    <div className="h-full flex items-center justify-center text-gray-400">
      <p>No information available</p>
    </div>
  );

  if (!matchSchedule || matchSchedule.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 h-full">
        {renderNoData()}
      </div>
    );
  }

  const roundName = getRoundName(matchSchedule);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 h-full overflow-y-auto">
      <h2 className="text-xl font-bold text-green-400 mb-4">{roundName}</h2>

      <div className="space-y-2">
        {matchSchedule.map((matchInfo, index) => (
          <MatchRow index={`${matchInfo.stage}-${index}`} match={matchInfo.match} />
        ))}
      </div>
    </div>
  );
};

export default KnockoutStageComponent;
