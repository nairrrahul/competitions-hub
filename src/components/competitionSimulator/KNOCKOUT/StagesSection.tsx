import React from 'react';
import type { RearrangedSchedule } from '../SimulatorTab';
import MatchRow from '../MatchRow';

interface StagesSectionProps {
  matchSchedule: RearrangedSchedule;
  selectedStage: string;
  setSelectedStage: React.Dispatch<React.SetStateAction<string>>;
}

const StagesSection: React.FC<StagesSectionProps> = ({ matchSchedule, selectedStage, setSelectedStage }) => {
  
  const getRoundName = (matchday: number): string => {
    return `Round ${matchday}`;
  };

  const availableStages = Object.keys(matchSchedule).map(Number).sort((a, b) => a - b);

  const getStageMatches = () => {
    if (!selectedStage) return [];
    const matchday = parseInt(selectedStage);
    const matchdaySchedules = matchSchedule[matchday];
    if (!matchdaySchedules) return [];
    
    return matchdaySchedules.map(item => item.match);
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 h-full relative flex flex-col">
      {/* Header with dropdown */}
      <div className="flex justify-between items-start mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-green-400">STAGES</h2>
        
        {/* Stage Dropdown */}
        <div className="relative">
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
          >
            <option value="">Select Stage</option>
            {availableStages.map((matchday) => (
              <option key={matchday} value={matchday.toString()}>
                {getRoundName(matchday)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stage Content */}
      <div className="flex-1 overflow-y-auto">
        {!selectedStage ? (
          <div className="text-gray-400">
            <p>Select a stage to view details</p>
          </div>
        ) : (
          <div>
            <p className="font-semibold mb-4 text-gray-300">{getRoundName(parseInt(selectedStage))}</p>
            <div className="space-y-2">
              {getStageMatches().map((match, index) => (
                <MatchRow key={index} index={index} match={match} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StagesSection;
