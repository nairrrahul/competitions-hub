import React from 'react';
import { useGlobalStore } from '../../../state/GlobalState';
import type { MatchInformation, RearrangedSchedule } from '../SimulatorTab';
import type { Player } from '../../../types/rosterManager';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  groups: { [key: string]: string[] };
}

interface PlayerStatsSectionProps {
  importedCompetition: ImportedCompetition;
  matchSchedule: RearrangedSchedule;
}

const PlayerStatsSection: React.FC<PlayerStatsSectionProps> = ({ matchSchedule}) => {
  const getNationFlagCode = useGlobalStore(state => state.getNationFlagCode);
  const getPlayerName = (player: Player) => player.commonName || `${player.firstName} ${player.lastName}`;
  const MAX_ROWS_SHOW = 5;

  const FlagIcon = ({ countryName }: { countryName: string }) => {
    const flagCode = getNationFlagCode(countryName);
    return (
      <div className="relative w-7 h-5 overflow-hidden rounded flex items-center justify-center bg-gray-600">
        {flagCode && (
          <span
            className={`fi fi-${flagCode} absolute inset-0`}
            style={{
              fontSize: '0.8rem',
              lineHeight: '1',
              transform: 'scale(1.8)',
            }}
          ></span>
        )}
      </div>
    );
  };

  const aggregateStats = () => {
    const goals = new Map<number, { player: Player; count: number }>();
    const assists = new Map<number, { player: Player; count: number }>();
    const cleanSheets = new Map<number, { player: Player; count: number }>();

    Object.values(matchSchedule).forEach((matchday: MatchInformation[]) => {
      matchday.forEach((matchInfo: MatchInformation) => {
        const result = matchInfo.match.result;
        if (!result) return;

        const pushToMap = (map: Map<number, { player: Player; count: number }>, player: Player) => {
          if (!player?.playerid) return;
          const existing = map.get(player.playerid);
          if (existing) {
            existing.count += 1;
          } else {
            map.set(player.playerid, { player, count: 1 });
          }
        };

        result.team1GoalInfo?.forEach((goal: { goalScorer: Player; assist: Player | null; minute: number }) => {
          if (goal.goalScorer) pushToMap(goals, goal.goalScorer);
          if (goal.assist) pushToMap(assists, goal.assist);
        });

        result.team2GoalInfo?.forEach((goal: { goalScorer: Player; assist: Player | null; minute: number }) => {
          if (goal.goalScorer) pushToMap(goals, goal.goalScorer);
          if (goal.assist) pushToMap(assists, goal.assist);
        });

        result.cleanSheetNames?.forEach((player: Player) => {
          if (player) pushToMap(cleanSheets, player);
        });
      });
    });

    const sortEntries = (map: Map<number, { player: Player; count: number }>) => {
      return Array.from(map.values())
        .sort((a, b) => {
          const countDiff = b.count - a.count;
          if (countDiff !== 0) return countDiff;
          return getPlayerName(a.player).localeCompare(getPlayerName(b.player));
        })
        .slice(0, MAX_ROWS_SHOW);
    };

    return {
      topGoals: sortEntries(goals),
      topAssists: sortEntries(assists),
      topCleanSheets: sortEntries(cleanSheets),
    };
  };

  const { topGoals, topAssists, topCleanSheets } = aggregateStats();

  const renderStatRows = (entries: { player: Player; count: number }[]) => {
    if (entries.length === 0) {
      return <div className="text-gray-400">No data yet</div>;
    }

    return entries.map((entry, index) => (
      <div key={entry.player.playerid} className="flex items-center justify-between p-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-medium">#{index + 1}</span>
          <FlagIcon countryName={entry.player.nationality} />
          <span className="text-white">{getPlayerName(entry.player)}</span>
        </div>
        <span className="text-green-400 font-bold">{entry.count}</span>
      </div>
    ));
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 h-full overflow-y-auto">
      <h2 className="text-xl font-bold text-green-400 mb-4">PLAYER STATS</h2>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-300 mb-3 border-b border-gray-600/50 pb-2">Most Goals</h3>
          <div className="space-y-2">{renderStatRows(topGoals)}</div>
        </div>

        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-300 mb-3 border-b border-gray-600/50 pb-2">Most Assists</h3>
          <div className="space-y-2">{renderStatRows(topAssists)}</div>
        </div>

        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-300 mb-3 border-b border-gray-600/50 pb-2">Most Clean Sheets</h3>
          <div className="space-y-2">{renderStatRows(topCleanSheets)}</div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatsSection;
