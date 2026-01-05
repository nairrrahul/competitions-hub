import { useState } from 'react'
import { Link } from 'react-router-dom'
import PlayersTab from '../components/rosterManager/PlayersTab'

const RosterManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'players' | 'roster'>('players')

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-green-400 hover:text-green-300 mr-6">
                ← Back to Home
              </Link>
              <h1 className="text-xl font-bold text-green-400">Roster Manager</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <div className="px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('players')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'players'
                  ? 'border-green-400 text-green-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Players
            </button>
            <button
              disabled
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-not-allowed ${
                activeTab === 'roster'
                  ? 'border-green-400 text-green-400'
                  : 'border-transparent text-gray-500'
              }`}
            >
              Roster
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'players' && <PlayersTab />}
      </div>
    </div>
  )
}

export default RosterManager
