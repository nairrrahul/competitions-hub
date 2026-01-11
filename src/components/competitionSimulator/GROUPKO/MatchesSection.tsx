import React, { useState } from 'react';
import type { CompetitionSchedule, Match } from '../../../utils/SchedulerUtils';
import { useGlobalStore } from '../../../state/GlobalState';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  groups: { [key: string]: string[] };
}

interface MatchesSectionProps {
  importedCompetition: ImportedCompetition;
  matchSchedule: CompetitionSchedule | null;
}

const MatchesSection: React.FC<MatchesSectionProps> = ({ importedCompetition, matchSchedule }) => {
  const getRoundInfo = useGlobalStore(state => state.getRoundInfo);
  const [currentMatchday, setCurrentMatchday] = useState(1);

  const getAllMatchdays = () => {
    if (!matchSchedule) return [];
    
    const allMatchdays = new Set<number>();
    Object.values(matchSchedule).forEach(groupSchedule => {
      Object.keys(groupSchedule).forEach(matchday => {
        allMatchdays.add(parseInt(matchday));
      });
    });
    
    return Array.from(allMatchdays).sort((a, b) => a - b);
  };

  const getCurrentMatchdayMatches = () => {
    if (!matchSchedule) return [];
    
    const matches: Match[] = [];
    Object.values(matchSchedule).forEach(groupSchedule => {
      const matchdayMatches = groupSchedule[currentMatchday];
      if (matchdayMatches) {
        matches.push(...matchdayMatches);
      }
    });
    
    return matches;
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

    const roundInfo = getRoundInfo(importedCompetition.compName);
    const isGroupStage = roundInfo?.rounds?.some((round: any) => round.type === 'GROUP') && 
                        Object.keys(matchSchedule).some(groupName => importedCompetition.groups[groupName]);

    const currentMatches = getCurrentMatchdayMatches();
    
    if (isGroupStage) {
      // Group stage: separate matches by group
      const matchesByGroup: { [groupName: string]: Match[] } = {};
      
      Object.entries(matchSchedule).forEach(([groupName, groupSchedule]) => {
        const matchdayMatches = groupSchedule[currentMatchday];
        if (matchdayMatches) {
          matchesByGroup[groupName] = matchdayMatches;
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
                      <div key={index} className="flex items-center justify-between bg-gray-700 rounded p-3 relative">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <MatchFlag countryName={match.homeTeam} />
                            <span className="text-white font-medium">{match.homeTeam}</span>
                          </div>
                        </div>
                        <div className="absolute left-1/2 transform -translate-x-1/2">
                          <span className="text-gray-400 text-sm">vs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{match.awayTeam}</span>
                          <MatchFlag countryName={match.awayTeam} />
                        </div>
                      </div>
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
                <div key={index} className="flex items-center justify-between bg-gray-700 rounded p-3 relative">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <MatchFlag countryName={match.homeTeam} />
                      <span className="text-white font-medium">{match.homeTeam}</span>
                    </div>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2">
                    <span className="text-gray-400 text-sm">vs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{match.awayTeam}</span>
                    <MatchFlag countryName={match.awayTeam} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
  };

// Helper component for country flags
const MatchFlag: React.FC<{ countryName: string }> = ({ countryName }) => {
  const getNationFlagCode = useGlobalStore(state => state.getNationFlagCode);
  const flagCode = getNationFlagCode(countryName);
  
  return (
    <div className="relative w-7 h-5 overflow-hidden rounded flex items-center justify-center bg-gray-600">
      {flagCode && (
        <span
          className={`fi fi-${flagCode} absolute inset-0`}
          style={{
            fontSize: '1rem',
            lineHeight: '1',
            transform: 'scale(1.5)',
          }}
        ></span>
      )}
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
