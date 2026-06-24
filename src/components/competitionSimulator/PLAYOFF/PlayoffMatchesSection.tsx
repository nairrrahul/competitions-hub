import React from 'react';
import type { RearrangedSchedule } from '../../SimulatorTab';
import MatchRow from '../MatchRow';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  isHA?: boolean;
}

interface Props {
  importedCompetition: ImportedCompetition;
  matchSchedule: RearrangedSchedule;
  currentMatchday: number;
  setCurrentMatchday: React.Dispatch<React.SetStateAction<number>>;
}

const PlayoffMatchesSection: React.FC<Props> = ({ importedCompetition, matchSchedule, currentMatchday, setCurrentMatchday }) => {

  const getAllMatchdays = () => {
    if (!matchSchedule) return [] as number[];
    return Object.keys(matchSchedule).map(n => parseInt(n)).sort((a,b) => a-b);
  };

  const getCurrentMatchdayMatches = () => {
    if (!matchSchedule) return [] as any[];
    const allMatchdays = getAllMatchdays();
    const displayMatchday = currentMatchday > allMatchdays.length ? allMatchdays.length : currentMatchday;
    const matchdaySchedules = matchSchedule[displayMatchday] || [];
    if (!matchdaySchedules) return [] as any[];
    return matchdaySchedules;
  };

  const getRoundName = (matchday: number): string => `Round ${matchday}`;

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
          <span className="text-green-400 font-medium">{getRoundName(displayMatchday)}</span>
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

  const matchdaySchedules = getCurrentMatchdayMatches();

  // Collect paths for this round
  const pathKeys = Array.from(new Set(matchdaySchedules.map((mi: any) => mi.group).filter(Boolean))).sort() as string[];

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 h-full overflow-y-auto">
      <h2 className="text-xl font-bold text-green-400 mb-4">MATCHES</h2>
      {renderMatchdayNavigation()}

      <div className="space-y-6">
        {pathKeys.map(pathName => {
          const pathMatches = matchdaySchedules.filter((mi: any) => mi.group === pathName).map((mi: any) => mi.match);

          return (
            <div key={pathName} className="bg-gray-900 rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">{pathName}</h3>
                <div className="text-sm text-gray-400">{pathMatches.length} matches</div>
              </div>
              <div className="space-y-2">
                {pathMatches.map((m: any, idx: number) => (
                  <MatchRow key={`${pathName}-${idx}`} index={idx} match={m} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayoffMatchesSection;
