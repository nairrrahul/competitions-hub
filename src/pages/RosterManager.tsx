import { useState } from 'react'
import { Link } from 'react-router-dom'
import PlayersTab from '../components/rosterManager/PlayersTab'

const RosterManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'players' | 'roster'>('players')

  return (
    <div className="min-h-screen bg-gray-900 text-white">
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
              <h1 className="text-xl font-bold text-green-400">Roster Manager</h1>
              <span className="ml-3 text-sm text-gray-400">Team Roster Management</span>
            </div>
            
            {/* Tab Navigation */}
            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveTab('players')}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === 'players'
                    ? 'bg-gray-900 text-green-400 border-b-2 border-green-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                Players
              </button>
              <button
                disabled
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === 'roster'
                    ? 'bg-gray-900 text-green-400 border-b-2 border-green-400'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                Roster
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <div className="p-6">
          {activeTab === 'players' && <PlayersTab />}
        </div>
      </main>
    </div>
  )
}

export default RosterManager
