import React from 'react';
import { type TeamSlot, type DisplayGroup } from '../../types/DrawMakerTypes';
import CountryDrawRow from './CountryDrawRow';

interface GroupContainerProps {
  group: DisplayGroup;
  isPlayoffTeam: (team: TeamSlot) => boolean;
}

const GroupContainer: React.FC<GroupContainerProps> = ({
  group,
  isPlayoffTeam
}) => {
  return (
    <div className="border border-gray-600 rounded-lg overflow-hidden flex-shrink-0 w-80">
      {/* Group Header */}
      <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
        <h3 className="font-semibold text-green-400">Group {group.name}</h3>
      </div>
      
      {/* Group Teams */}
      <div className="p-3 space-y-2">
        {Array.from({ length: group.maxTeams }).map((_, index) => {
          const hasTeam = index < group.teams.length && group.teams[index] !== null;
          const team = hasTeam ? group.teams[index] : null;
          
          if (hasTeam && team) {
            // Determine status for CountryDrawRow
            let status: 'none' | 'host' | 'playoff' = 'none';
            if (team.isHost) {
              status = 'host';
            } else if (isPlayoffTeam(team)) {
              status = 'playoff';
            }

            return (
              <CountryDrawRow
                key={index}
                countryName={team.name}
                status={status}
                showRankingPts={false} // Don't show ranking points in groups
              />
            );
          } else {
            // Empty slot placeholder
            return (
              <div 
                key={index} 
                className="flex items-center space-x-3 p-2 rounded bg-gray-800 w-full"
              >
                <div className="flex items-center justify-center w-full h-5 text-gray-500 text-sm">
                  {/* Empty slot */}
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};

export default GroupContainer;
