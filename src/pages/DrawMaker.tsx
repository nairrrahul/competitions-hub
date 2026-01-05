import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import TeamSelectionTab from '../components/drawMaker/TeamSelectionTab'
import DrawSimulationTab from '../components/drawMaker/DrawSimulationTab'

// Types for team data
interface TeamSlot {
  id: string;
  name: string;
  flagCode: string;
  isSelected?: boolean;
  isHost?: boolean;
}

interface TeamData {
  presetType: 'manual' | 'confederation' | 'competition';
  selectedCompetition: string;
  selectedConfederation: string;
  manualTeams: number;
  manualGroups: number;
  confederationGroups: number;
  teamSlots: TeamSlot[];
}

const DrawMaker: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'team-selection' | 'draw-simulation'>('team-selection')
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [canAccessDrawSimulator, setCanAccessDrawSimulator] = useState(false)
  const teamSelectionRef = useRef<{ getCurrentTeamData: () => TeamData | null }>(null)

  const handleMoveToDrawSimulator = (data: TeamData) => {
    setTeamData(data)
    setCanAccessDrawSimulator(true)
    setActiveTab('draw-simulation')
  }

  const handleValidationUpdate = (canAccess: boolean) => {
    setCanAccessDrawSimulator(canAccess)
  }

  // Get current team data and navigate when Draw Simulator tab is clicked
  const handleTabNavigation = () => {
    if (canAccessDrawSimulator && teamSelectionRef.current) {
      const currentData = teamSelectionRef.current.getCurrentTeamData()
      if (currentData) {
        handleMoveToDrawSimulator(currentData)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation Header */}
      <header className="bg-gray-800 border-b border-gray-700 w-full">
        <div className="w-full px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/"
                className="text-green-400 hover:text-green-300 transition-colors mr-4 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </Link>
              <h1 className="text-xl font-bold text-green-400">Draw Maker</h1>
              <span className="ml-3 text-sm text-gray-400">Soccer Competition Draw Simulator</span>
            </div>
            
            {/* Tab Navigation */}
            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveTab('team-selection')}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === 'team-selection'
                    ? 'bg-gray-900 text-green-400 border-b-2 border-green-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                Team Selection
              </button>
              <button
                onClick={handleTabNavigation}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  canAccessDrawSimulator
                    ? activeTab === 'draw-simulation'
                      ? 'bg-gray-900 text-green-400 border-b-2 border-green-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                disabled={!canAccessDrawSimulator}
              >
                Draw Simulator
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {activeTab === 'team-selection' && (
          <TeamSelectionTab 
            ref={teamSelectionRef}
            onMoveToDrawSimulator={handleMoveToDrawSimulator}
            onValidationUpdate={handleValidationUpdate}
            initialData={teamData}
          />
        )}
        {activeTab === 'draw-simulation' && (
          <DrawSimulationTab 
            teamData={teamData}
          />
        )}
      </main>
    </div>
  )
}

export default DrawMaker
