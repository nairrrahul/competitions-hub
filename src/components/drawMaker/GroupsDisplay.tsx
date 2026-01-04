import React from 'react';
import { type TeamSlot, type DisplayGroup } from '../../types/DrawMakerTypes';
import GroupContainer from './GroupContainer';


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
                <GroupContainer
                  key={group.name}
                  group={group}
                  isPlayoffTeam={isPlayoffTeam}
                />
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
