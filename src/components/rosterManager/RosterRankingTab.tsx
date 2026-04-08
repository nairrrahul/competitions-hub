import { useState, useMemo } from 'react'
import { useGlobalStore } from '../../state/GlobalState'
import MatchFlag from '../competitionSimulator/MatchFlag'
import { calculateTeamRating, caluclateTeamPositionRatingSum } from '../../utils/RankingPts'
import { getRatingColor } from '../../utils/rosterManager'

const CONFEDERATIONS = ["All", "AFC", "CAF", "CONCACAF", "CONMEBOL", "OFC", "UEFA"]

interface TeamRankingData {
  nation: string
  overallRating: number
  defRating: number
  midRating: number
  atkRating: number
  confederation: string
}

const RosterRankingTab: React.FC = () => {
  const squads = useGlobalStore(state => state.squads)
  const nationInfo = useGlobalStore(state => state.nationInfo)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedConfederation, setSelectedConfederation] = useState("All")

  // Calculate rankings for all teams
  const teamRankings = useMemo(() => {
    const rankings: TeamRankingData[] = []
    
    Object.entries(squads).forEach(([nation, squad]) => {
      const [defRating, midRating, atkRating] = caluclateTeamPositionRatingSum(squad)
      const overallRating = calculateTeamRating(squad)
      const confederation = nationInfo[nation]?.confederationID || "Unknown"
      
      rankings.push({
        nation,
        overallRating,
        defRating: defRating / squad.starters.defenders.length,
        midRating: midRating / squad.starters.midfielders.length,
        atkRating: atkRating / squad.starters.forwards.length,
        confederation
      })
    })
    
    // Sort by overall rating (descending)
    return rankings.sort((a, b) => b.overallRating - a.overallRating)
  }, [squads, nationInfo])

  // Create a map of original rankings for each country
  const rankingMap = useMemo(() => {
    const map: { [key: string]: number } = {}
    teamRankings.forEach((team, index) => {
      map[team.nation] = index + 1
    })
    return map
  }, [teamRankings])

  // Filter based on search and confederation (but keep original rankings)
  const filteredRankings = useMemo(() => {
    return teamRankings.filter(team => {
      const matchesSearch = team.nation.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesConfederation = selectedConfederation === "All" || team.confederation === selectedConfederation
      return matchesSearch && matchesConfederation
    })
  }, [teamRankings, searchTerm, selectedConfederation])

  return (
    <div className="w-full">
      {/* Filter Bar */}
      <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search Country</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter country name..."
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

          {/* Confederation Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Confederation</label>
            <select
              value={selectedConfederation}
              onChange={(e) => setSelectedConfederation(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            >
              {CONFEDERATIONS.map(conf => (
                <option key={conf} value={conf}>{conf}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-900/50">
                <th className="text-center py-3 px-4 font-semibold text-green-400 w-16">Rank</th>
                <th className="text-left py-3 px-4 font-semibold text-green-400">Country</th>
                <th className="text-center py-3 px-4 font-semibold text-green-400">Overall</th>
                <th className="text-center py-3 px-4 font-semibold text-green-400">ATK</th>
                <th className="text-center py-3 px-4 font-semibold text-green-400">MID</th>
                <th className="text-center py-3 px-4 font-semibold text-green-400">DEF</th>
              </tr>
            </thead>
            <tbody>
              {filteredRankings.map((team) => (
                <tr
                  key={team.nation}
                  className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors"
                >
                  <td className="py-3 px-4 text-center text-green-200 font-bold">
                    {rankingMap[team.nation]}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <MatchFlag countryName={team.nation} w={12} h={8} s={2.3}/>
                      <span className="text-white font-medium">{team.nation}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-3 py-2 rounded text-base font-medium ${getRatingColor(team.overallRating).bg} ${getRatingColor(team.overallRating).text}`}>
                        {team.overallRating.toFixed(0)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-3 py-2 rounded font-medium ${getRatingColor(team.atkRating).bg} ${getRatingColor(team.atkRating).text}`}>
                        {team.atkRating.toFixed(0)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-3 py-2 rounded font-medium ${getRatingColor(team.midRating).bg} ${getRatingColor(team.midRating).text}`}>
                        {team.midRating.toFixed(0)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-3 py-2 rounded font-medium ${getRatingColor(team.defRating).bg} ${getRatingColor(team.defRating).text}`}>
                        {team.defRating.toFixed(0)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Teams Count */}
        <div className="px-4 py-3 bg-gray-900/50 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            Showing {filteredRankings.length} of {teamRankings.length} teams
          </div>
        </div>
      </div>
    </div>
  )
}

export default RosterRankingTab