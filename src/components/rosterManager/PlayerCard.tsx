import type { Player } from '../../types/rosterManager'
import { getRatingColor } from '../../utils/rosterManager'

interface PlayerCardProps {
  player: Player
  position: string
  compact?: boolean
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, position, compact = false }) => {
  const ratingColors = getRatingColor(player.overall)

  if (compact) {
    return (
      <div className="bg-gray-700 rounded-lg p-3 flex items-center gap-3 hover:bg-gray-600 transition-colors w-full">
        {/* Position */}
        <div className="flex-shrink-0 w-12">
          <div className="text-xs font-semibold text-gray-400 uppercase">{position}</div>
        </div>
        
        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white break-words">
            {player.commonName || `${player.firstName} ${player.lastName}`}
          </div>
          <div className="text-xs text-gray-400">
            {player.age} years • Pot: {player.potential}
          </div>
        </div>
        
        {/* Overall Rating */}
        <div className="flex-shrink-0 w-12">
          <div className={`w-10 h-10 ${ratingColors.bg} ${ratingColors.text} rounded-lg flex items-center justify-center text-sm font-bold`}>
            {player.overall}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors w-48">
      {/* Position and Overall Rating */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-400 uppercase">{player.position}</div>
        <div className={`w-12 h-12 ${ratingColors.bg} ${ratingColors.text} rounded-lg flex items-center justify-center text-lg font-bold`}>
          {player.overall}
        </div>
      </div>
      
      {/* Player Name */}
      <div className="text-center mb-2">
        <div className="text-white font-medium break-words">
          {player.commonName || `${player.firstName} ${player.lastName}`}
        </div>
        {player.commonName && (
          <div className="text-xs text-gray-400 mt-1">
            {player.firstName} {player.lastName}
          </div>
        )}
      </div>
      
      {/* Player Details */}
      <div className="flex justify-between text-xs text-gray-400">
        <span>Age: {player.age}</span>
        <span>Pot: {player.potential}</span>
      </div>
    </div>
  )
}

export default PlayerCard
