import React from 'react';
import nationInfo from '../../config/nation_info.json';
import { type TeamSlot } from '../../types/DrawMakerTypes';

interface PotsDisplayProps {
  pots: { [key: string]: TeamSlot[] };
  expandedPots: { [key: string]: boolean };
  togglePotExpansion: (potKey: string) => void;
  isPlayoffTeam: (team: TeamSlot) => boolean;
}

const PotsDisplay: React.FC<PotsDisplayProps> = ({
  pots,
  expandedPots,
  togglePotExpansion,
  isPlayoffTeam
}) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 flex-shrink-0 w-120">
      <div className="bg-gray-750 px-4 py-3 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-green-400">Pots</h2>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {Object.keys(pots).length > 0 ? (
            Object.entries(pots).map(([potKey, potTeams]) => (
              <div key={potKey} className="border border-gray-600 rounded-lg overflow-hidden">
                {/* Pot Header - Clickable to toggle */}
                <div 
                  className="bg-gray-700 px-4 py-3 cursor-pointer hover:bg-gray-650 transition-colors flex items-center justify-between"
                  onClick={() => togglePotExpansion(potKey)}
                >
                  <h3 className="font-semibold text-green-400">{potKey}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">{potTeams.length} teams</span>
                    <span className="text-gray-400">
                      {expandedPots[potKey] ? '▼' : '▶'}
                    </span>
                  </div>
                </div>
                
                {/* Pot Content - Collapsible */}
                {expandedPots[potKey] && (
                  <div className="p-3 space-y-2">
                    {potTeams.map((team) => (
                      <div key={team.id} className="flex items-center space-x-3 bg-gray-700 rounded p-2">
                        {/* Flag Box with rectangular mask */}
                        <div className="relative w-7 h-5 overflow-hidden rounded flex items-center justify-center bg-gray-600">
                          {team.flagCode && (
                            <span
                              className={`fi fi-${team.flagCode} absolute inset-0`}
                              style={{
                                fontSize: '1.5rem',
                                lineHeight: '1',
                              }}
                            ></span>
                          )}
                        </div>
                        <span className="text-white font-medium">{team.name}</span>
                        <div className="ml-auto flex items-center gap-2">
                          {team.isHost && (
                            <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">HOST</span>
                          )}
                          {isPlayoffTeam(team) && (
                            <span className="text-xs bg-red-700 text-white px-2 py-1 rounded">PLAYOFF</span>
                          )}
                          <span className="text-xs text-gray-400">
                            {nationInfo[team.name as keyof typeof nationInfo]?.rankingPts || 'N/A'} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center py-8">
              No teams selected
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PotsDisplay;
