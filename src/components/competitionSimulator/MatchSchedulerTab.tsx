import React from 'react';
import nationInfo from '../../config/nation_info.json';
import { GroupStageMatchScheduler, supportsGroupStage, shouldUseHomeAway, getMatchesByMatchday, getTotalMatchdays } from '../../utils/SchedulerUtils';
import type { Match, CompetitionSchedule } from '../../utils/SchedulerUtils';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  groups: { [key: string]: string[] };
}

interface MatchSchedulerTabProps {
  onValidationUpdate: (canAccess: boolean) => void;
  importedCompetition: ImportedCompetition | null;
  setImportedCompetition: React.Dispatch<React.SetStateAction<ImportedCompetition | null>>;
  importError: string | null;
  setImportError: React.Dispatch<React.SetStateAction<string | null>>;
  viewMode: 'teams' | 'matches';
  setViewMode: React.Dispatch<React.SetStateAction<'teams' | 'matches'>>;
  matchSchedule: CompetitionSchedule | null;
  setMatchSchedule: React.Dispatch<React.SetStateAction<CompetitionSchedule | null>>;
  expandedGroups: Set<string>;
  setExpandedGroups: React.Dispatch<React.SetStateAction<Set<string>>>;
  currentMatchday: number;
  setCurrentMatchday: React.Dispatch<React.SetStateAction<number>>;
  totalMatchdays: number;
  setTotalMatchdays: React.Dispatch<React.SetStateAction<number>>;
}

