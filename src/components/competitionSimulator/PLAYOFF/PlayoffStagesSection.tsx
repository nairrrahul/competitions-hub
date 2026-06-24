import React from 'react';
import type { RearrangedSchedule, MatchInformation } from '../SimulatorTab';
import MatchRow from '../MatchRow';

interface Props {
  matchSchedule: RearrangedSchedule;
  selectedStage: string;
  setSelectedStage: React.Dispatch<React.SetStateAction<string>>;
}

const PlayoffStagesSection: React.FC<Props> = ({ matchSchedule, selectedStage, setSelectedStage }) => {
  const getRoundName = (matchday: number): string => `Round ${matchday}`;

  const availableStages = Object.keys(matchSchedule).map(Number).sort((a, b) => a - b);
  const getPathsForRound = (matchday: number) => {
    const matchdaySchedules = matchSchedule[matchday] || [];
    const paths = Array.from(new Set(matchdaySchedules.map((mi: MatchInformation) => mi.group).filter(Boolean))) as string[];
    return paths.sort();
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 h-full relative flex flex-col">
      <div className="flex justify-between items-start mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-green-400">STAGES</h2>
        <div className="flex gap-2">
          <select value={selectedStage} onChange={e => setSelectedStage(e.target.value)} className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 text-sm">
            <option value="">Select Stage</option>
            {availableStages.map((matchday) => (
              <option key={matchday} value={matchday.toString()}>{getRoundName(matchday)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!selectedStage ? (
          <div className="text-gray-400"><p>Select a stage to view details</p></div>
        ) : (
          <div>
            <p className="font-semibold mb-4 text-gray-300">{getRoundName(parseInt(selectedStage))}</p>
            <div className="space-y-6">
              {getPathsForRound(parseInt(selectedStage)).map((pathName) => {
                const matchdaySchedules = matchSchedule[parseInt(selectedStage)] || [];
                const pathMatches = matchdaySchedules.filter((mi: MatchInformation) => mi.group === pathName).map((mi: MatchInformation) => mi.match);

                return (
                  <div key={pathName}>
                    <h3 className="font-semibold text-gray-200 mb-2">{pathName}</h3>
                    <div className="space-y-2">
                      {pathMatches.map((match: any, idx: number) => (
                        <MatchRow key={`${pathName}-${idx}`} index={idx} match={match} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayoffStagesSection;
