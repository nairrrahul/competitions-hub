import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { useGlobalStore } from "../state/GlobalState";
import MatchFlag from "../components/competitionSimulator/MatchFlag";
import type { NationInfo } from "../types/rosterManager";

const CONFEDERATIONS = ["All", "AFC", "CAF", "CONCACAF", "CONMEBOL", "OFC", "UEFA"];

const DataEditor: React.FC = () => {
  const nationInfo = useGlobalStore(state => state.nationInfo);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConfederation, setSelectedConfederation] = useState("All");

  // Sort nations by ranking points (descending) - keeps original ranking indices
  const sortedNations = useMemo(() => {
    return Object.entries(nationInfo as NationInfo)
      .sort(([, a], [, b]) => (b.rankingPts || 0) - (a.rankingPts || 0));
  }, [nationInfo]);

  // Create a map of original rankings for each country
  const rankingMap = useMemo(() => {
    const map: { [key: string]: number } = {};
    sortedNations.forEach(([countryName], index) => {
      map[countryName] = index + 1;
    });
    return map;
  }, [sortedNations]);

  // Filter based on search and confederation (but keep original rankings)
  const filteredNations = useMemo(() => {
    return sortedNations.filter(([countryName, info]) => {
      const matchesSearch = countryName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesConfederation = selectedConfederation === "All" || info.confederationID === selectedConfederation;
      return matchesSearch && matchesConfederation;
    });
  }, [sortedNations, searchTerm, selectedConfederation]);

  const { updateNationInfo } = useGlobalStore();

  const handleExportData = () => {
    const jsonString = JSON.stringify(nationInfo, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nationInfo.nt.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const handleImportAllData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.nt.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedData = JSON.parse(text) as NationInfo;

        // Update each country in nationInfo with imported data
        Object.entries(importedData).forEach(([countryName, importedInfo]) => {
          if (nationInfo[countryName]) {
            // Merge imported data (rankingPts and confederationID) with existing data
            const updatedInfo = {
              ...nationInfo[countryName],
              rankingPts: importedInfo.rankingPts,
              confederationID: importedInfo.confederationID
            };
            updateNationInfo(countryName, updatedInfo);
          }
        });

        // Show success message
        console.log('Nation info imported successfully');
      } catch (error) {
        console.error('Error importing nation info:', error);
      }
    };
    input.click();
  };

  const handleImportRankingDeltas = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.delta.json'; 
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const rankingDeltas = JSON.parse(text) as { [countryName: string]: number };

        // Apply ranking deltas to valid countries
        Object.entries(rankingDeltas).forEach(([countryName, delta]) => {
          if (nationInfo[countryName]) {
            const currentInfo = nationInfo[countryName];
            const newRankingPts = currentInfo.rankingPts + parseFloat(delta.toFixed(2));
            const updatedInfo = {
              ...currentInfo,
              rankingPts: newRankingPts
            };
            updateNationInfo(countryName, updatedInfo);
          }
        });

        // Show success message
        console.log('Ranking deltas imported successfully');
      } catch (error) {
        console.error('Error importing ranking deltas:', error);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
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
              <h1 className="text-xl font-bold text-green-400">Data Editor</h1>
              <span className="ml-3 text-sm text-gray-400">Edit Team Data</span>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-6 py-6">
        {/* World Ranking Section */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          {/* Header with Title and Buttons */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-green-400">World Ranking</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportData}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
              >
                Export Data
              </button>
              <button
                onClick={handleImportAllData}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
              >
                Import All Data
              </button>
              <button
                onClick={handleImportRankingDeltas}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium"
              >
                Import Ranking Deltas
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6 border border-gray-600">
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-center text-lg py-3 px-4 font-semibold text-green-400 w-16">Ranking</th>
                  <th className="text-left text-lg py-3 px-4 font-semibold text-green-400">Country</th>
                  <th className="text-left text-lg py-3 px-4 font-semibold text-green-400">Confederation</th>
                  <th className="text-right text-lg py-3 px-4 font-semibold text-green-400">Ranking Points</th>
                </tr>
              </thead>
              <tbody>
                {filteredNations.map(([countryName, info]) => (
                  <tr
                    key={countryName}
                    className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-green-200 font-bold">{rankingMap[countryName]}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <MatchFlag countryName={countryName} w={12} h={8} s={2.3}/>
                        <span className="text-white text-lg font-medium">{countryName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{info.confederationID}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-green-200 text-base font-medium">{info.rankingPts.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Countries Count */}
          <div className="mt-4 text-sm text-gray-400">
            Showing {filteredNations.length} of {sortedNations.length} countries
          </div>
        </div>
      </main>
    </div>
  );
};

export default DataEditor;