const MatchSchedulerTab: React.FC<MatchSchedulerTabProps> = ({
  onValidationUpdate,
  importedCompetition,
  setImportedCompetition,
  importError,
  setImportError,
  viewMode,
  setViewMode,
  matchSchedule,
  setMatchSchedule,
  expandedGroups,
  setExpandedGroups,
  currentMatchday,
  setCurrentMatchday,
  totalMatchdays,
  setTotalMatchdays
}) => {

  const handleImportInfo = () => {
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);

          // Validate required fields
          const requiredFields = ['compName', 'numTeams', 'numThrough', 'compType'];
          const missingFields = requiredFields.filter(field => !(field in data));
          
          if (missingFields.length > 0) {
            setImportError(`Import failed: Missing required fields: ${missingFields.join(', ')}`);
            setImportedCompetition(null);
            setMatchSchedule(null);
            onValidationUpdate(false);
            return;
          }

          // Validate competition type supports group stage
          if (!supportsGroupStage(data.compType)) {
            setImportError('Import failed: Competition type does not support group stage scheduling');
            setImportedCompetition(null);
            setMatchSchedule(null);
            onValidationUpdate(false);
            return;
          }

          // Validate groups
          if (!data.groups || typeof data.groups !== 'object') {
            setImportError('Import failed: Invalid or missing groups data');
            setImportedCompetition(null);
            setMatchSchedule(null);
            onValidationUpdate(false);
            return;
          }

          // Schedule matches
          const isHA = shouldUseHomeAway(data.compType);
          const schedule = GroupStageMatchScheduler(data.groups, isHA);
          
          // Calculate total matchdays
          const maxMatchday = getTotalMatchdays(schedule);

          // Success
          setImportedCompetition(data);
          setMatchSchedule(schedule);
          setTotalMatchdays(maxMatchday);
          setCurrentMatchday(1);
          setImportError(null);
          onValidationUpdate(true);
          
        } catch (error) {
          setImportError('Import failed: Invalid JSON file');
          setImportedCompetition(null);
          setMatchSchedule(null);
          onValidationUpdate(false);
        }
      };

      reader.readAsText(file);
    };

    fileInput.click();
  };

  const toggleGroupExpansion = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const getCurrentMatchdayMatches = () => {
    if (!matchSchedule) return [];
    return getMatchesByMatchday(matchSchedule, currentMatchday);
  };

  const goToMatchday = (matchday: number) => {
    if (matchday >= 1 && matchday <= totalMatchdays) {
      setCurrentMatchday(matchday);
    }
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
        {isExpanded && Object.keys(groupSchedule).length > 0 && (
          <div className="border-t border-gray-700 bg-gray-750">
            <div className="p-3">
              <h4 className="text-sm font-semibold text-gray-300 mb-3 text-center">Group Matches</h4>
              {Object.keys(groupSchedule).sort((a, b) => parseInt(a) - parseInt(b)).map(matchday => (
                <div key={matchday} className="mb-4">
                  <h5 className="text-xs font-medium text-gray-400 mb-2 text-center">Matchday {matchday}</h5>
                  <div className="space-y-1">
                    {groupSchedule[parseInt(matchday)].map((match: Match, matchIndex: number) => (
                      <div key={matchIndex} className="flex items-center justify-between bg-gray-800 rounded p-2 text-sm relative">
                        <div className="flex items-center space-x-2">
                          {/* Home Team Flag */}
                          <div className="relative w-6 h-4 overflow-hidden rounded flex items-center justify-center bg-gray-600">
                            {(() => {
                              const nationData = nationInfo[match.homeTeam as keyof typeof nationInfo];
                              const flagCode = nationData?.flagCode;
                              return flagCode && (
                                <span
                                  className={`fi fi-${flagCode} absolute inset-0`}
                                  style={{
                                    fontSize: '1.2rem',
                                    lineHeight: '1',
                                  }}
                                ></span>
                              );
                            })()}
                          </div>
                          <span className="text-gray-300">{match.homeTeam}</span>
                        </div>
                        
                        {/* Absolute Centered vs */}
                        <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-500 font-medium">vs</span>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-300">{match.awayTeam}</span>
                          {/* Away Team Flag */}
                          <div className="relative w-6 h-4 overflow-hidden rounded flex items-center justify-center bg-gray-600">
                            {(() => {
                              const nationData = nationInfo[match.awayTeam as keyof typeof nationInfo];
                              const flagCode = nationData?.flagCode;
                              return flagCode && (
                                <span
                                  className={`fi fi-${flagCode} absolute inset-0`}
                                  style={{
                                    fontSize: '1.2rem',
                                    lineHeight: '1',
                                  }}
                                ></span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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

  const renderMatchesView = () => {
    if (!importedCompetition || !matchSchedule) return null;

    const currentMatches = getCurrentMatchdayMatches();
    
    // Group matches by group name
    const matchesByGroup: { [groupName: string]: typeof currentMatches } = {};
    currentMatches.forEach(match => {
      if (!matchesByGroup[match.group]) {
        matchesByGroup[match.group] = [];
      }
      matchesByGroup[match.group].push(match);
    });

    return (
      <div className="w-full">
        {/* Matchday Navigation */}
        <div className="mb-6 flex justify-center items-center space-x-4">
          <button
            onClick={() => goToMatchday(currentMatchday - 1)}
            disabled={currentMatchday <= 1}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              currentMatchday <= 1
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-500'
            }`}
          >
            &lt;
          </button>
          
          <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
            <span className="text-green-400 font-medium">Matchday {currentMatchday}</span>
          </div>
          
          <button
            onClick={() => goToMatchday(currentMatchday + 1)}
            disabled={currentMatchday >= totalMatchdays}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              currentMatchday >= totalMatchdays
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-500'
            }`}
          >
            &gt;
          </button>
        </div>

        {/* Matches by Group */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.keys(matchesByGroup).sort().map(groupName => (
            <div key={groupName} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              {/* Group Header */}
              <div className="bg-gray-750 px-4 py-3 border-b border-gray-700">
                <h3 className="font-semibold text-green-400">Group {groupName}</h3>
              </div>
              
              {/* Matches List */}
              <div className="p-4 space-y-3">
                {matchesByGroup[groupName].map((match, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between relative">
                      {/* Home Team with Flag */}
                      <div className="flex items-center space-x-3">
                        <div className="relative w-6 h-4 overflow-hidden rounded flex items-center justify-center bg-gray-600">
                          {(() => {
                            const nationData = nationInfo[match.homeTeam as keyof typeof nationInfo];
                            const flagCode = nationData?.flagCode;
                            return flagCode && (
                              <span
                                className={`fi fi-${flagCode} absolute inset-0`}
                                style={{
                                  fontSize: '1.2rem',
                                  lineHeight: '1',
                                }}
                              ></span>
                            );
                          })()}
                        </div>
                        <span className="text-white font-medium">{match.homeTeam}</span>
                      </div>
                      
                      {/* Absolute Centered VS */}
                      <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-400 font-medium">vs</span>
                      
                      {/* Away Team with Flag */}
                      <div className="flex items-center space-x-3">
                        <span className="text-white font-medium">{match.awayTeam}</span>
                        <div className="relative w-6 h-4 overflow-hidden rounded flex items-center justify-center bg-gray-600">
                          {(() => {
                            const nationData = nationInfo[match.awayTeam as keyof typeof nationInfo];
                            const flagCode = nationData?.flagCode;
                            return flagCode && (
                              <span
                                className={`fi fi-${flagCode} absolute inset-0`}
                                style={{
                                  fontSize: '1.2rem',
                                  lineHeight: '1',
                                }}
                              ></span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full mt-6">
      {/* Header with Import Button */}
      <div className="mb-8 flex justify-between items-center px-8">
        <div>
          <h2 className="text-2xl font-bold text-green-400 mb-2">Match Scheduler</h2>
          <p className="text-gray-400">Schedule and manage competition matches</p>
        </div>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
          onClick={handleImportInfo}
        >
          Import & Schedule
        </button>
      </div>

      {/* Full Width Content Area */}
      <div className="px-8">
        {/* Error Message */}
        {importError && (
          <div className="mb-6 bg-red-900 border border-red-700 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-300 font-medium">{importError}</span>
            </div>
          </div>
        )}

        {/* Competition Info */}
        {importedCompetition && (
          <div className="mb-6 bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-green-400">{importedCompetition.compName}</h3>
              
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('teams')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'teams'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Teams View
                </button>
                <button
                  onClick={() => setViewMode('matches')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'matches'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Matches View
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Groups Display */}
        {importedCompetition ? (
          viewMode === 'teams' ? renderGroupsGrid() : renderMatchesView()
        ) : (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-200 mb-4">Match Scheduler</h3>
            <p className="text-gray-400">
              Import competition data to begin scheduling matches.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchSchedulerTab;
