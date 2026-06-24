import React from 'react';
import type { CompetitionSchedule, HomeAwaySchedule } from '../../utils/SchedulerUtils';
import GroupDisplayContainer from './GroupDisplayContainer';
import MatchFlag from './MatchFlag';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  isHA?: boolean;
  groups?: { [key: string]: string[] };
  pairs?: { home: string; away: string }[];
  bracket?: Record<number, Record<number, (string | number)[]>>;
  playoffs?: { [path: string]: Record<number, Record<number, (string | number)[]>> | Record<number, (string | number)[]> };
}

interface TeamsViewProps {
  importedCompetition: ImportedCompetition | null;
  matchSchedule: CompetitionSchedule | HomeAwaySchedule | null;
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
    // Type guard to check if this is a CompetitionSchedule (has string keys)
    const isCompetitionSchedule = matchSchedule && Object.keys(matchSchedule).some(key => isNaN(Number(key)));
    const groupSchedule = isCompetitionSchedule ? (matchSchedule as CompetitionSchedule)?.[groupName] || {} : {};
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

  const renderPairsGrid = () => {
    if (!importedCompetition || !importedCompetition.pairs) return null;

    return (
      <div className="flex flex-wrap gap-4 p-4 justify-center">
        {importedCompetition.pairs.map((pair, index) => (
          <div key={index} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden w-full min-w-md max-w-xl">
            {/* Matchups Header */}
            <div className="bg-gray-750 px-4 py-3 border-b border-gray-700">
              <h3 className="font-semibold text-green-400">Matchups</h3>
            </div>
            
            {/* Teams List */}
            <div className="p-4 space-y-2">
              {[
                { teamName: pair.home, isHome: true },
                { teamName: pair.away, isHome: false }
              ].map((team, teamIndex) => {
                return (
                  <div key={teamIndex} className="flex items-center space-x-3 bg-gray-700 rounded p-3">
                    <MatchFlag countryName={team.teamName} w={7} h={5} s={1.5} />
                    <span className="text-white font-medium">{team.teamName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderGroupsGrid = () => {
    if (!importedCompetition || !importedCompetition.groups) return null;

    const groupNames = Object.keys(importedCompetition.groups).sort();
    
    return (
      <div className="flex flex-wrap gap-4 p-4 justify-center">
        {groupNames.map(groupName => 
          <div key={groupName} className="flex flex-col min-w-md max-w-xl">
            {renderGroup(groupName, importedCompetition.groups![groupName])}
          </div>
        )}
      </div>
    );
  };

  const renderBracketTeamsGrid = () => {
    if (!importedCompetition || !importedCompetition.bracket) return null;

    // Extract all team names from the bracket
    const teams: string[] = [];
    Object.values(importedCompetition.bracket).forEach(roundMatches => {
      Object.values(roundMatches).forEach(matchTeams => {
        matchTeams.forEach(team => {
          if (typeof team === 'string') {
            teams.push(team);
          }
        });
      });
    });

    // Remove duplicates
    const uniqueTeams = Array.from(new Set(teams));

    return (
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {uniqueTeams.map((team, index) => (
            <div key={index} className="flex items-center space-x-3 bg-gray-800 rounded-lg border border-gray-700 p-3">
              <MatchFlag countryName={team} w={7} h={5} s={1.5} />
              <span className="text-white font-medium text-sm">{team}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPlayoffsGrid = () => {
    if (!importedCompetition || !importedCompetition.playoffs) return null;

    const pathKeys = Object.keys(importedCompetition.playoffs).sort((a, b) => Number(a) - Number(b));

    return (
      <div className="flex flex-wrap gap-4 p-4 justify-center">
        {pathKeys.map(pathKey => {
          const pathBracket = importedCompetition.playoffs![pathKey] as Record<number, Record<number, (string | number)[]>>;
          // Collect teams for this path
          const teams: string[] = [];
          Object.values(pathBracket).forEach(roundMatches => {
            Object.values(roundMatches as Record<number, (string | number)[]>).forEach(matchTeams => {
              matchTeams.forEach(team => {
                if (typeof team === 'string') teams.push(team);
              });
            });
          });

          const uniqueTeams = Array.from(new Set(teams));
          const groupName = `Path ${pathKey}`;

          return (
            <div key={pathKey} className="flex flex-col min-w-md max-w-xl">
              {renderGroup(groupName, uniqueTeams)}
            </div>
          );
        })}
      </div>
    );
  };

  if (importedCompetition?.compType === 'HOMEAWAY') {
    return renderPairsGrid();
  }

  if (importedCompetition?.compType === 'KO') {
    return renderBracketTeamsGrid();
  }

  if (importedCompetition?.compType === 'PLAYOFF') {
    return renderPlayoffsGrid();
  }

  return renderGroupsGrid();
};

export default TeamsView;
