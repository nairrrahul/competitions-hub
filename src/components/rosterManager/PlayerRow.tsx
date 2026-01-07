import type { Player } from '../../types/rosterManager'
import { getRatingColor } from '../../utils/rosterManager'

interface PlayerRowProps {
  player: Player
  getNationFlagCode: (nation: string) => string | null
  onPlayerClick: (player: Player) => void
}

const PlayerRow: React.FC<PlayerRowProps> = ({ player, getNationFlagCode, onPlayerClick }) => {
  return (
    <tr className="hover:bg-gray-750 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-base text-white">
        <button
          onClick={() => onPlayerClick(player)}
          className="text-left hover:text-green-400 transition-colors"
        >
          {player.commonName ? (
            <span className="font-bold text-lg">{player.commonName}</span>
          ) : (
            <span className="group">
              <span className="text-gray-300 text-lg group-hover:text-green-400 transition-colors">{player.firstName} </span>
              <span className="font-bold text-lg group-hover:text-green-400 transition-colors">{player.lastName}</span>
            </span>
          )}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-base text-white">
        <div className="flex items-center space-x-2">
          <div className="relative w-6 h-4 overflow-hidden rounded flex items-center justify-center bg-gray-600">
            {getNationFlagCode(player.nationality) && (
              <span
                className={`fi fi-${getNationFlagCode(player.nationality)} absolute inset-0`}
                style={{
                  fontSize: '1rem',
                  lineHeight: '1',
                  transform: 'scale(1.2)',
                }}
              />
            )}
          </div>
          <span>{player.nationality}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-base text-white">{player.age}</td>
      <td className="px-6 py-4 whitespace-nowrap text-base">
        <span className={`px-2 py-1 rounded font-medium ${getRatingColor(player.overall).bg} ${getRatingColor(player.overall).text}`}>
          {player.overall}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-base">
        <span className={`px-2 py-1 rounded font-medium ${getRatingColor(player.potential).bg} ${getRatingColor(player.potential).text}`}>
          {player.potential}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-base text-white">{player.position}</td>
    </tr>
  )
}

export default PlayerRow
