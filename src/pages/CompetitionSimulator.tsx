import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MatchSchedulerTab from '../components/competitionSimulator/MatchSchedulerTab';
import SimulatorTab from '../components/competitionSimulator/SimulatorTab';
import type { CompetitionSchedule } from '../utils/SchedulerUtils';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  groups: { [key: string]: string[] };
}

const CompetitionSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'match-scheduler' | 'simulator'>('match-scheduler');
  const [canAccessSimulator, setCanAccessSimulator] = useState(false);
  
  // Competition state moved here for persistence
  const [importedCompetition, setImportedCompetition] = useState<ImportedCompetition | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'teams' | 'matches'>('teams');
  const [matchSchedule, setMatchSchedule] = useState<CompetitionSchedule | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [currentMatchday, setCurrentMatchday] = useState(1);
  const [totalMatchdays, setTotalMatchdays] = useState(0);

  const handleTabNavigation = () => {
    if (canAccessSimulator) {
      setActiveTab('simulator');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
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
              <h1 className="text-xl font-bold text-green-400">Competition Simulator</h1>
            </div>
            
            {/* Tab Navigation */}
            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveTab('match-scheduler')}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === 'match-scheduler'
                    ? 'bg-gray-900 text-green-400 border-b-2 border-green-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                Match Scheduler
              </button>
              <button
                onClick={handleTabNavigation}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  canAccessSimulator
                    ? activeTab === 'simulator'
                      ? 'bg-gray-900 text-green-400 border-b-2 border-green-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                disabled={!canAccessSimulator}
              >
                Simulator
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Match Scheduler Tab */}
        {activeTab === 'match-scheduler' && (
          <MatchSchedulerTab 
            onValidationUpdate={setCanAccessSimulator}
            importedCompetition={importedCompetition}
            setImportedCompetition={setImportedCompetition}
            importError={importError}
            setImportError={setImportError}
            viewMode={viewMode}
            setViewMode={setViewMode}
            matchSchedule={matchSchedule}
            setMatchSchedule={setMatchSchedule}
            expandedGroups={expandedGroups}
            setExpandedGroups={setExpandedGroups}
            currentMatchday={currentMatchday}
            setCurrentMatchday={setCurrentMatchday}
            totalMatchdays={totalMatchdays}
            setTotalMatchdays={setTotalMatchdays}
          />
        )}

        {/* Simulator Tab */}
        {activeTab === 'simulator' && (
          <SimulatorTab hasData={canAccessSimulator} />
        )}
      </main>
    </div>
  );
};

export default CompetitionSimulator;
