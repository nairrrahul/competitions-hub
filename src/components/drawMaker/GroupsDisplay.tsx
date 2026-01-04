import React from 'react';
import { type TeamSlot, type DisplayGroup } from '../../types/DrawMakerTypes';


interface GroupsDisplayProps {
  displayGroups: DisplayGroup[];
  isPlayoffTeam: (team: TeamSlot) => boolean;
}

const GroupsDisplay: React.FC<GroupsDisplayProps> = ({
  displayGroups,
  isPlayoffTeam
}) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 flex-grow min-w-0">
      <div className="bg-gray-750 px-4 py-3 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-green-400">Groups</h2>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {displayGroups.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {displayGroups.map((group) => (
                <div key={group.name} className="border border-gray-600 rounded-lg overflow-hidden flex-shrink-0 w-80">
                  {/* Group Header */}
                  <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
                    <h3 className="font-semibold text-green-400">Group {group.name}</h3>
                  </div>
                  
                  {/* Group Teams */}
                  <div className="p-3 space-y-2">
                    {Array.from({ length: group.maxTeams }).map((_, index) => {
                      const hasTeam = index < group.teams.length && group.teams[index] !== null;
                      const team = hasTeam ? group.teams[index] : null;
                      return (
                        <div 
                          key={index} 
                          className={`flex items-center space-x-3 p-2 rounded ${
                            hasTeam ? 'bg-gray-700' : 'bg-gray-800'
                          }`}
                        >
                          {hasTeam && team ? (
                            <>
                              {/* Flag Box */}
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
                              {team.isHost && (
                                <span className="ml-auto text-xs bg-yellow-600 text-white px-2 py-1 rounded">HOST</span>
                              )}
                              {isPlayoffTeam(team) && (
                                <span className="text-xs bg-red-700 text-white px-2 py-1 rounded">PLAYOFF</span>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center justify-center w-full h-5 text-gray-500 text-sm">
                              
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
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

export default GroupsDisplay;
