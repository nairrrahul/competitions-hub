import { useState } from 'react';
import { renderScoreline, type MatchResult } from "../../utils/MatchEngine";
import type { Match } from "../../utils/SchedulerUtils";
import MatchFlag from "./MatchFlag";
import MatchResultCard from "./MatchResultCard";
import RigMatchDialog from "./RigMatchDialog";

interface MatchRowProps {
  match: Match;
  index: string | number;
}

const MatchRow: React.FC<MatchRowProps> = ({ match, index }) => {
  const [showModal, setShowModal] = useState(false);
  const [showRigDialog, setShowRigDialog] = useState(false);

  const handleOpenModal = () => {
    if (match.result) {
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!match.result) {
      setShowRigDialog(true);
    }
  };

  const handleCloseRigDialog = () => {
    setShowRigDialog(false);
  };

  const handleRigConfirm = (homeGoals: number, awayGoals: number) => {
    match.matchRiggedOptions.isRigged = true;
    match.matchRiggedOptions.homeGoals = homeGoals;
    match.matchRiggedOptions.awayGoals = awayGoals;
  };

  return (
    <>
      <div
        key={index}
        className={`flex cursor-pointer items-center justify-between bg-gray-700 rounded p-3 relative hover:bg-gray-600 transition-colors ${
          match.matchRiggedOptions.isRigged ? 'border border-green-700' : ''
        }`}
        onClick={handleOpenModal}
        onContextMenu={handleRightClick}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <MatchFlag countryName={match.homeTeam} w={7} h={5} s={1.5}/>
            <span className="text-white font-medium">{match.homeTeam}</span>
          </div>
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <span className="text-gray-400 text-sm">{match.result ? renderScoreline(match) : 'vs'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">{match.awayTeam}</span>
          <MatchFlag countryName={match.awayTeam} w={7} h={5} s={1.5} />
        </div>
      </div>

      {showModal && match.result && (
        <MatchResultCard
          team1={match.homeTeam}
          team2={match.awayTeam}
          matchResult={match.result as MatchResult}
          onClose={handleCloseModal}
        />
      )}

      {showRigDialog && !match.result && (
        <RigMatchDialog
          match={match}
          onClose={handleCloseRigDialog}
          onConfirm={handleRigConfirm}
        />
      )}
    </>
  );
};

export default MatchRow;