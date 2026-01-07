import { useState, useEffect } from 'react'
import type { Player } from '../../types/rosterManager'
import { useGlobalStore } from '../../state/GlobalState'
import { getRatingColor } from '../../utils/rosterManager'
import NationAutocomplete from './NationAutocomplete'

interface PlayerViewModalProps {
  player: Player | null
  isOpen: boolean
  onClose: () => void
  prefillNationality?: string
}

const PlayerViewModal: React.FC<PlayerViewModalProps> = ({ player, isOpen, onClose, prefillNationality }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedPlayer, setEditedPlayer] = useState<Player>(player || {
    playerid: 0,
    firstName: 'First',
    lastName: 'Last',
    commonName: '',
    age: 16,
    overall: 50,
    potential: 50,
    position: 'CM',
    nationality: prefillNationality || ''
  })
  const updatePlayer = useGlobalStore(state => state.updatePlayer)
  const addPlayer = useGlobalStore(state => state.addPlayer)
  const highestPlayerID = useGlobalStore(state => state.highestPlayerID)
  const numPlayersAdded = useGlobalStore(state => state.numPlayersAdded)

  // Calculate prospective player ID for new players
  const prospectivePlayerId = player === null ? highestPlayerID + numPlayersAdded + 1 : player.playerid

  // Available positions
  const positions = ['GK', 'CB', 'LB', 'RB', 'CM', 'CAM', 'CDM', 'RM', 'LM', 'RW', 'LW', 'ST']

  // Set editing mode based on whether we're adding or editing
  useEffect(() => {
    if (player === null) {
      // Add player mode - start in edit mode with pre-filled nationality
      setIsEditing(true)
      setEditedPlayer(prev => ({
        ...prev,
        nationality: prefillNationality || ''
      }))
    } else {
      // Edit player mode - start with player data
      setEditedPlayer(player)
      setIsEditing(false)
    }
  }, [player, highestPlayerID, numPlayersAdded, prefillNationality])

  if (!isOpen) return null

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset to original player data
      setEditedPlayer(player || {
        playerid: prospectivePlayerId,
        firstName: 'First',
        lastName: 'Last',
        commonName: '',
        age: 16,
        overall: 50,
        potential: 50,
        position: 'CM',
        nationality: prefillNationality || ''
      })
    }
    setIsEditing(!isEditing)
  }

  const handleSave = () => {
    // Validation: ensure required fields are filled
    if (!editedPlayer.firstName.trim() || 
        !editedPlayer.lastName.trim() || 
        !editedPlayer.age || 
        !editedPlayer.potential || 
        !editedPlayer.overall || 
        !editedPlayer.nationality.trim()) {
      alert('Please fill in all required fields: First Name, Last Name, Age, Potential, Overall, and Nationality')
      return
    }

    if (player === null) {
      // Add new player
      const { playerid, ...playerData } = editedPlayer
      addPlayer(playerData)
    } else {
      // Update existing player
      updatePlayer(player.playerid, editedPlayer)
    }
    
    setIsEditing(false)
    onClose()
  }

  const handleInputChange = (field: keyof Player, value: string | number) => {
    setEditedPlayer(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Player Details</h2>
          <div className="flex items-center gap-3">
            {isEditing && (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Save
              </button>
            )}
            <button
              onClick={handleEditToggle}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isEditing 
                  ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
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

        {/* Player Info */}
        <div className="space-y-4">
          {/* Name Section */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedPlayer.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                ) : (
                  <p className="text-white text-lg">{editedPlayer.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedPlayer.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                ) : (
                  <p className="text-white text-lg font-bold">{editedPlayer.lastName}</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Common Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedPlayer.commonName}
                  onChange={(e) => handleInputChange('commonName', e.target.value)}
                  placeholder="Optional common name"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              ) : (
                <p className="text-white text-lg font-bold">
                  {editedPlayer.commonName || <span className="text-gray-400 italic">No common name</span>}
                </p>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
              {isEditing ? (
                <input
                  type="number"
                  min="15"
                  max="50"
                  value={editedPlayer.age}
                  onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              ) : (
                <p className="text-white text-xl font-bold">{editedPlayer.age}</p>
              )}
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Overall</label>
              {isEditing ? (
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={editedPlayer.overall}
                  onChange={(e) => handleInputChange('overall', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              ) : (
                <span className={`inline-block px-3 py-1 rounded font-medium text-lg ${getRatingColor(editedPlayer.overall).bg} ${getRatingColor(editedPlayer.overall).text}`}>
                  {editedPlayer.overall}
                </span>
              )}
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Potential</label>
              {isEditing ? (
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={editedPlayer.potential}
                  onChange={(e) => handleInputChange('potential', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              ) : (
                <span className={`inline-block px-3 py-1 rounded font-medium text-lg ${getRatingColor(editedPlayer.potential).bg} ${getRatingColor(editedPlayer.potential).text}`}>
                  {editedPlayer.potential}
                </span>
              )}
            </div>
          </div>

          {/* Position and Nationality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
              {isEditing ? (
                <select
                  value={editedPlayer.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  {positions.map(position => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
              ) : (
                <p className="text-white text-xl font-bold">{editedPlayer.position}</p>
              )}
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Nationality</label>
              {isEditing ? (
                <NationAutocomplete
                  onNationSelect={(nation) => handleInputChange('nationality', nation)}
                  placeholder="Enter country name..."
                  initialValue={editedPlayer.nationality}
                />
              ) : (
                <p className="text-white text-xl font-bold">{editedPlayer.nationality}</p>
              )}
            </div>
          </div>

          {/* Player ID (read-only) */}
          <div className="bg-gray-700 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Player ID</label>
            <p className="text-gray-400">{prospectivePlayerId}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerViewModal
