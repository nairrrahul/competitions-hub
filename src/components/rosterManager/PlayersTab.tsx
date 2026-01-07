import { useState, useMemo, useCallback } from 'react'
import { filterPlayers, getPositionOptions, getAllPositions } from '../../utils/rosterManager'
import { useGlobalStore } from '../../state/GlobalState'
import PlayerRow from './PlayerRow'
import PlayerViewModal from './PlayerViewModal'
import type { Player } from '../../types/rosterManager'

const PlayersTab: React.FC = () => {
  const { addPlayer } = useGlobalStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNationality, setSelectedNationality] = useState('All')
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 99])
  const [overallRange, setOverallRange] = useState<[number, number]>([0, 99])
  const [potentialRange, setPotentialRange] = useState<[number, number]>([0, 99])
  const [selectedPositions, setSelectedPositions] = useState<string[]>(() => getAllPositions())
  const [isPositionDropdownOpen, setIsPositionDropdownOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false)
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false)

  // Get players data from global state
  const allPlayers = useGlobalStore(state => state.allPlayers)
  const getNationFlagCode = useGlobalStore(state => state.getNationFlagCode)

  // Get all nationalities from global state
  const nationalities = useMemo(() => {
    const allNations = useGlobalStore.getState().getAllNationalities()
    return ['All', ...allNations]
  }, [])

  // Get position options
  const positionOptions = useMemo(() => {
    return getPositionOptions()
  }, [])

  // Filter players based on all criteria
  const filteredPlayers = useMemo(() => {
    return filterPlayers(
      allPlayers,
      searchTerm,
      selectedNationality,
      ageRange,
      overallRange,
      potentialRange,
      selectedPositions
    )
  }, [allPlayers, searchTerm, selectedNationality, ageRange, overallRange, potentialRange, selectedPositions])

  // Optimized checkbox handlers
  const handlePositionToggle = useCallback((position: string, isChecked: boolean) => {
    setSelectedPositions(prev => 
      isChecked 
        ? [...prev, position]
        : prev.filter(p => p !== position)
    )
  }, [])

  const handleDropdownToggle = useCallback(() => {
    setIsPositionDropdownOpen(prev => !prev)
  }, [])

  const handlePlayerClick = useCallback((player: Player) => {
    setSelectedPlayer(player)
    setIsPlayerModalOpen(true)
  }, [])

  const handlePlayerModalClose = useCallback(() => {
    setIsPlayerModalOpen(false)
    setSelectedPlayer(null)
  }, [])

  const handleAddPlayer = useCallback(() => {
    setSelectedPlayer(null)
    setIsAddPlayerModalOpen(true)
  }, [])

  const handleAddPlayerModalClose = useCallback(() => {
    setIsAddPlayerModalOpen(false)
    setSelectedPlayer(null)
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-200">Player Viewer</h2>
        <button 
          onClick={handleAddPlayer}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          Add Player
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Player name..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Nationality */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nationality</label>
            <select
              value={selectedNationality}
              onChange={(e) => setSelectedNationality(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            >
              {nationalities.map(nation => (
                <option key={nation} value={nation}>{nation}</option>
              ))}
            </select>
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Age: {ageRange[0]} - {ageRange[1]}
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                min="0"
                max="99"
                value={ageRange[0]}
                onChange={(e) => setAgeRange([parseInt(e.target.value) || 0, ageRange[1]])}
                className="w-1/2 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <input
                type="number"
                min="0"
                max="99"
                value={ageRange[1]}
                onChange={(e) => setAgeRange([ageRange[0], parseInt(e.target.value) || 99])}
                className="w-1/2 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>

          {/* Overall */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Overall: {overallRange[0]} - {overallRange[1]}
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                min="0"
                max="99"
                value={overallRange[0]}
                onChange={(e) => setOverallRange([parseInt(e.target.value) || 0, overallRange[1]])}
                className="w-1/2 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <input
                type="number"
                min="0"
                max="99"
                value={overallRange[1]}
                onChange={(e) => setOverallRange([overallRange[0], parseInt(e.target.value) || 99])}
                className="w-1/2 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>

          {/* Potential */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Potential: {potentialRange[0]} - {potentialRange[1]}
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                min="0"
                max="99"
                value={potentialRange[0]}
                onChange={(e) => setPotentialRange([parseInt(e.target.value) || 0, potentialRange[1]])}
                className="w-1/2 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <input
                type="number"
                min="0"
                max="99"
                value={potentialRange[1]}
                onChange={(e) => setPotentialRange([potentialRange[0], parseInt(e.target.value) || 99])}
                className="w-1/2 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>

          {/* Position */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">Positions</label>
            <button
              onClick={handleDropdownToggle}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-left"
            >
              {selectedPositions.length === 0 ? 'All Positions' : `${selectedPositions.length} selected`}
            </button>
            
            {/* Dropdown */}
            {isPositionDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-gray-700 border border-gray-600 rounded-md max-h-60 overflow-y-auto">
                {positionOptions.map(({ group, positions }) => (
                  <div key={group} className="border-b border-gray-600 last:border-b-0">
                    {/* Group header - separator only */}
                    <div className="px-3 py-2 bg-gray-600">
                      <span className="text-sm font-medium text-white">{group}</span>
                    </div>
                    
                    {/* Individual positions */}
                    {positions.map(position => (
                      <div key={position} className="px-6 py-1">
                        <label className="flex items-center text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={selectedPositions.includes(position)}
                            onChange={(e) => handlePositionToggle(position, e.target.checked)}
                            className="mr-2 rounded border-gray-500 bg-gray-600 text-green-400 focus:ring-green-400"
                          />
                          {position}
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700 border-b border-gray-600">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">NAME</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">NAT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">AGE</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">OVR</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">POT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">POS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredPlayers.map((player) => (
                <PlayerRow
                  key={player.playerid}
                  player={player}
                  getNationFlagCode={getNationFlagCode}
                  onPlayerClick={handlePlayerClick}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results count */}
      <div className="mt-4 text-sm text-gray-400">
        Showing {filteredPlayers.length} of {allPlayers.length} players
      </div>

      {/* Player View Modal */}
      {selectedPlayer && (
        <PlayerViewModal
          player={selectedPlayer}
          isOpen={isPlayerModalOpen}
          onClose={handlePlayerModalClose}
        />
      )}

      {/* Add Player Modal */}
      {isAddPlayerModalOpen && (
        <PlayerViewModal
          player={null}
          isOpen={isAddPlayerModalOpen}
          onClose={handleAddPlayerModalClose}
        />
      )}
    </div>
  )
}

export default PlayersTab
