import { useState, useEffect } from 'react'
import { useGlobalStore } from '../../state/GlobalState'
import SquadView from './SquadView'
import NationAutocomplete from './NationAutocomplete'

const RosterTab: React.FC = () => {
  const [selectedNation, setSelectedNation] = useState<string>('')
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [exportMode, setExportMode] = useState<'all' | 'selected'>('all')
  const [selectedNations, setSelectedNations] = useState<string>('')
  const [showToast, setShowToast] = useState<boolean>(false)
  
  const { getSquad, exportAllSquads, exportSelectedSquads, refreshAllSquads } = useGlobalStore()

  const handleNationSelect = (nation: string) => {
    setSelectedNation(nation)
    setIsSearching(false)
  }

  const handleBackToSearch = () => {
    setSelectedNation('')
    setIsSearching(true)
  }

  const handleRefreshAll = () => {
    if (window.confirm('Are you sure you want to refresh all squads? This will regenerate all squad data.')) {
      refreshAllSquads()
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }
  }

  useEffect(() => {
    setIsSearching(true)
  }, [])

  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <div className="w-full max-w-4xl">
          <h2 className="text-2xl font-bold text-green-400 mb-6 text-center">
            Select a Nation
          </h2>
          <NationAutocomplete 
            onNationSelect={handleNationSelect}
            placeholder="Enter country name..."
          />
          
          {/* Export Options and Utilities Panels */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Export Options Panel */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4">Export Options</h3>
              
              {/* Export Mode Selection */}
              <div className="space-y-3 mb-6">
                <label className="flex items-center text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="exportMode"
                    value="all"
                    checked={exportMode === 'all'}
                    onChange={() => setExportMode('all')}
                    className="mr-3 text-green-400 focus:ring-green-400"
                  />
                  <span>Export all squads</span>
                </label>
                
                <label className="flex items-center text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="exportMode"
                    value="selected"
                    checked={exportMode === 'selected'}
                    onChange={() => setExportMode('selected')}
                    className="mr-3 text-green-400 focus:ring-green-400"
                  />
                  <span>Export selected squads</span>
                </label>
              </div>
              
              {/* Selected Nations Input (only show when "selected" mode is chosen) */}
              {exportMode === 'selected' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Enter nations (comma-separated):
                  </label>
                  <textarea
                    value={selectedNations}
                    onChange={(e) => setSelectedNations(e.target.value)}
                    placeholder="e.g., Brazil, Argentina, France"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    rows={3}
                  />
                </div>
              )}
              
              {/* Export Button */}
              <button
                onClick={() => {
                  if (exportMode === 'all') {
                    exportAllSquads()
                  } else {
                    const nations = selectedNations
                      .split(',')
                      .map(n => n.trim())
                      .filter(n => n.length > 0)
                    if (nations.length > 0) {
                      exportSelectedSquads(nations)
                    } else {
                      alert('Please enter at least one nation to export')
                    }
                  }
                }}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                {exportMode === 'all' ? 'Full Export' : 'Export'}
              </button>
            </div>

            {/* Utilities Panel */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4">Utilities</h3>
              
              {/* Refresh All Button */}
              <button
                onClick={handleRefreshAll}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Refresh All
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {showToast && (
            <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out">
              All Squads Are Refreshed
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!selectedNation) {
    return null
  }

  const squad = getSquad(selectedNation)

  return (
    <div className="h-full">
      {/* Header with back button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToSearch}
            className="text-green-400 hover:text-green-300 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Search
          </button>
          <h2 className="text-2xl font-bold text-green-400">
            {selectedNation} Squad
          </h2>
        </div>
      </div>

      {/* Squad View */}
      {squad ? (
        <SquadView squad={squad} nation={selectedNation} />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No squad available for {selectedNation}</p>
          <p className="text-gray-500 text-sm mt-2">This nation may not have enough players to form a complete squad.</p>
        </div>
      )}
    </div>
  )
}

export default RosterTab
