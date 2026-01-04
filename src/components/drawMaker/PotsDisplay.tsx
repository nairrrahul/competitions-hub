import React from 'react';
import { type TeamSlot } from '../../types/DrawMakerTypes';
import PotContainer from './PotContainer';

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
              <PotContainer
                key={potKey}
                potKey={potKey}
                potTeams={potTeams}
                isExpanded={expandedPots[potKey]}
                onToggle={() => togglePotExpansion(potKey)}
                isPlayoffTeam={isPlayoffTeam}
              />
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
