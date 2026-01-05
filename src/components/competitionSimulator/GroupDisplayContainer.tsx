import React from 'react';
import GroupMatchesDisplay from './GroupMatchesDisplay';
import { useGlobalStore } from '../../state/GlobalState';

interface GroupDisplayContainerProps {
  groupName: string;
  teams: string[];
  groupSchedule: { [matchId: string]: any };
  isExpanded: boolean;
  onToggle: () => void;
}

const GroupDisplayContainer: React.FC<GroupDisplayContainerProps> = ({
  groupName,
  teams,
  groupSchedule,
  isExpanded,
  onToggle
}) => {
  const getNationFlagCode = useGlobalStore(state => state.getNationFlagCode);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden w-full min-w-md max-w-xl">
      {/* Group Header */}
      <div 
        className="bg-gray-750 px-4 py-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-green-400">Group {groupName}</h3>
          <span className="text-gray-400">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </div>
      
      {/* Teams List */}
      <div className="p-4 space-y-2">
        {teams.map((teamName, index) => {
          const flagCode = getNationFlagCode(teamName);
          
          return (
            <div key={index} className="flex items-center space-x-3 bg-gray-700 rounded p-3">
              {/* Flag Box with rectangular mask */}
              <div className="relative w-7 h-5 overflow-hidden rounded flex items-center justify-center bg-gray-600">
                {flagCode && (
                  <span
                    className={`fi fi-${flagCode} absolute inset-0`}
                    style={{
                      fontSize: '1.5rem',
                      lineHeight: '1',
                    }}
                  ></span>
                )}
              </div>
              <span className="text-white font-medium">{teamName}</span>
            </div>
          );
        })}
      </div>

      {/* Collapsible Matches Container */}
      <GroupMatchesDisplay 
        groupSchedule={groupSchedule}
        isExpanded={isExpanded}
      />
    </div>
  );
};

export default GroupDisplayContainer;
