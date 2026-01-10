import { useState, useEffect, useCallback } from 'react'
import type { Player } from '../../types/rosterManager'
import { useGlobalStore } from '../../state/GlobalState'
import NationAutocomplete from './NationAutocomplete'

interface BatchPlayer {
  id: number
  firstName: string
  lastName: string
  nationality: string
  age: string
  overall: string
  potential: string
  position: string
}

interface BatchAddPlayersModalProps {
  isOpen: boolean
  onClose: () => void
}

const BatchAddPlayersModal: React.FC<BatchAddPlayersModalProps> = ({ isOpen, onClose }) => {
  const addPlayer = useGlobalStore(state => state.addPlayer)
  const highestPlayerID = useGlobalStore(state => state.highestPlayerID)
  const numPlayersAdded = useGlobalStore(state => state.numPlayersAdded)

  const [players, setPlayers] = useState<BatchPlayer[]>([
    {
      id: highestPlayerID + numPlayersAdded + 1,
      firstName: '',
      lastName: '',
      nationality: '',
      age: '',
      overall: '',
      potential: '',
      position: 'CM'
    }
  ])

  const positions = ['GK', 'CB', 'LB', 'RB', 'CM', 'CAM', 'CDM', 'RM', 'LM', 'RW', 'LW', 'ST']

  // Resequencing function to ensure consecutive IDs
  const resequenceIds = useCallback(() => {
    setPlayers(prevPlayers => 
      prevPlayers.map((player, index) => ({
        ...player,
        id: highestPlayerID + numPlayersAdded + index + 1
      }))
    )
  }, [highestPlayerID, numPlayersAdded])

  // Update player IDs when highestPlayerID or numPlayersAdded changes
  useEffect(() => {
    resequenceIds()
  }, [resequenceIds])

  const handlePlayerChange = (index: number, field: keyof BatchPlayer, value: string) => {
    setPlayers(prevPlayers => 
      prevPlayers.map((player, i) => 
        i === index ? { ...player, [field]: value } : player
      )
    )
  }

  const addNewPlayerRow = () => {
    setPlayers(prevPlayers => [
      ...prevPlayers,
      {
        id: 0, // Will be updated by resequenceIds
        firstName: '',
        lastName: '',
        nationality: '',
        age: '',
        overall: '',
        potential: '',
        position: 'CM'
      }
    ])
    // Resequencing will happen in the useEffect, but also call it directly
    setTimeout(resequenceIds, 0)
  }

  const removePlayerRow = (index: number) => {
    if (players.length > 1) {
      setPlayers(prevPlayers => prevPlayers.filter((_, i) => i !== index))
      // Resequencing will happen in the useEffect, but also call it directly
      setTimeout(resequenceIds, 0)
    }
  }

  const validatePlayers = (): { isValid: boolean; reason: string } => {
    for (let i = 0; i < players.length; i++) {
      const player = players[i]
      
      if (!player.firstName.trim()) {
        return { isValid: false, reason: `Player ${i + 1}: First name is required` }
      }
      
      if (!player.lastName.trim()) {
        return { isValid: false, reason: `Player ${i + 1}: Last name is required` }
      }
      
      if (!player.nationality.trim()) {
        return { isValid: false, reason: `Player ${i + 1}: Nationality is required` }
      }
      
      if (!player.age.trim() || isNaN(parseInt(player.age)) || parseInt(player.age) < 15 || parseInt(player.age) > 50) {
        return { isValid: false, reason: `Player ${i + 1}: Age must be between 15 and 50` }
      }
      
      if (!player.overall.trim() || isNaN(parseInt(player.overall)) || parseInt(player.overall) < 0 || parseInt(player.overall) > 99) {
        return { isValid: false, reason: `Player ${i + 1}: Overall must be between 0 and 99` }
      }
      
      if (!player.potential.trim() || isNaN(parseInt(player.potential)) || parseInt(player.potential) < 0 || parseInt(player.potential) > 99) {
        return { isValid: false, reason: `Player ${i + 1}: Potential must be between 0 and 99` }
      }
    }
    
    return { isValid: true, reason: '' }
  }

  const handleSave = () => {
    const validation = validatePlayers()
    
    if (!validation.isValid) {
      alert(`Save failed: ${validation.reason}`)
      return
    }

    // Convert batch players to Player type and add them
    players.forEach(player => {
      const newPlayer: Player = {
        playerid: player.id,
        firstName: player.firstName.trim(),
        lastName: player.lastName.trim(),
        commonName: '',
        age: parseInt(player.age),
        overall: parseInt(player.overall),
        potential: parseInt(player.potential),
        position: player.position,
        nationality: player.nationality.trim()
      }
      
      addPlayer(newPlayer)
    })

    // Reset modal to clean slate
    setPlayers([{
      id: highestPlayerID + numPlayersAdded + 1,
      firstName: '',
      lastName: '',
      nationality: '',
      age: '',
      overall: '',
      potential: '',
      position: 'CM'
    }])

    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-screen-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-semibold text-white">Batch Add Players</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-sm font-medium text-gray-300 pb-3 px-2">ID</th>
                  <th className="text-left text-sm font-medium text-gray-300 pb-3 px-2">First Name</th>
                  <th className="text-left text-sm font-medium text-gray-300 pb-3 px-2">Last Name</th>
                  <th className="text-left text-sm font-medium text-gray-300 pb-3 px-2">Nationality</th>
                  <th className="text-left text-sm font-medium text-gray-300 pb-3 px-2">Age</th>
                  <th className="text-left text-sm font-medium text-gray-300 pb-3 px-2">Overall</th>
                  <th className="text-left text-sm font-medium text-gray-300 pb-3 px-2">Potential</th>
                  <th className="text-left text-sm font-medium text-gray-300 pb-3 px-2">Position</th>
                  <th className="text-left text-sm font-medium text-gray-300 pb-3 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="py-3 px-2">
                      <span className="text-gray-400">{player.id}</span>
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="text"
                        value={player.firstName}
                        onChange={(e) => handlePlayerChange(index, 'firstName', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                        placeholder="First name"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="text"
                        value={player.lastName}
                        onChange={(e) => handlePlayerChange(index, 'lastName', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                        placeholder="Last name"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <NationAutocomplete
                        onNationSelect={(nation) => handlePlayerChange(index, 'nationality', nation)}
                        placeholder="Country..."
                        initialValue={player.nationality}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        min="15"
                        max="50"
                        value={player.age}
                        onChange={(e) => handlePlayerChange(index, 'age', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                        placeholder="Age"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={player.overall}
                        onChange={(e) => handlePlayerChange(index, 'overall', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                        placeholder="Overall"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={player.potential}
                        onChange={(e) => handlePlayerChange(index, 'potential', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                        placeholder="Potential"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={player.position}
                        onChange={(e) => handlePlayerChange(index, 'position', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                      >
                        {positions.map(position => (
                          <option key={position} value={position}>{position}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => removePlayerRow(index)}
                        disabled={players.length === 1}
                        className="w-6 h-6 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm transition-colors flex items-center justify-center"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Player Button */}
          <div className="mt-4">
            <button
              onClick={addNewPlayerRow}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              Add Another Player
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-700">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Save Players
          </button>
        </div>
      </div>
    </div>
  )
}

export default BatchAddPlayersModal
