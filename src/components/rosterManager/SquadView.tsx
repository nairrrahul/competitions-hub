import type { Squad } from '../../types/rosterManager'
import PlayerCard from './PlayerCard'
import { getRatingColor } from '../../utils/rosterManager'
import { useGlobalStore } from '../../state/GlobalState'
import { useState } from 'react'
import SquadEditModal from './SquadEditModal'

interface SquadViewProps {
  squad: Squad
  nation: string
}

const SquadView: React.FC<SquadViewProps> = ({ squad, nation }) => {
  const getNationFlagCode = useGlobalStore(state => state.getNationFlagCode)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  return (
    <>
      <div className="flex gap-6 h-full">
        {/* Starters - Main Section */}
        <div className="flex-1">
          <div className="bg-gray-800 rounded-lg p-6 h-full">
            <h3 className="text-xl font-bold text-green-400 mb-6">Starting XI</h3>
            
            <div className="flex items-center justify-center mb-8">
              <h2 className="text-4xl font-bold text-white mr-3">{nation}</h2>
              <div className="relative w-10 h-8 overflow-hidden rounded flex items-center justify-center bg-gray-600">
                {getNationFlagCode(nation) && (
                  <span
                    className={`fi fi-${getNationFlagCode(nation)} absolute inset-0`}
                    style={{
                      fontSize: '1rem',
                      lineHeight: '1',
                      transform: 'scale(2.2)',
                    }}
                  />
                )}
              </div>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="ml-4 p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                title="Edit Squad"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            </div>
            
            {/* Formation Layout */}
            <div className="grid grid-cols-9 gap-6 items-center justify-items-center min-h-[600px]">
              {/* Goalkeeper */}
              <div className="col-start-4 col-span-3 row-start-4">
                {squad.starters.gk && (
                  <PlayerCard 
                    player={squad.starters.gk.player} 
                    position="GK"
                  />
                )}
              </div>

              {/* Defenders */}
              <div className="col-start-1 col-span-2 row-start-3">
                {squad.starters.defenders[3] && (
                  <PlayerCard 
                    player={squad.starters.defenders[3].player} 
                    position="LB"
                  />
                )}
              </div>
              <div className="col-start-3 col-span-2 row-start-3">
                {squad.starters.defenders[1] && (
                  <PlayerCard 
                    player={squad.starters.defenders[1].player} 
                    position="CB"
                  />
                )}
              </div>
              <div className="col-start-6 col-span-2 row-start-3">
                {squad.starters.defenders[2] && (
                  <PlayerCard 
                    player={squad.starters.defenders[2].player} 
                    position="CB"
                  />
                )}
              </div>
              <div className="col-start-8 col-span-2 row-start-3">
                {squad.starters.defenders[0] && (
                  <PlayerCard 
                    player={squad.starters.defenders[0].player} 
                    position="RB"
                  />
                )}
              </div>

              {/* Midfielders */}
              <div className="col-start-3 col-span-2 row-start-2">
                {squad.starters.midfielders[0] && (
                  <PlayerCard 
                    player={squad.starters.midfielders[0].player} 
                    position={squad.starters.midfielders[0].player.position}
                  />
                )}
              </div>
              <div className="col-start-5 col-span-1 row-start-2">
                {squad.starters.midfielders[1] && (
                  <PlayerCard 
                    player={squad.starters.midfielders[1].player} 
                    position={squad.starters.midfielders[1].player.position}
                  />
                )}
              </div>
              <div className="col-start-6 col-span-2 row-start-2">
                {squad.starters.midfielders[2] && (
                  <PlayerCard 
                    player={squad.starters.midfielders[2].player} 
                    position={squad.starters.midfielders[2].player.position}
                  />
                )}
              </div>

              {/* Forwards */}
              <div className="col-start-1 col-span-2 row-start-1">
                {squad.starters.forwards[1] && (
                  <PlayerCard 
                    player={squad.starters.forwards[1].player} 
                    position="LW"
                  />
                )}
              </div>
              <div className="col-start-4 col-span-3 row-start-1">
                {squad.starters.forwards[2] && (
                  <PlayerCard 
                    player={squad.starters.forwards[2].player} 
                    position="ST"
                  />
                )}
              </div>
              <div className="col-start-8 col-span-2 row-start-1">
                {squad.starters.forwards[0] && (
                  <PlayerCard 
                    player={squad.starters.forwards[0].player} 
                    position="RW"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Substitutes - Side Panel */}
        <div className="w-80">
          <div className="bg-gray-800 rounded-lg p-6 h-full">
            <h3 className="text-xl font-bold text-green-400 mb-6">Substitutes</h3>
            
            <div className="space-y-4">
              {/* Substitute GK */}
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Goalkeeper</h4>
                {squad.substitutes.gk && (
                  <PlayerCard 
                    player={squad.substitutes.gk.player} 
                    position="GK"
                    compact={true}
                  />
                )}
              </div>
              
              {/* Substitute Defenders */}
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Defenders</h4>
                <div className="space-y-2">
                  {squad.substitutes.defenders.filter(Boolean).map((squadPlayer, index) => (
                    <PlayerCard 
                      key={`sub-defender-${index}`}
                      player={squadPlayer.player} 
                      position={squadPlayer.player.position}
                      compact={true}
                    />
                  ))}
                </div>
              </div>
              
              {/* Substitute Midfielders */}
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Midfielders</h4>
                <div className="space-y-2">
                  {squad.substitutes.midfielders.filter(Boolean).map((squadPlayer, index) => (
                    <PlayerCard 
                      key={`sub-midfielder-${index}`}
                      player={squadPlayer.player} 
                      position={squadPlayer.player.position}
                      compact={true}
                    />
                  ))}
                </div>
              </div>
              
              {/* Substitute Forwards */}
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Forwards</h4>
                <div className="space-y-2">
                  {squad.substitutes.forwards.filter(Boolean).map((squadPlayer, index) => (
                    <PlayerCard 
                      key={`sub-forward-${index}`}
                      player={squadPlayer.player} 
                      position={squadPlayer.player.position}
                      compact={true}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Modal - Rendered outside the flex container */}
      {isEditModalOpen && (
        <SquadEditModal
          squad={squad}
          nation={nation}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </>
  )
}

export default SquadView
