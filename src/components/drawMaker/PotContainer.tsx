import React from 'react';
import { type TeamSlot } from '../../types/DrawMakerTypes';
import CountryDrawRow from './CountryDrawRow';

interface PotContainerProps {
  potKey: string;
  potTeams: TeamSlot[];
  isExpanded: boolean;
  onToggle: () => void;
  isPlayoffTeam: (team: TeamSlot) => boolean;
}

const PotContainer: React.FC<PotContainerProps> = ({
  potKey,
  potTeams,
  isExpanded,
  onToggle,
  isPlayoffTeam
}) => {
  return (
    <div className="border border-gray-600 rounded-lg overflow-hidden">
      {/* Pot Header - Clickable to toggle */}
      <div 
        className="bg-gray-700 px-4 py-3 cursor-pointer hover:bg-gray-650 transition-colors flex items-center justify-between"
        onClick={onToggle}
      >
        <h3 className="font-semibold text-green-400">{potKey}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{potTeams.length} teams</span>
          <span className="text-gray-400">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </div>
      
      {/* Pot Content - Collapsible */}
      {isExpanded && (
        <div className="p-3 space-y-2">
          {potTeams.map((team) => {
            // Determine status for CountryPotRow
            let status: 'none' | 'host' | 'playoff' = 'none';
            if (team.isHost) {
              status = 'host';
            } else if (isPlayoffTeam(team)) {
              status = 'playoff';
            }

            return (
              <CountryDrawRow
                key={team.id}
                countryName={team.name}
                status={status}
                showRankingPts={true} // Show ranking points in pots
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PotContainer;
