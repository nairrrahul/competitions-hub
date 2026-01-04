import React from 'react';
import nationInfo from '../../config/nation_info.json';
import { GroupStageMatchScheduler, supportsGroupStage, shouldUseHomeAway, getTotalMatchdays } from '../../utils/SchedulerUtils';
import type { CompetitionSchedule } from '../../utils/SchedulerUtils';
import TeamsView from './TeamsView';
import MatchesView from './MatchesView';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  groups: { [key: string]: string[] };
}

interface MatchSchedulerTabProps {
  onValidationUpdate: (canAccess: boolean) => void;
  importedCompetition: ImportedCompetition | null;
  setImportedCompetition: React.Dispatch<React.SetStateAction<ImportedCompetition | null>>;
  importError: string | null;
  setImportError: React.Dispatch<React.SetStateAction<string | null>>;
  viewMode: 'teams' | 'matches';
  setViewMode: React.Dispatch<React.SetStateAction<'teams' | 'matches'>>;
  matchSchedule: CompetitionSchedule | null;
  setMatchSchedule: React.Dispatch<React.SetStateAction<CompetitionSchedule | null>>;
  expandedGroups: Set<string>;
  setExpandedGroups: React.Dispatch<React.SetStateAction<Set<string>>>;
  currentMatchday: number;
  setCurrentMatchday: React.Dispatch<React.SetStateAction<number>>;
  totalMatchdays: number;
  setTotalMatchdays: React.Dispatch<React.SetStateAction<number>>;
}

const MatchSchedulerTab: React.FC<MatchSchedulerTabProps> = ({
  onValidationUpdate,
  importedCompetition,
  setImportedCompetition,
  importError,
  setImportError,
  viewMode,
  setViewMode,
  matchSchedule,
  setMatchSchedule,
  expandedGroups,
  setExpandedGroups,
  currentMatchday,
  setCurrentMatchday,
  totalMatchdays,
  setTotalMatchdays
}) => {

  const handleImportInfo = () => {
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);

          // Validate required fields
          const requiredFields = ['compName', 'numTeams', 'numThrough', 'compType'];
          const missingFields = requiredFields.filter(field => !(field in data));
          
          if (missingFields.length > 0) {
            setImportError(`Import failed: Missing required fields: ${missingFields.join(', ')}`);
            setImportedCompetition(null);
            setMatchSchedule(null);
            onValidationUpdate(false);
            return;
          }

          // Validate competition type supports group stage
          if (!supportsGroupStage(data.compType)) {
            setImportError('Import failed: Competition type does not support group stage scheduling');
            setImportedCompetition(null);
            setMatchSchedule(null);
            onValidationUpdate(false);
            return; 
          }

          // Validate groups
          if (!data.groups || typeof data.groups !== 'object') {
            setImportError('Import failed: Invalid or missing groups data');
            setImportedCompetition(null);
            setMatchSchedule(null);
            onValidationUpdate(false);
            return;
          }

          // Schedule matches
          const isHA = shouldUseHomeAway(data.compType);
          const schedule = GroupStageMatchScheduler(data.groups, isHA);
          
          // Calculate total matchdays
          const maxMatchday = getTotalMatchdays(schedule);

          // Success
          setImportedCompetition(data);
          setMatchSchedule(schedule);
          setTotalMatchdays(maxMatchday);
          setCurrentMatchday(1);
          setImportError(null);
          onValidationUpdate(true);
          
        } catch (error) {
          setImportError('Import failed: Invalid JSON file');
          setImportedCompetition(null);
          setMatchSchedule(null);
          onValidationUpdate(false);
        }
      };

      reader.readAsText(file);
    };

    fileInput.click();
  };

  return (
    <div className="w-full mt-6">
      {/* Header with Import Button */}
      <div className="mb-8 flex justify-between items-center px-8">
        <div>
          <h2 className="text-2xl font-bold text-green-400 mb-2">Match Scheduler</h2>
          <p className="text-gray-400">Schedule and manage competition matches</p>
        </div>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
          onClick={handleImportInfo}
        >
          Import & Schedule
        </button>
      </div>

      {/* Full Width Content Area */}
      <div className="px-8">
        {/* Error Message */}
        {importError && (
          <div className="mb-6 bg-red-900 border border-red-700 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-300 font-medium">{importError}</span>
            </div>
          </div>
        )}

        {/* Competition Info */}
        {importedCompetition && (
          <div className="mb-6 bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-green-400">{importedCompetition.compName}</h3>
              
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('teams')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'teams'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Teams View
                </button>
                <button
                  onClick={() => setViewMode('matches')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'matches'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Matches View
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Groups Display */}
        {importedCompetition ? (
          viewMode === 'teams' ? (
            <TeamsView 
              importedCompetition={importedCompetition}
              matchSchedule={matchSchedule}
              expandedGroups={expandedGroups}
              setExpandedGroups={setExpandedGroups}
            />
          ) : (
            <MatchesView 
              importedCompetition={importedCompetition}
              matchSchedule={matchSchedule}
              currentMatchday={currentMatchday}
              setCurrentMatchday={setCurrentMatchday}
              totalMatchdays={totalMatchdays}
            />
          )
        ) : (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-200 mb-4">Match Scheduler</h3>
            <p className="text-gray-400">
              Import competition data to begin scheduling matches.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchSchedulerTab;
