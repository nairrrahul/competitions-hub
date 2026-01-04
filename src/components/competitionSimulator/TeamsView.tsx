import React from 'react';
import type { CompetitionSchedule } from '../../utils/SchedulerUtils';
import GroupDisplayContainer from './GroupDisplayContainer';

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
      <GroupDisplayContainer
        key={groupName}
        groupName={groupName}
        teams={teams}
        groupSchedule={groupSchedule}
        isExpanded={isExpanded}
        onToggle={() => toggleGroupExpansion(groupName)}
      />
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
