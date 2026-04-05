import React, { useState, useEffect } from 'react';
import type { Match } from '../../utils/SchedulerUtils';
import MatchFlag from './MatchFlag';

interface RigMatchDialogProps {
  match: Match;
  onClose: () => void;
  onConfirm: (homeGoals: number, awayGoals: number) => void;
}

const RigMatchDialog: React.FC<RigMatchDialogProps> = ({ match, onClose, onConfirm }) => {
  const [homeGoals, setHomeGoals] = useState<number>(0);
  const [awayGoals, setAwayGoals] = useState<number>(0);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (match.matchRiggedOptions.isRigged) {
      setHomeGoals(match.matchRiggedOptions.homeGoals);
      setAwayGoals(match.matchRiggedOptions.awayGoals);
    } else {
      setHomeGoals(0);
      setAwayGoals(0);
    }
  }, [match.matchRiggedOptions]);

  useEffect(() => {
    const totalGoals = homeGoals + awayGoals;
    if (totalGoals > 90) {
      setError('Total goals cannot exceed 90');
    } else {
      setError('');
    }
  }, [homeGoals, awayGoals]);

  const handleConfirm = () => {
    if (!error) {
      onConfirm(homeGoals, awayGoals);
      onClose();
    }
  };

  const handleHomeGoalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    if (value >= 0) {
      setHomeGoals(value);
    }
  };

  const handleAwayGoalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    if (value >= 0) {
      setAwayGoals(value);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-900 p-6 pt-14 text-white shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 h-7 w-7 rounded-full border border-gray-500 bg-gray-800 text-white hover:bg-gray-700 z-30"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="grid grid-cols-2 gap-8 mb-6">
          {/* Home Team Section */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-14 mb-3 flex items-center justify-center">
              <MatchFlag countryName={match.homeTeam} w={20} h={14} s={2.5} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-4">{match.homeTeam}</h3>
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                NUMBER OF GOALS
              </label>
              <input
                type="number"
                min="0"
                value={homeGoals}
                onChange={handleHomeGoalsChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Away Team Section */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-14 mb-3 flex items-center justify-center">
              <MatchFlag countryName={match.awayTeam} w={20} h={14} s={2.5} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-4">{match.awayTeam}</h3>
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                NUMBER OF GOALS
              </label>
              <input
                type="number"
                min="0"
                value={awayGoals}
                onChange={handleAwayGoalsChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 text-center">
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {/* Confirm Button */}
        <div className="flex justify-center">
          <button
            onClick={handleConfirm}
            disabled={!!error}
            className={`px-8 py-2 rounded-lg font-semibold transition-colors ${
              error
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
};

export default RigMatchDialog;
