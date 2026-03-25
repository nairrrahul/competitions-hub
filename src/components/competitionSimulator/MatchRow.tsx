import { renderScoreline } from "../../utils/MatchEngine";
import type { Match } from "../../utils/SchedulerUtils"
import MatchFlag from "./MatchFlag";

interface MatchRowProps {
  match: Match
  index: string | number
}

const MatchRow: React.FC<MatchRowProps> = ({ match, index }) => {
  return (
     <div key={index} className="flex items-center justify-between bg-gray-700 rounded p-3 relative">
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
  );
};

export default MatchRow;