import { useState, useMemo, useCallback } from 'react'
import type { NationInfo } from '../../types/rosterManager'
import { filterPlayers, getRatingColor, getPositionOptions, getAllPositions } from '../../utils/rosterManager'
import { usePlayersStore } from '../../state/GlobalState'
import nationInfo from '../../config/nation_info.json'

const PlayersTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNationality, setSelectedNationality] = useState('All')
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 99])
  const [overallRange, setOverallRange] = useState<[number, number]>([0, 99])
  const [potentialRange, setPotentialRange] = useState<[number, number]>([0, 99])
  const [selectedPositions, setSelectedPositions] = useState<string[]>(() => getAllPositions())
  const [isPositionDropdownOpen, setIsPositionDropdownOpen] = useState(false)

  // Get players data from global state
  const allPlayers = usePlayersStore(state => state.allPlayers)
  const playersByNation = usePlayersStore(state => state.playersByNation)

  // Get all nationalities from global state
  const nationalities = useMemo(() => {
    const nations = Object.keys(playersByNation).sort()
    return ['All', ...nations]
  }, [playersByNation])

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

  const getFlagCode = useMemo(() => {
    const nationData = nationInfo as NationInfo
    return (nationName: string): string => {
      const nation = nationData[nationName]
      return nation ? nation.flagCode : ''
    }
  }, [])

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

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-200 mb-6">Player Viewer</h2>
      
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
              {filteredPlayers.map((player, index) => (
                <tr key={index} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-base text-white">
                    <span className="text-gray-300">{player.firstName} </span>
                    <span className="font-bold text-lg">{player.lastName}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-white">
                    <div className="flex items-center space-x-2">
                      <div className="relative w-6 h-4 overflow-hidden rounded flex items-center justify-center bg-gray-600">
                        {getFlagCode(player.nationality) && (
                          <span
                            className={`fi fi-${getFlagCode(player.nationality)} absolute inset-0`}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results count */}
      <div className="mt-4 text-sm text-gray-400">
        Showing {filteredPlayers.length} of {allPlayers.length} players
      </div>
    </div>
  )
}

export default PlayersTab
