import React from 'react';
import nationInfo from '../../config/nation_info.json';
import type { CompetitionSchedule } from '../../utils/SchedulerUtils';
import GroupMatchesDisplay from './GroupMatchesDisplay';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  groups: { [key: string]: string[] };
}

interface TeamsViewProps {
  importedCompetition: ImportedCompetition | null;
  matchSchedule: CompetitionSchedule | null;
  expandedGroups: Set<string>;
  setExpandedGroups: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const TeamsView: React.FC<TeamsViewProps> = ({
  importedCompetition,
  matchSchedule,
  expandedGroups,
  setExpandedGroups
}) => {
  const toggleGroupExpansion = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const renderGroup = (groupName: string, teams: string[]) => {
    const groupSchedule = matchSchedule?.[groupName] || {};
    const isExpanded = expandedGroups.has(groupName);
    
    return (
      <div key={groupName} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden w-full min-w-md max-w-xl">
        {/* Group Header */}
        <div 
          className="bg-gray-750 px-4 py-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors"
          onClick={() => toggleGroupExpansion(groupName)}
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
            const nationData = nationInfo[teamName as keyof typeof nationInfo];
            const flagCode = nationData?.flagCode;
            
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

  const renderGroupsGrid = () => {
    if (!importedCompetition) return null;

    const groupNames = Object.keys(importedCompetition.groups).sort();
    
    return (
      <div className="flex flex-wrap gap-4 p-4 justify-center">
        {groupNames.map(groupName => 
          <div key={groupName} className="flex flex-col min-w-md max-w-xl">
            {renderGroup(groupName, importedCompetition.groups[groupName])}
          </div>
        )}
      </div>
    );
  };

  return renderGroupsGrid();
};

export default TeamsView;
