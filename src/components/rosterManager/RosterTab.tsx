import { useState, useEffect } from 'react'
import { useGlobalStore } from '../../state/GlobalState'
import SquadView from './SquadView'
import NationAutocomplete from './NationAutocomplete'

const RosterTab: React.FC = () => {
  const [selectedNation, setSelectedNation] = useState<string>('')
  const [isSearching, setIsSearching] = useState<boolean>(false)
  
  const { getSquad } = useGlobalStore()

  const handleNationSelect = (nation: string) => {
    setSelectedNation(nation)
    setIsSearching(false)
  }

  const handleBackToSearch = () => {
    setSelectedNation('')
    setIsSearching(true)
  }

  useEffect(() => {
    setIsSearching(true)
  }, [])

  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-green-400 mb-6 text-center">
            Select a Nation
          </h2>
          <NationAutocomplete 
            onNationSelect={handleNationSelect}
            placeholder="Enter country name..."
          />
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
