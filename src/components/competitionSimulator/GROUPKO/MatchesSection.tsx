import React, { useState } from 'react';
import type { Match } from '../../../utils/SchedulerUtils';
import type { RearrangedSchedule } from '../SimulatorTab';
import MatchRow from '../MatchRow';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  groups: { [key: string]: string[] };
}

interface MatchesSectionProps {
  importedCompetition: ImportedCompetition;
  matchSchedule: RearrangedSchedule | null;
}

const MatchesSection: React.FC<MatchesSectionProps> = ({ importedCompetition, matchSchedule }) => {
  //const getRoundInfo = useGlobalStore(state => state.getRoundInfo);
  const [currentMatchday, setCurrentMatchday] = useState(1);

  const getAllMatchdays = () => {
    if (!matchSchedule) return [];
    
    return Object.keys(matchSchedule)
      .map(matchday => parseInt(matchday))
      .sort((a, b) => a - b);
  };



  const getCurrentMatchdayMatches = () => {
    if (!matchSchedule) return [];
    
    const matchdaySchedules = matchSchedule[currentMatchday];
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
          <span className="text-green-400 font-medium">Matchday {currentMatchday}</span>
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
    
    // Determine stage based on the first match of the current matchday
    const isGroupStage = currentMatches.length > 0 && matchSchedule[currentMatchday]?.[0]?.stage === 'GROUP';

    if (isGroupStage) {
      // Group stage: separate matches by group
      const matchesByGroup: { [groupName: string]: Match[] } = {};
      
      matchSchedule[currentMatchday]?.forEach(item => {
        if (item.stage === 'GROUP') {
          if (!matchesByGroup[item.group!]) {
            matchesByGroup[item.group!] = [];
          }
          matchesByGroup[item.group!].push(item.match);
        }
      });

      return (
        <div className="w-full">
          {renderMatchdayNavigation()}
          
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="space-y-4">
              {Object.entries(matchesByGroup).sort(([a], [b]) => a.localeCompare(b)).map(([groupName, matches]) => (
                <div key={groupName}>
                  <h3 className="text-center text-green-400 font-semibold mb-2">Group {groupName}</h3>
                  <div className="space-y-2">
                    {matches.map((match: Match, index: number) => (
                      <MatchRow index={`group${groupName}-match${index}`} match={match} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    } else {
      // Knockout stage: show all matches together
      return (
        <div className="w-full">
          {renderMatchdayNavigation()}
          
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="space-y-2">
              {currentMatches.map((match: Match, index: number) => (
                <MatchRow index={index} match={match} />
              ))}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 h-full overflow-y-auto">
      <h2 className="text-xl font-bold text-green-400 mb-4">MATCHES</h2>
      {renderMatchesView()}
    </div>
  );
};

export default MatchesSection;
