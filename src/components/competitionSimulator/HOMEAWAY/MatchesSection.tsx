import React from 'react';
import type { Match } from '../../../utils/SchedulerUtils';
import type { RearrangedSchedule } from '../SimulatorTab';
import MatchRow from '../MatchRow';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  isHA?: boolean;
  groups?: { [key: string]: string[] };
  pairs?: { home: string; away: string }[];
}

interface MatchesSectionProps {
  importedCompetition: ImportedCompetition;
  matchSchedule: RearrangedSchedule | null;
  currentMatchday: number;
  setCurrentMatchday: React.Dispatch<React.SetStateAction<number>>;
}

const MatchesSection: React.FC<MatchesSectionProps> = ({ importedCompetition, matchSchedule, currentMatchday, setCurrentMatchday }) => {

  const getAllMatchdays = () => {
    if (!matchSchedule) return [];
    
    return Object.keys(matchSchedule)
      .map(matchday => parseInt(matchday))
      .sort((a, b) => a - b);
  };

  const getCurrentMatchdayMatches = () => {
    if (!matchSchedule) return [];
    
    const allMatchdays = getAllMatchdays();
    const displayMatchday = currentMatchday > allMatchdays.length ? allMatchdays.length : currentMatchday;
    const matchdaySchedules = matchSchedule[displayMatchday];
    if (!matchdaySchedules) return [];
    
    return matchdaySchedules.map(item => item.match);
  };

  const goToMatchday = (matchday: number) => {
    const allMatchdays = getAllMatchdays();
    if (matchday >= 1 && matchday <= allMatchdays.length) {
      setCurrentMatchday(matchday);
    }
  };

  const renderMatchdayNavigation = () => {
    const allMatchdays = getAllMatchdays();
    const displayMatchday = currentMatchday > allMatchdays.length ? allMatchdays.length : currentMatchday;
    
    return (
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
          <span className="text-green-400 font-medium">
            {displayMatchday === 1 ? 'First Leg' : 'Second Leg'}
          </span>
        </div>
        
        <button
          onClick={() => goToMatchday(currentMatchday + 1)}
          disabled={currentMatchday >= allMatchdays.length}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            currentMatchday >= allMatchdays.length
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-500'
          }`}
        >
          &gt;
        </button>
      </div>
    );
  };

  const renderMatchesView = () => {
    if (!importedCompetition || !matchSchedule) {
      return (
        <div className="text-gray-400">
          <p>No match schedule available</p>
        </div>
      );
    }

    const currentMatches = getCurrentMatchdayMatches();
    
    return (
      <div className="w-full">
        {renderMatchdayNavigation()}
        
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="space-y-2">
            {currentMatches.map((match: Match, index: number) => (
              <MatchRow key={index} index={index} match={match} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 h-full overflow-y-auto">
      <h2 className="text-xl font-bold text-green-400 mb-4">MATCHES</h2>
      {renderMatchesView()}
    </div>
  );
};

export default MatchesSection;
