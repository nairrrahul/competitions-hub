import { useState, useMemo, useCallback, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { filterPlayers, getPositionOptions, getAllPositions } from '../../utils/rosterManager'
import { useGlobalStore } from '../../state/GlobalState'
import PlayerViewModal from './PlayerViewModal'
import BatchAddPlayersModal from './BatchAddPlayersModal'
import PlayerRow from './PlayerRow'
import type { Player } from '../../types/rosterManager'

const PlayersTab: React.FC = () => {

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
  const [isBatchAddModalOpen, setIsBatchAddModalOpen] = useState(false)
  const [showToast, setShowToast] = useState('')
  const [ageYears, setAgeYears] = useState(1)

  // Get players data from global state
  const allPlayers = useGlobalStore(state => state.allPlayers)
  const getNationFlagCode = useGlobalStore(state => state.getNationFlagCode)
  const { exportAllPlayers, importAllPlayers, revertToOriginalData, ageAllPlayers } = useGlobalStore()

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

  const handleBatchAddPlayers = useCallback(() => {
    setIsBatchAddModalOpen(true)
  }, [])

  const handleBatchAddModalClose = useCallback(() => {
    setIsBatchAddModalOpen(false)
  }, [])

  const handleImportPlayers = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          await importAllPlayers(file)
          setShowToast('Players imported successfully')
          setTimeout(() => setShowToast(''), 3000)
        } catch (error) {
          alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }
    input.click()
  }, [importAllPlayers])

  const handleExportPlayers = useCallback(() => {
    exportAllPlayers()
  }, [exportAllPlayers])

  const handleRevertToOriginal = useCallback(() => {
    if (window.confirm('Are you sure you want to revert to original data? This will undo all changes made to players and squads.')) {
      revertToOriginalData()
      setShowToast('Reverted to original data')
      setTimeout(() => setShowToast(''), 3000)
    }
  }, [revertToOriginalData])

  const handleAgePlayers = useCallback(() => {
    if (window.confirm(`Are you sure you want to age all players by ${ageYears} year(s)? This will modify player ages and overall ratings, and regenerate all squads.`)) {
      ageAllPlayers(ageYears)
      setShowToast(`All players aged by ${ageYears} year(s)`)
      setTimeout(() => setShowToast(''), 3000)
    }
  }, [ageYears, ageAllPlayers])

  // Virtual scrolling setup
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: filteredPlayers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height in pixels
    overscan: 10,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-200">Player Viewer</h2>
        <div className="flex flex-col gap-2 items-end">
          <div className="flex gap-2">
            <button 
              onClick={handleImportPlayers}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              Import All Players
            </button>
            <button 
              onClick={handleExportPlayers}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
            >
              Export All Players
            </button>
            <button 
              onClick={handleRevertToOriginal}
              className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm"
            >
              Revert to Original
            </button>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-300">Years:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={ageYears}
                onChange={(e) => setAgeYears(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="w-16 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button 
                onClick={handleAgePlayers}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Age Players
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleAddPlayer}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Add Player
            </button>
            <button 
              onClick={handleBatchAddPlayers}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
            >
              Batch Add Players
            </button>
          </div>
        </div>
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
        <div 
          ref={parentRef}
          className="overflow-y-auto"
          style={{ height: '600px' }} // Fixed height for virtual scrolling
        >
          {/* Header */}
          <div className="sticky top-0 bg-gray-700 z-10 border-b border-gray-600 flex">
            <div className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider flex-2">NAME</div>
            <div className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider flex-2">NAT</div>
            <div className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider flex-1">AGE</div>
            <div className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider flex-1">OVR</div>
            <div className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider flex-1">POT</div>
            <div className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider flex-1">POS</div>
          </div>

          {/* Virtualized Body */}
          <div 
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const player = filteredPlayers[virtualItem.index]
              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <PlayerRow
                    player={player}
                    getNationFlagCode={getNationFlagCode}
                    onPlayerClick={handlePlayerClick}
                  />
                </div>
              )
            })}
          </div>
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
          prefillNationality={selectedNationality === 'All' ? '' : selectedNationality}
        />
      )}

      {/* Batch Add Players Modal */}
      <BatchAddPlayersModal
        isOpen={isBatchAddModalOpen}
        onClose={handleBatchAddModalClose}
      />

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out">
          {showToast}
        </div>
      )}
    </div>
  )
}

export default PlayersTab
