import React from 'react';
import type { RearrangedSchedule } from '../SimulatorTab';
import MatchFlag from '../MatchFlag';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  isHA?: boolean;
  groups?: { [key: string]: string[] };
  pairs?: { home: string; away: string }[];
}

interface StagesSectionProps {
  importedCompetition: ImportedCompetition;
  matchSchedule: RearrangedSchedule | null;
  selectedStage: string;
  setSelectedStage: React.Dispatch<React.SetStateAction<string>>;
}

const StagesSection: React.FC<StagesSectionProps> = ({ importedCompetition, matchSchedule }) => {
  const getPairAggregateData = () => {
    if (!importedCompetition?.pairs || !matchSchedule) return [];

    return importedCompetition.pairs.map((pair) => {
      const firstLegMatch = matchSchedule[1]?.find(m => 
        (m.match.homeTeam === pair.home && m.match.awayTeam === pair.away) ||
        (m.match.homeTeam === pair.away && m.match.awayTeam === pair.home)
      );
      
      const secondLegMatch = matchSchedule[2]?.find(m => 
        (m.match.homeTeam === pair.home && m.match.awayTeam === pair.away) ||
        (m.match.homeTeam === pair.away && m.match.awayTeam === pair.home)
      );

      // Calculate goals for pair's home team
      let firstLegHomeGoals = 0;
      let firstLegAwayGoals = 0;
      let secondLegHomeGoals = 0;
      let secondLegAwayGoals = 0;

      if (firstLegMatch?.match.result) {
        if (firstLegMatch.match.homeTeam === pair.home) {
          firstLegHomeGoals = firstLegMatch.match.result.team1Goals || 0;
          firstLegAwayGoals = firstLegMatch.match.result.team2Goals || 0;
        } else {
          firstLegHomeGoals = firstLegMatch.match.result.team2Goals || 0;
          firstLegAwayGoals = firstLegMatch.match.result.team1Goals || 0;
        }
      }

      if (secondLegMatch?.match.result) {
        if (secondLegMatch.match.homeTeam === pair.home) {
          secondLegHomeGoals = secondLegMatch.match.result.team1Goals || 0;
          secondLegAwayGoals = secondLegMatch.match.result.team2Goals || 0;
        } else {
          secondLegHomeGoals = secondLegMatch.match.result.team2Goals || 0;
          secondLegAwayGoals = secondLegMatch.match.result.team1Goals || 0;
        }
      }

      const aggregateHomeGoals = firstLegHomeGoals + secondLegHomeGoals;
      const aggregateAwayGoals = firstLegAwayGoals + secondLegAwayGoals;

      return {
        homeTeam: pair.home,
        awayTeam: pair.away,
        firstLegResult: firstLegMatch?.match.result ? `${firstLegHomeGoals} - ${firstLegAwayGoals}` : null,
        secondLegResult: secondLegMatch?.match.result ? `${secondLegHomeGoals} - ${secondLegAwayGoals}` : null,
        aggregateScoreline: (firstLegMatch?.match.result || secondLegMatch?.match.result) 
          ? `${aggregateHomeGoals} - ${aggregateAwayGoals}` 
          : 'vs'
      };
    });
  };

  const renderStageContent = () => {
    const pairData = getPairAggregateData();
    
    return (
      <div className="space-y-3">
        {pairData.map((data) => {
          return (
            <div key={`${data.homeTeam}-${data.awayTeam}`} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
              {/* Header with team names and aggregate scoreline */}
              <div className="flex justify-between items-center relative mb-2">
                <div className="flex items-center gap-2">
                  <MatchFlag countryName={data.homeTeam} w={7} h={5} s={1.5}/>
                  <span className="text-white font-medium">{data.homeTeam}</span>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2">
                  <span className="text-green-400 font-bold">{data.aggregateScoreline}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{data.awayTeam}</span>
                  <MatchFlag countryName={data.awayTeam} w={7} h={5} s={1.5} />
                </div>
              </div>
              
              {/* First leg result */}
              {data.firstLegResult && (
                <div className="flex justify-between items-center relative mb-2 h-5">
                  <span className="text-gray-400 text-sm"></span>
                  <div className="absolute left-1/2 transform -translate-x-1/2">
                    <span className="text-gray-300 text-sm">{data.firstLegResult}</span>
                  </div>
                  <span className="text-gray-400 text-sm"></span>
                </div>
              )}
              
              {/* Second leg result */}
              {data.secondLegResult && (
                <div className="flex justify-between items-center relative h-5">
                  <span className="text-gray-400 text-sm"></span>
                  <div className="absolute left-1/2 transform -translate-x-1/2">
                    <span className="text-gray-300 text-sm">{data.secondLegResult}</span>
                  </div>
                  <span className="text-gray-400 text-sm"></span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 h-full relative flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-green-400">AGGREGATE SCORELINE</h2>
      </div>

      {/* Stage Content */}
      <div className="flex-1 overflow-y-auto">
        {renderStageContent()}
      </div>
    </div>
  );
};

export default StagesSection;
