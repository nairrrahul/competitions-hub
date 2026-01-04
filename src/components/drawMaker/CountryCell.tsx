import React from 'react';
import { type TeamSlot } from '../../types/DrawMakerTypes';

type PresetType = 'manual' | 'confederation' | 'competition';

interface CountryCellProps {
  team: TeamSlot;
  presetType: PresetType;
  autocompleteState: { isOpen: boolean; filteredTeams: string[]; selectedIndex: number };
  onTeamNameChange: (slotId: string, value: string) => void;
  onCompetitionTeamChange: (slotId: string, value: string) => void;
  onSelectTeam: (slotId: string, teamName: string) => void;
  onToggleTeamSelection: (slotId: string) => void;
  onClearTeam: (slotId: string) => void;
  onToggleHost: (slotId: string) => void;
}

const CountryCell: React.FC<CountryCellProps> = ({
  team,
  presetType,
  autocompleteState,
  onTeamNameChange,
  onCompetitionTeamChange,
  onSelectTeam,
  onToggleTeamSelection,
  onClearTeam,
  onToggleHost
}) => {
  // Check if this is a playoff slot in competition mode
  const isPlayoffSlot = () => {
    if (presetType !== 'competition') return false;
    const parts = team.id.split('-');
    const sectionId = parts[0]; // e.g., "WorldCup" from "WorldCup-UEFA-0"
    const isIntlPlayoff = sectionId === 'intl';
    const isUEFAPlayoff = sectionId === 'euro';
    return isIntlPlayoff || isUEFAPlayoff;
  };

  // Handle right-click for host toggle
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if ((presetType === 'competition' || presetType === 'manual') && !isPlayoffSlot()) {
      onToggleHost(team.id);
    }
  };

  // Handle X button click
  const handleRemoveClick = () => {
    if (presetType === 'confederation') {
      onToggleTeamSelection(team.id);
    } else {
      onClearTeam(team.id);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (presetType === 'competition') {
      onCompetitionTeamChange(team.id, value);
    } else {
      onTeamNameChange(team.id, value);
    }
  };

  // Handle autocomplete selection
  const handleAutocompleteClick = (teamName: string) => {
    onSelectTeam(team.id, teamName);
  };

  return (
    <div 
      className={`flex items-center gap-2 p-2 relative rounded bg-gray-700`}
      onContextMenu={handleContextMenu}
    >
      {/* Flag Box with rectangular mask */}
      <div className="relative w-7 h-5 overflow-hidden rounded flex items-center justify-center bg-gray-600">
        {team.flagCode && (
          <span
            className={`fi fi-${team.flagCode} absolute inset-0`}
            style={{
              fontSize: '1.5rem',
              lineHeight: '1',
              transform: 'scale(1.2)',
            }}
          />
        )}
      </div>
      
      {/* Team Name Input or Display */}
      {presetType === 'confederation' ? (
        // Locked display for confederation mode
        <div className="flex-1 text-white text-sm px-2 py-1">
          {team.name}
        </div>
      ) : (
        // Editable input for manual/competition modes
        <div className="flex-1 relative">
          <input
            type="text"
            value={team.name}
            onChange={handleInputChange}
            placeholder="Team name"
            className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm min-w-0"
          />
           
          {/* Autocomplete Dropdown */}
          {autocompleteState?.isOpen && (
            <div className="absolute top-full left-0 right-0 bg-gray-700 border border-gray-600 rounded mt-1 max-h-40 overflow-y-auto z-10">
              {autocompleteState.filteredTeams.map((teamName) => (
                <div
                  key={teamName}
                  className="px-2 py-1 hover:bg-gray-600 cursor-pointer text-sm"
                  onClick={() => handleAutocompleteClick(teamName)}
                >
                  {teamName}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Host Overlay for Competition and Manual Modes */}
      {(presetType === 'competition' || presetType === 'manual') && team.isHost && (
        <div 
          className="absolute inset-0 rounded pointer-events-none"
          style={{
            backgroundColor: 'rgba(255, 215, 0, 0.2)' // gold with 20% opacity
          }}
        />
      )}
      
      {/* Deselection Overlay for Confederation Mode */}
      {presetType === 'confederation' && !team.isSelected && (
        <div 
          className="absolute inset-0 rounded"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.3)' // red-500 with 30% opacity
          }}
        />
      )}
      
      {/* Remove/Toggle Button */}
      <button 
        onClick={handleRemoveClick}
        className="text-red-400 hover:text-red-300 text-sm font-bold flex-shrink-0 relative z-20"
      >
        ×
      </button>
    </div>
  );
};

export default CountryCell;
