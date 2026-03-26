import React from 'react';
import type { MatchResult } from '../../utils/MatchEngine';
import MatchFlag from './MatchFlag';

interface MatchResultCardProps {
  team1: string;
  team2: string;
  matchResult: MatchResult;
  onClose: () => void;
}

const MatchResultCard: React.FC<MatchResultCardProps> = ({ team1, team2, matchResult, onClose }) => {
  const team1Penalties = matchResult.penalties?.team1Results || [];
  const team2Penalties = matchResult.penalties?.team2Results || [];
  const team1PenaltyScore = team1Penalties.filter(v => v === 'O').length;
  const team2PenaltyScore = team2Penalties.filter(v => v === 'O').length;

  const team1GoalScorers = matchResult.team1GoalInfo;
  const team2GoalScorers = matchResult.team2GoalInfo;
  team1GoalScorers.sort((a, b) => a.minute - b.minute);
  team2GoalScorers.sort((a, b) => a.minute - b.minute);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-3xl rounded-2xl border border-gray-700 bg-gray-900 p-6 pt-14 text-white shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 h-7 w-7 rounded-full border border-gray-500 bg-gray-800 text-white hover:bg-gray-700 z-30"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="relative mb-6">
          <div className="relative z-20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MatchFlag countryName={team1} w={12} h={8} s={2.3}/>
              <span className="text-lg font-semibold text-white">{team1}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-white">{team2}</span>
              <MatchFlag countryName={team2} w={12} h={8} s={2.3}/>
            </div>
          </div>

          <div className="absolute left-1/2 top-1/2 w-auto -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-green-300 pointer-events-none z-10">
            {matchResult.team1Goals} - {matchResult.team2Goals}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div>
            {matchResult.team1GoalInfo?.length ? (
              team1GoalScorers.map((goal, idx) => (
                <div key={`${team1}-goal-${idx}`} className="flex justify-end gap-2 text-gray-100 text-sm">
                  <span className="font-medium truncate">{goal.goalScorer.commonName || `${goal.goalScorer.firstName} ${goal.goalScorer.lastName}`}</span>
                  <span className="text-gray-400">{goal.minute}'</span>
                </div>
              ))
            ) : (
              <div className="flex justify-end gap-2 text-gray-100 text-gray-500 text-sm" >No goal scorers</div>
            )}
          </div>

          <div>
            {matchResult.team2GoalInfo?.length ? (
              team2GoalScorers.map((goal, idx) => (
                <div key={`${team2}-goal-${idx}`} className="flex justify-start gap-2 text-gray-100 text-sm">
                  <span className="text-gray-400">{goal.minute}'</span>
                  <span className="font-medium truncate">{goal.goalScorer.commonName || `${goal.goalScorer.firstName} ${goal.goalScorer.lastName}`}</span>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm">No goal scorers</div>
            )}
          </div>
        </div>

        {matchResult.penalties && (
          <div className="mt-4 rounded-lg border border-gray-600 bg-gray-800 p-4">
            <h4 className="text-center text-sm font-bold text-green-300">Penalties</h4>
            <div className="mt-3 flex items-center justify-center gap-4 text-base font-semibold text-white">
              <div className="tracking-widest text-green-200">{team1Penalties.join(' ')}</div>
              <div className="px-3 py-1 rounded-lg bg-gray-900 border border-gray-600">{team1PenaltyScore} - {team2PenaltyScore}</div>
              <div className="tracking-widest text-green-200">{team2Penalties.join(' ')}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchResultCard;
