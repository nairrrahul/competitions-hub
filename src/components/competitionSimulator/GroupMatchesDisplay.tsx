import React from 'react';
import { useGlobalStore } from '../../state/GlobalState';
import type { Match } from '../../utils/SchedulerUtils';

interface GroupMatchesDisplayProps {
  groupSchedule: { [matchday: number]: Match[] };
  isExpanded: boolean;
}

const GroupMatchesDisplay: React.FC<GroupMatchesDisplayProps> = ({ groupSchedule, isExpanded }) => {
  const getNationFlagCode = useGlobalStore(state => state.getNationFlagCode);

  if (!isExpanded || Object.keys(groupSchedule).length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-700 bg-gray-750">
      <div className="p-3">
        <h4 className="text-sm font-semibold text-gray-300 mb-3 text-center">Group Matches</h4>
        {Object.keys(groupSchedule).sort((a, b) => parseInt(a) - parseInt(b)).map(matchday => (
          <div key={matchday} className="mb-4">
            <h5 className="text-xs font-medium text-gray-400 mb-2 text-center">Matchday {matchday}</h5>
            <div className="space-y-1">
              {groupSchedule[parseInt(matchday)].map((match: Match, matchIndex: number) => (
                <div key={matchIndex} className="flex items-center justify-between bg-gray-800 rounded p-2 text-sm relative">
                  <div className="flex items-center space-x-2">
                    {/* Home Team Flag */}
                    <div className="relative w-6 h-4 overflow-hidden rounded flex items-center justify-center bg-gray-600">
                      {(() => {
                        const flagCode = getNationFlagCode(match.homeTeam);
                        return flagCode && (
                          <span
                            className={`fi fi-${flagCode} absolute inset-0`}
                            style={{
                              fontSize: '1.2rem',
                              lineHeight: '1',
                            }}
                          ></span>
                        );
                      })()}
                    </div>
                    <span className="text-gray-300">{match.homeTeam}</span>
                  </div>
                  
                  {/* Absolute Centered vs */}
                  <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-500 font-medium">vs</span>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-300">{match.awayTeam}</span>
                    {/* Away Team Flag */}
                    <div className="relative w-6 h-4 overflow-hidden rounded flex items-center justify-center bg-gray-600">
                      {(() => {
                        const flagCode = getNationFlagCode(match.awayTeam);
                        return flagCode && (
                          <span
                            className={`fi fi-${flagCode} absolute inset-0`}
                            style={{
                              fontSize: '1.2rem',
                              lineHeight: '1',
                              transform: 'scale(1.2)',
                            }}
                          ></span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupMatchesDisplay;
