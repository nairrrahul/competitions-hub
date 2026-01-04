import React from 'react';
import { getMatchesByMatchday } from '../../utils/SchedulerUtils';
import type { CompetitionSchedule } from '../../utils/SchedulerUtils';
import MatchDisplay from './MatchDisplay';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  groups: { [key: string]: string[] };
}

interface MatchesViewProps {
  importedCompetition: ImportedCompetition | null;
  matchSchedule: CompetitionSchedule | null;
  currentMatchday: number;
  setCurrentMatchday: React.Dispatch<React.SetStateAction<number>>;
  totalMatchdays: number;
}

const MatchesView: React.FC<MatchesViewProps> = ({
  importedCompetition,
  matchSchedule,
  currentMatchday,
  setCurrentMatchday,
  totalMatchdays
}) => {
  const getCurrentMatchdayMatches = () => {
    if (!matchSchedule) return [];
    return getMatchesByMatchday(matchSchedule, currentMatchday);
  };

  const goToMatchday = (matchday: number) => {
    if (matchday >= 1 && matchday <= totalMatchdays) {
      setCurrentMatchday(matchday);
    }
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
                    <MatchDisplay match={match} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return renderMatchesView();
};

export default MatchesView;
