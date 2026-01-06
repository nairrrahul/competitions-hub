import { useState } from 'react'
import type { Squad, Player, SquadPlayer } from '../../types/rosterManager'
import { useGlobalStore } from '../../state/GlobalState'
import PlayerCard from './PlayerCard'

interface SquadEditModalProps {
  squad: Squad
  nation: string
  onClose: () => void
}

interface EditablePlayerSlot {
  type: 'starter' | 'substitute'
  position: string
  arrayIndex?: number
  player: SquadPlayer | null
}

const SquadEditModal: React.FC<SquadEditModalProps> = ({ squad, nation, onClose }) => {
  const { updateSquad, getPlayersByNation } = useGlobalStore()
  const [editedSquad, setEditedSquad] = useState<Squad>(JSON.parse(JSON.stringify(squad)))
  const [selectedSlot, setSelectedSlot] = useState<EditablePlayerSlot | null>(null)
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [swapMode, setSwapMode] = useState<'starter' | 'substitute' | null>(null)
  const [swapStarter, setSwapStarter] = useState<EditablePlayerSlot | null>(null)
  const [swapSubstitute, setSwapSubstitute] = useState<EditablePlayerSlot | null>(null)

  // Get all players from the nation
  const allNationPlayers = getPlayersByNation(nation)
  
    // Get players currently in the squad
  const getSquadPlayers = (): Player[] => {
    const players: Player[] = []
    
    // Add starters
    if (editedSquad.starters.gk) players.push(editedSquad.starters.gk.player)
    editedSquad.starters.defenders.forEach(d => d && players.push(d.player))
    editedSquad.starters.midfielders.forEach(m => m && players.push(m.player))
    editedSquad.starters.forwards.forEach(f => f && players.push(f.player))
    
    // Add substitutes
    if (editedSquad.substitutes.gk) players.push(editedSquad.substitutes.gk.player)
    editedSquad.substitutes.defenders.forEach(d => d && players.push(d.player))
    editedSquad.substitutes.midfielders.forEach(m => m && players.push(m.player))
    editedSquad.substitutes.forwards.forEach(f => f && players.push(f.player))
    
    return players
  }

  // Get player IDs currently in the squad
  const getSquadPlayerIds = (): number[] => {
    const players = getSquadPlayers()
    return players.map(p => p.playerid)
  }

  // Position constraints for swaps
  const getPositionConstraints = (position: string): string[] => {
    const constraints: { [key: string]: string[] } = {
      'GK': ['GK'],
      'RB': ['RB'],
      'LB': ['LB'],
      'CB': ['CB'],
      'CDM': ['CDM', 'CM'],
      'CM': ['CM', 'CDM', 'CAM'],
      'CAM': ['CM', 'CAM'],
      'RW': ['RW', 'RM'],
      'LW': ['LW', 'LM'],
      'RM': ['RM', 'RW'],
      'LM': ['LM', 'LW'],
      'ST': ['ST']
    }
    return constraints[position] || [position]
  }

  const getSubstitutePositionConstraints = (position: string): string[] => {
    const constraints: { [key: string]: string[] } = {
      'GK': ['GK'],
      'RB': ['RB','LB','CB'],
      'LB': ['LB','RB','CB'],
      'CB': ['CB','RB','LB'],
      'CDM': ['CDM', 'CM','CAM'],
      'CM': ['CM', 'CDM', 'CAM'],
      'CAM': ['CM', 'CAM', 'CDM'],
      'RW': ['RW', 'RM', 'LW', 'LM','ST'],
      'LW': ['RW', 'RM', 'LW', 'LM','ST'],
      'RM': ['RW', 'RM', 'LW', 'LM','ST'],
      'LM': ['RW', 'RM', 'LW', 'LM','ST'],
      'ST': ['RW', 'RM', 'LW', 'LM','ST']
    }
    return constraints[position] || [position]
  }

  // Start swap process
  const handleStartSwap = () => {
    setSwapMode('starter')
    setSwapStarter(null)
    setSwapSubstitute(null)
    setSelectedSlot(null)
  }

  // Handle starter selection in swap mode
  const handleStarterClick = (position: string, arrayIndex?: number) => {
    if (swapMode === 'starter') {
      let player: SquadPlayer | null = null
      
      if (position === 'gk') {
        player = editedSquad.starters.gk
      } else if (position === 'defenders' && arrayIndex !== undefined) {
        player = editedSquad.starters.defenders[arrayIndex]
      } else if (position === 'midfielders' && arrayIndex !== undefined) {
        player = editedSquad.starters.midfielders[arrayIndex]
      } else if (position === 'forwards' && arrayIndex !== undefined) {
        player = editedSquad.starters.forwards[arrayIndex]
      }
      
      setSwapStarter({ type: 'starter', position, arrayIndex, player })
      setSwapMode('substitute')
    }
  }

  // Handle substitute selection in swap mode
  const handleSubstituteClick = (position: string, arrayIndex?: number) => {
    if (swapMode === 'substitute' && swapStarter) {
      let player: SquadPlayer | null = null
      
      if (position === 'gk') {
        player = editedSquad.substitutes.gk
      } else if (position === 'defenders' && arrayIndex !== undefined) {
        player = editedSquad.substitutes.defenders[arrayIndex]
      } else if (position === 'midfielders' && arrayIndex !== undefined) {
        player = editedSquad.substitutes.midfielders[arrayIndex]
      } else if (position === 'forwards' && arrayIndex !== undefined) {
        player = editedSquad.substitutes.forwards[arrayIndex]
      }
      
      // Check if substitute matches position constraint
      if (swapStarter && player) {
        const starterActualPosition = getActualPosition(swapStarter.position, swapStarter.arrayIndex)
        const substituteActualPosition = getActualPosition(position, arrayIndex)
        const eligiblePositions = getPositionConstraints(starterActualPosition)
        
        if (eligiblePositions.includes(substituteActualPosition)) {
          setSwapSubstitute({ type: 'substitute', position, arrayIndex, player })
          executeSwap()
        } else {
          // Position constraint not met - don't allow swap
          return
        }
      }
    }
  }

  // Get actual position from array position and index
  const getActualPosition = (position: string, arrayIndex?: number): string => {
    if (position === 'defenders' && arrayIndex !== undefined) {
      const defenderPositions = ['LB', 'CB', 'CB', 'RB'] // Index 0=LB (left), 1=CB, 2=CB, 3=RB (right)
      return defenderPositions[arrayIndex] || 'CB'
    } else if (position === 'midfielders' && arrayIndex !== undefined) {
      const midfielderPositions = ['CDM', 'CM', 'CAM'] // Based on SquadView layout
      return midfielderPositions[arrayIndex] || 'CM'
    } else if (position === 'forwards' && arrayIndex !== undefined) {
      const forwardPositions = ['RW', 'LW', 'ST'] // Index 0=RW (right), 1=LW (left), 2=ST (center)
      return forwardPositions[arrayIndex] || 'ST'
    } else if (position === 'gk') {
      return 'GK'
    }
    return position
  }

  // Execute the swap
  const executeSwap = () => {
    if (!swapStarter || !swapSubstitute) return
    
    const updatedSquad = JSON.parse(JSON.stringify(editedSquad)) as Squad
    
    // Get players to swap
    const starterPlayer = swapStarter.player
    const substitutePlayer = swapSubstitute.player
    
    // Swap starter position
    if (swapStarter.position === 'gk') {
      updatedSquad.starters.gk = substitutePlayer || { player: { playerid: -1, firstName: 'Empty', lastName: 'Slot', commonName: 'Empty Slot', age: 0, overall: 0, potential: 0, position: 'GK', nationality: nation } }
    } else if (swapStarter.position === 'defenders' && swapStarter.arrayIndex !== undefined) {
      updatedSquad.starters.defenders[swapStarter.arrayIndex] = substitutePlayer || { player: { playerid: -1, firstName: 'Empty', lastName: 'Slot', commonName: 'Empty Slot', age: 0, overall: 0, potential: 0, position: 'CB', nationality: nation } }
    } else if (swapStarter.position === 'midfielders' && swapStarter.arrayIndex !== undefined) {
      updatedSquad.starters.midfielders[swapStarter.arrayIndex] = substitutePlayer || { player: { playerid: -1, firstName: 'Empty', lastName: 'Slot', commonName: 'Empty Slot', age: 0, overall: 0, potential: 0, position: 'CM', nationality: nation } }
    } else if (swapStarter.position === 'forwards' && swapStarter.arrayIndex !== undefined) {
      updatedSquad.starters.forwards[swapStarter.arrayIndex] = substitutePlayer || { player: { playerid: -1, firstName: 'Empty', lastName: 'Slot', commonName: 'Empty Slot', age: 0, overall: 0, potential: 0, position: 'ST', nationality: nation } }
    }
    
    // Swap substitute position
    if (swapSubstitute.position === 'gk') {
      updatedSquad.substitutes.gk = starterPlayer || { player: { playerid: -1, firstName: 'Empty', lastName: 'Slot', commonName: 'Empty Slot', age: 0, overall: 0, potential: 0, position: 'GK', nationality: nation } }
    } else if (swapSubstitute.position === 'defenders' && swapSubstitute.arrayIndex !== undefined) {
      updatedSquad.substitutes.defenders[swapSubstitute.arrayIndex] = starterPlayer || { player: { playerid: -1, firstName: 'Empty', lastName: 'Slot', commonName: 'Empty Slot', age: 0, overall: 0, potential: 0, position: 'CB', nationality: nation } }
    } else if (swapSubstitute.position === 'midfielders' && swapSubstitute.arrayIndex !== undefined) {
      updatedSquad.substitutes.midfielders[swapSubstitute.arrayIndex] = starterPlayer || { player: { playerid: -1, firstName: 'Empty', lastName: 'Slot', commonName: 'Empty Slot', age: 0, overall: 0, potential: 0, position: 'CM', nationality: nation } }
    } else if (swapSubstitute.position === 'forwards' && swapSubstitute.arrayIndex !== undefined) {
      updatedSquad.substitutes.forwards[swapSubstitute.arrayIndex] = starterPlayer || { player: { playerid: -1, firstName: 'Empty', lastName: 'Slot', commonName: 'Empty Slot', age: 0, overall: 0, potential: 0, position: 'ST', nationality: nation } }
    }
    
    setEditedSquad(updatedSquad)
    setSwapMode(null)
    setSwapStarter(null)
    setSwapSubstitute(null)
  }

  // Cancel swap
  const handleCancelSwap = () => {
    setSwapMode(null)
    setSwapStarter(null)
    setSwapSubstitute(null)
    setSelectedSlot(null)
  }

  const handleSlotClick = (type: 'starter' | 'substitute', position: string, arrayIndex?: number) => {
    let player: SquadPlayer | null = null
    
    // Map array positions to actual positions for constraints
    let actualPosition = position
    if (position === 'gk') {
      actualPosition = 'GK' // Ensure goalkeeper position is uppercase
    } else if (position === 'defenders' && arrayIndex !== undefined) {
      // Map defender array indices to actual positions based on formation layout
      const defenderPositions = ['LB', 'CB', 'CB', 'RB'] // Index 0=LB (left), 1=CB, 2=CB, 3=RB (right)
      actualPosition = defenderPositions[arrayIndex] || 'CB'
    } else if (position === 'midfielders' && arrayIndex !== undefined) {
      // Map midfielder array indices to actual positions  
      const midfielderPositions = ['CDM', 'CM', 'CAM'] // Based on SquadView layout
      actualPosition = midfielderPositions[arrayIndex] || 'CM'
    } else if (position === 'forwards' && arrayIndex !== undefined) {
      // Map forward array indices to actual positions based on formation layout
      const forwardPositions = ['RW', 'LW', 'ST'] // Index 0=RW (right), 1=LW (left), 2=ST (center)
      actualPosition = forwardPositions[arrayIndex] || 'ST'
    }
    
    if (type === 'starter') {
      if (position === 'gk') {
        player = editedSquad.starters.gk
      } else if (position === 'defenders' && arrayIndex !== undefined) {
        player = editedSquad.starters.defenders[arrayIndex]
      } else if (position === 'midfielders' && arrayIndex !== undefined) {
        player = editedSquad.starters.midfielders[arrayIndex]
      } else if (position === 'forwards' && arrayIndex !== undefined) {
        player = editedSquad.starters.forwards[arrayIndex]
      }
    } else {
      if (position === 'gk') {
        player = editedSquad.substitutes.gk
      } else if (position === 'defenders' && arrayIndex !== undefined) {
        player = editedSquad.substitutes.defenders[arrayIndex]
      } else if (position === 'midfielders' && arrayIndex !== undefined) {
        player = editedSquad.substitutes.midfielders[arrayIndex]
      } else if (position === 'forwards' && arrayIndex !== undefined) {
        player = editedSquad.substitutes.forwards[arrayIndex]
      }
    }
    
    setSelectedSlot({ type, position, arrayIndex, player })
    
    // Get available players for this position
    const squadPlayerIds = getSquadPlayerIds()
    
    // Get players not in squad who can play this position
    const eligiblePositions = type === 'starter' 
      ? getPositionConstraints(actualPosition)
      : getSubstitutePositionConstraints(actualPosition)
    
    // Debug logging
    console.log('Position clicked:', position, 'Array index:', arrayIndex)
    console.log('Actual position for constraints:', actualPosition)
    console.log('Type:', type)
    console.log('Eligible positions:', eligiblePositions)
    
    const available = allNationPlayers.filter(p => 
      !squadPlayerIds.includes(p.playerid) &&
      eligiblePositions.includes(p.position)
    ).sort((a, b) => {
      // Sort by overall (descending), then potential (descending), then alphabetical
      if (b.overall !== a.overall) {
        return b.overall - a.overall
      }
      if (b.potential !== a.potential) {
        return b.potential - a.potential
      }
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()
      return nameA.localeCompare(nameB)
    })
    
    // Debug logging for filtered players
    console.log('Available players count:', available.length)
    console.log('First 5 available players:', available.slice(0, 5).map(p => `${p.firstName} ${p.lastName} (${p.position}) ID: ${p.playerid}`))
    
    setAvailablePlayers(available)
  }

  const handlePlayerSwap = (newPlayer: Player) => {
    if (!selectedSlot) return
    
    const newSquadPlayer: SquadPlayer = { player: newPlayer }
    const updatedSquad = JSON.parse(JSON.stringify(editedSquad)) as Squad
    
    // Remove the new player from their current position if they're already in the squad
    const removePlayerFromSquad = (playerToRemove: Player) => {
      const removePlayer = (squadPlayer: SquadPlayer | null) => {
        if (squadPlayer && squadPlayer.player.playerid === playerToRemove.playerid) {
          return null
        }
        return squadPlayer
      }
      
      // For the Squad type, we need to ensure all positions are filled
      // Create a dummy player for empty slots to maintain type safety
      const dummyPlayer: Player = {
        playerid: -1,
        firstName: 'Empty',
        lastName: 'Slot',
        commonName: 'Empty Slot',
        age: 0,
        overall: 0,
        potential: 0,
        position: 'GK',
        nationality: nation
      }
      
      const createSquadPlayer = (player: Player | null): SquadPlayer => {
        return player ? { player } : { player: dummyPlayer }
      }
      
      updatedSquad.starters.gk = createSquadPlayer(removePlayer(updatedSquad.starters.gk)?.player || null)
      updatedSquad.starters.defenders = [
        createSquadPlayer(removePlayer(updatedSquad.starters.defenders[0])?.player || null),
        createSquadPlayer(removePlayer(updatedSquad.starters.defenders[1])?.player || null),
        createSquadPlayer(removePlayer(updatedSquad.starters.defenders[2])?.player || null),
        createSquadPlayer(removePlayer(updatedSquad.starters.defenders[3])?.player || null)
      ] as [SquadPlayer, SquadPlayer, SquadPlayer, SquadPlayer]
      updatedSquad.starters.midfielders = [
        createSquadPlayer(removePlayer(updatedSquad.starters.midfielders[0])?.player || null),
        createSquadPlayer(removePlayer(updatedSquad.starters.midfielders[1])?.player || null),
        createSquadPlayer(removePlayer(updatedSquad.starters.midfielders[2])?.player || null)
      ] as [SquadPlayer, SquadPlayer, SquadPlayer]
      updatedSquad.starters.forwards = [
        createSquadPlayer(removePlayer(updatedSquad.starters.forwards[0])?.player || null),
        createSquadPlayer(removePlayer(updatedSquad.starters.forwards[1])?.player || null),
        createSquadPlayer(removePlayer(updatedSquad.starters.forwards[2])?.player || null)
      ] as [SquadPlayer, SquadPlayer, SquadPlayer]
      
      updatedSquad.substitutes.gk = createSquadPlayer(removePlayer(updatedSquad.substitutes.gk)?.player || null)
      updatedSquad.substitutes.defenders = [
        createSquadPlayer(removePlayer(updatedSquad.substitutes.defenders[0])?.player || null),
        createSquadPlayer(removePlayer(updatedSquad.substitutes.defenders[1])?.player || null)
      ] as [SquadPlayer, SquadPlayer]
      updatedSquad.substitutes.midfielders = [
        createSquadPlayer(removePlayer(updatedSquad.substitutes.midfielders[0])?.player || null),
        createSquadPlayer(removePlayer(updatedSquad.substitutes.midfielders[1])?.player || null),
        createSquadPlayer(removePlayer(updatedSquad.substitutes.midfielders[2])?.player || null)
      ] as [SquadPlayer, SquadPlayer, SquadPlayer]
      updatedSquad.substitutes.forwards = [
        createSquadPlayer(removePlayer(updatedSquad.substitutes.forwards[0])?.player || null),
        createSquadPlayer(removePlayer(updatedSquad.substitutes.forwards[1])?.player || null)
      ] as [SquadPlayer, SquadPlayer]
    }
    
    // If the new player is already in the squad, remove them first
    removePlayerFromSquad(newPlayer)
    
    // Place the new player in the selected slot
    if (selectedSlot.type === 'starter') {
      if (selectedSlot.position === 'gk') {
        updatedSquad.starters.gk = newSquadPlayer
      } else if (selectedSlot.position === 'defenders' && selectedSlot.arrayIndex !== undefined) {
        updatedSquad.starters.defenders[selectedSlot.arrayIndex] = newSquadPlayer
      } else if (selectedSlot.position === 'midfielders' && selectedSlot.arrayIndex !== undefined) {
        updatedSquad.starters.midfielders[selectedSlot.arrayIndex] = newSquadPlayer
      } else if (selectedSlot.position === 'forwards' && selectedSlot.arrayIndex !== undefined) {
        updatedSquad.starters.forwards[selectedSlot.arrayIndex] = newSquadPlayer
      }
    } else {
      if (selectedSlot.position === 'gk') {
        updatedSquad.substitutes.gk = newSquadPlayer
      } else if (selectedSlot.position === 'defenders' && selectedSlot.arrayIndex !== undefined) {
        updatedSquad.substitutes.defenders[selectedSlot.arrayIndex] = newSquadPlayer
      } else if (selectedSlot.position === 'midfielders' && selectedSlot.arrayIndex !== undefined) {
        updatedSquad.substitutes.midfielders[selectedSlot.arrayIndex] = newSquadPlayer
      } else if (selectedSlot.position === 'forwards' && selectedSlot.arrayIndex !== undefined) {
        updatedSquad.substitutes.forwards[selectedSlot.arrayIndex] = newSquadPlayer
      }
    }
    
    setEditedSquad(updatedSquad)
    setSelectedSlot(null)
    setAvailablePlayers([])
  }

  const handleSave = () => {
    updateSquad(nation, editedSquad)
    onClose()
  }

  const renderPlayerSlot = (player: SquadPlayer | null, position: string, type: 'starter' | 'substitute', arrayIndex?: number) => {
    const displayPosition = position === 'gk' ? 'GK' : position.toUpperCase()
    const isSelected = selectedSlot?.type === type && 
                      selectedSlot?.position === position && 
                      selectedSlot?.arrayIndex === arrayIndex
    
    // Check if this is a dummy player (empty slot)
    const isEmptySlot = player && player.player.firstName === 'Empty' && player.player.lastName === 'Slot'
    
    // For substitutes, show player's actual position instead of generic position
    const playerPosition = player && !isEmptySlot ? player.player.position : displayPosition
    
    // Check if this slot is clickable in swap mode
    let isClickable = true
    let clickHandler = () => handleSlotClick(type, position, arrayIndex)
    
    if (swapMode === 'starter' && type === 'starter') {
      // Only starters are clickable in starter selection mode
      clickHandler = () => handleStarterClick(position, arrayIndex)
    } else if (swapMode === 'substitute' && type === 'substitute') {
      // Check if substitute matches position constraint
      if (swapStarter) {
        const starterActualPosition = getActualPosition(swapStarter.position, swapStarter.arrayIndex)
        const substituteActualPosition = getActualPosition(position, arrayIndex)
        const eligiblePositions = getPositionConstraints(starterActualPosition)
        isClickable = eligiblePositions.includes(substituteActualPosition)
      }
      if (isClickable) {
        clickHandler = () => handleSubstituteClick(position, arrayIndex)
      }
    }
    
    // Determine if this slot is selected in swap process
    const isSwapSelected = 
      (swapMode === 'starter' && swapStarter?.type === type && swapStarter?.position === position && swapStarter?.arrayIndex === arrayIndex) ||
      (swapMode === 'substitute' && swapSubstitute?.type === type && swapSubstitute?.position === position && swapSubstitute?.arrayIndex === arrayIndex)
    
    return (
      <div
        onClick={isClickable ? clickHandler : undefined}
        className={`cursor-pointer transition-all ${
          isSwapSelected ? 'ring-2 ring-blue-400 rounded-lg' : 
          isSelected ? 'ring-2 ring-green-400 rounded-lg' : 
          isClickable ? 'hover:ring-1 hover:ring-gray-400 rounded-lg' : 'opacity-50'
        }`}
      >
        {player && !isEmptySlot ? (
          <PlayerCard 
            player={player.player} 
            position={playerPosition}
            compact={type === 'substitute'}
          />
        ) : (
          <div className={`bg-gray-700 rounded-lg ${type === 'substitute' ? 'p-3' : 'p-4'} flex items-center justify-center text-gray-500 ${type === 'substitute' ? 'w-full' : 'w-48'}`}>
            <span className="text-sm">Empty Slot</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-[95vw] w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-green-400">Edit {nation} Squad</h2>
              {swapMode && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">
                    {swapMode === 'starter' ? 'Click a starter to select' : 'Click a matching substitute to swap'}
                  </span>
                  {swapStarter && (
                    <span className="text-blue-400 font-medium">
                      Selected: {swapStarter.player?.player.firstName} {swapStarter.player?.player.lastName}
                    </span>
                  )}
                  <button
                    onClick={handleCancelSwap}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Squad Content */}
        <div className="p-6">
          <div className="flex gap-6">
            {/* Starters */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-green-400">Starting XI</h3>
                {!swapMode && (
                  <button
                    onClick={handleStartSwap}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Swap Substitute In
                  </button>
                )}
              </div>
              <div className="grid grid-cols-9 gap-6 items-center justify-items-center min-h-[600px]">
                {/* Formation layout similar to SquadView */}
                <div className="col-start-4 col-span-3 row-start-4">
                  {renderPlayerSlot(editedSquad.starters.gk, 'gk', 'starter')}
                </div>

                <div className="col-start-1 col-span-2 row-start-3">
                  {renderPlayerSlot(editedSquad.starters.defenders[3], 'defenders', 'starter', 3)}
                </div>
                <div className="col-start-3 col-span-2 row-start-3">
                  {renderPlayerSlot(editedSquad.starters.defenders[1], 'defenders', 'starter', 1)}
                </div>
                <div className="col-start-6 col-span-2 row-start-3">
                  {renderPlayerSlot(editedSquad.starters.defenders[2], 'defenders', 'starter', 2)}
                </div>
                <div className="col-start-8 col-span-2 row-start-3">
                  {renderPlayerSlot(editedSquad.starters.defenders[0], 'defenders', 'starter', 0)}
                </div>

                <div className="col-start-3 col-span-2 row-start-2">
                  {renderPlayerSlot(editedSquad.starters.midfielders[0], 'midfielders', 'starter', 0)}
                </div>
                <div className="col-start-5 col-span-1 row-start-2">
                  {renderPlayerSlot(editedSquad.starters.midfielders[1], 'midfielders', 'starter', 1)}
                </div>
                <div className="col-start-6 col-span-2 row-start-2">
                  {renderPlayerSlot(editedSquad.starters.midfielders[2], 'midfielders', 'starter', 2)}
                </div>

                <div className="col-start-1 col-span-2 row-start-1">
                  {renderPlayerSlot(editedSquad.starters.forwards[1], 'forwards', 'starter', 1)}
                </div>
                <div className="col-start-4 col-span-3 row-start-1">
                  {renderPlayerSlot(editedSquad.starters.forwards[2], 'forwards', 'starter', 2)}
                </div>
                <div className="col-start-8 col-span-2 row-start-1">
                  {renderPlayerSlot(editedSquad.starters.forwards[0], 'forwards', 'starter', 0)}
                </div>
              </div>
            </div>

            {/* Substitutes */}
            <div className="w-80">
              <h3 className="text-xl font-bold text-green-400 mb-6">Substitutes</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Goalkeeper</h4>
                  {renderPlayerSlot(editedSquad.substitutes.gk, 'gk', 'substitute')}
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Defenders</h4>
                  <div className="space-y-2">
                    {editedSquad.substitutes.defenders.map((defender, index) => (
                      <div key={`sub-defender-${index}`}>
                        {renderPlayerSlot(defender, 'defenders', 'substitute', index)}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Midfielders</h4>
                  <div className="space-y-2">
                    {editedSquad.substitutes.midfielders.map((midfielder, index) => (
                      <div key={`sub-midfielder-${index}`}>
                        {renderPlayerSlot(midfielder, 'midfielders', 'substitute', index)}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Forwards</h4>
                  <div className="space-y-2">
                    {editedSquad.substitutes.forwards.map((forward, index) => (
                      <div key={`sub-forward-${index}`}>
                        {renderPlayerSlot(forward, 'forwards', 'substitute', index)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Available Players Panel */}
          {selectedSlot && (
            <div className="mt-6 p-4 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold text-green-400 mb-4">
                Available Players for {selectedSlot.position === 'gk' ? 'GK' : selectedSlot.position.toUpperCase()} Position
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                {availablePlayers.map(player => (
                  <div
                    key={player.playerid}
                    onClick={() => handlePlayerSwap(player)}
                    className="cursor-pointer hover:bg-gray-700 rounded-lg p-2 transition-colors"
                  >
                    <PlayerCard player={player} position={player.position} compact={true} />
                  </div>
                ))}
              </div>
              {availablePlayers.length === 0 && (
                <p className="text-gray-400 text-center py-4">No available players for this position</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6">
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Save Squad
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SquadEditModal
