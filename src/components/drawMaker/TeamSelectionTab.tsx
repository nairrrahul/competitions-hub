import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import drawPresets from '../../config/draw_presets.json';
import nationInfo from '../../config/nation_info.json';
import PresetSelection from './PresetSelection';
import TeamList from './TeamList';
import { type TeamSlot, type TeamData } from '../../types/DrawMakerTypes';

type PresetType = 'manual' | 'confederation' | 'competition';
type Confederation = 'AFC' | 'CAF' | 'OFC' | 'UEFA' | 'CONCACAF' | 'CONMEBOL';


interface TeamSelectionTabProps {
  onMoveToDrawSimulator: (data: TeamData) => void;
  onValidationUpdate: (canAccess: boolean) => void;
  initialData?: TeamData | null;
}

const TeamSelectionTab = forwardRef<{ getCurrentTeamData: () => TeamData | null }, TeamSelectionTabProps>(({ onMoveToDrawSimulator, onValidationUpdate, initialData }, ref) => {
  const [presetType, setPresetType] = useState<PresetType>(initialData?.presetType || 'manual');
  const [selectedCompetition, setSelectedCompetition] = useState<string>(initialData?.selectedCompetition || '');
  const [selectedConfederation, setSelectedConfederation] = useState<Confederation>((initialData?.selectedConfederation as Confederation) || 'UEFA');
  const [manualTeams, setManualTeams] = useState<number>(initialData?.manualTeams || 16);
  const [manualGroups, setManualGroups] = useState<number>(initialData?.manualGroups || 4);
  const [confederationGroups, setConfederationGroups] = useState<number>(initialData?.confederationGroups || 4);
  
  // Team management state
  const [teamSlots, setTeamSlots] = useState<TeamSlot[]>(initialData?.teamSlots || []);
  const [autocompleteStates, setAutocompleteStates] = useState<{ [key: string]: { isOpen: boolean; filteredTeams: string[]; selectedIndex: number } }>({});
  
  // Get all available team names for autocomplete
  const allTeamNames = Object.keys(nationInfo);

  // Update validation state whenever relevant data changes
  useEffect(() => {
    onValidationUpdate(canNavigateToDrawSimulator());
  }, [presetType, teamSlots, manualTeams, manualGroups]);

  // Expose getCurrentTeamData method to parent
  useImperativeHandle(ref, () => ({
    getCurrentTeamData: (): TeamData | null => {
      if (!canNavigateToDrawSimulator()) return null;
      
      return {
        presetType,
        selectedCompetition,
        selectedConfederation,
        manualTeams,
        manualGroups,
        confederationGroups,
        teamSlots: [...teamSlots]
      };
    }
  }), [presetType, selectedCompetition, selectedConfederation, manualTeams, manualGroups, confederationGroups, teamSlots]);

  // Handle switching to competition mode with auto-selection
  const handleCompetitionPresetSelect = () => {
    setPresetType('competition');
    setSelectedCompetition('WorldCup');
  };

  // Validation functions for navigation
  const canNavigateToDrawSimulator = (): boolean => {
    if (presetType === 'manual') {
      // Manual mode: all teams must be filled out, and groups <= teams
      const allTeamsFilled = teamSlots.every(slot => slot.name.trim() !== '');
      const groupsValid = manualGroups <= manualTeams;
      return allTeamsFilled && groupsValid;
    } else if (presetType === 'confederation') {
      // Confederation mode: always allowed
      return true;
    } else if (presetType === 'competition') {
      // Competition mode: all teams must be filled out
      const allTeamsFilled = teamSlots.every(slot => slot.name.trim() !== '');
      return allTeamsFilled;
    }
    return false;
  };

  // Initialize team slots when manual teams count changes (only if no initial data)
  useEffect(() => {
    if (presetType === 'manual' && (!initialData || initialData.presetType !== 'manual' || initialData.manualTeams !== manualTeams)) {
      const newSlots: TeamSlot[] = [];
      for (let i = 0; i < manualTeams; i++) {
        newSlots.push({
          id: `manual-${i}`,
          name: '',
          flagCode: ''
        });
      }
      setTeamSlots(newSlots);
    }
  }, [selectedCompetition, presetType, initialData]);

  // Initialize team slots when confederation groups count changes (only if no initial data or switching to confederation with different data)
  useEffect(() => {
    if (presetType === 'confederation') {
      // If we have initial data for confederation, use it
      if (initialData && initialData.presetType === 'confederation' && initialData.selectedConfederation === selectedConfederation) {
        setTeamSlots(initialData.teamSlots);
      } else if (!initialData || initialData.presetType !== 'confederation' || initialData.selectedConfederation !== selectedConfederation) {
        // Only create fresh data if we don't have matching initial data
        const confederationTeams = Object.entries(nationInfo)
          .filter(([_, nationData]) => nationData.confederationID === selectedConfederation)
          .map(([teamName, nationData]) => ({
            id: `confed-${teamName}`,
            name: teamName,
            flagCode: nationData.flagCode,
            isSelected: true // All teams enabled by default
          }));
        
        setTeamSlots(confederationTeams);
      }
    }
  }, [presetType, selectedConfederation, initialData]);

  // Initialize team slots for competition presets (only if no initial data)
  useEffect(() => {
    if (presetType === 'competition' && selectedCompetition && (!initialData || initialData.presetType !== 'competition' || initialData.selectedCompetition !== selectedCompetition)) {
      const competition = drawPresets[selectedCompetition as keyof typeof drawPresets];
      if (!competition) return;

      const newSlots: TeamSlot[] = [];
      
      // Add confederation slots
      Object.entries(competition.confederations).forEach(([confed, count]) => {
        for (let i = 0; i < count; i++) {
          newSlots.push({
            id: `${selectedCompetition}-${confed}-${i}`,
            name: '',
            flagCode: ''
          });
        }
      });

      // Add international playoff slots
      for (let i = 0; i < competition.numIntlPlayoff; i++) {
        newSlots.push({
          id: `intl-${i}`,
          name: '',
          flagCode: ''
        });
      }

      // Add UEFA playoff slots
      for (let i = 0; i < competition.numEUROPlayoff; i++) {
        newSlots.push({
          id: `euro-${i}`,
          name: '',
          flagCode: ''
        });
      }

      setTeamSlots(newSlots);
    }
  }, [selectedCompetition, presetType, initialData]);

  // Filter teams for autocomplete
  const filterTeams = (input: string, currentSlotId: string): string[] => {
    if (!input) return [];
    console.log(input);
    
    // Get slot info for competition mode constraints
    const slot = teamSlots.find(s => s.id === currentSlotId);
    let allowedConfederations: Confederation[] = [];
    let excludeUEFA = false;
    
    if (slot && presetType === 'competition') {
      const parts = slot.id.split('-');
      const sectionId = parts[0]; // e.g., "WorldCup" from "WorldCup-UEFA-0"
      const slotConfederation = parts[1]; // e.g., "UEFA" from "WorldCup-UEFA-0"
      
      // Check if this is a playoff slot
      const isIntlPlayoff = sectionId === 'intl';
      const isUEFAPlayoff = sectionId === 'euro';
      
      if (isIntlPlayoff) {
        // Intl Playoff: Only non-European nations
        excludeUEFA = true;
      } else if (isUEFAPlayoff) {
        // UEFA Playoff: Only European nations
        allowedConfederations = ['UEFA'];
      } else if (slotConfederation) {
        // Confederation slot: Only nations from this confederation
        allowedConfederations = [slotConfederation as Confederation];
      }
    }
    
    // Get already selected team names
    let selectedTeamNames: string[] = [];
    if (presetType !== 'competition') {
      // Manual mode: prevent duplicates
      selectedTeamNames = teamSlots
        .filter(slot => slot.id !== currentSlotId && slot.name)
        .map(slot => slot.name.toLowerCase());
    } else if (presetType === 'competition') {
      // Competition mode: allow duplicates across different sections
      selectedTeamNames = teamSlots
        .filter(slot => slot.id !== currentSlotId && slot.name)
        .map(slot => slot.name.toLowerCase());
    }
    
    return allTeamNames.filter(team => {
      const teamLower = team.toLowerCase();
      const matchesInput = teamLower.includes(input.toLowerCase());
      const notAlreadySelected = !selectedTeamNames.includes(teamLower);
      
      if (!matchesInput || !notAlreadySelected) return false;
      
      // Apply competition constraints
      if (presetType === 'competition' && allowedConfederations.length > 0) {
        const nationData = nationInfo[team as keyof typeof nationInfo];
        return nationData && allowedConfederations.includes(nationData.confederationID as Confederation);
      }
      
      if (presetType === 'competition' && excludeUEFA) {
        const nationData = nationInfo[team as keyof typeof nationInfo];
        return nationData && nationData.confederationID !== 'UEFA';
      }
      
      return true;
    });
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen w-full">
      <div className="w-full">
        <div className="flex gap-6 w-full">
          <PresetSelection
            presetType={presetType}
            setPresetType={setPresetType}
            selectedCompetition={selectedCompetition}
            setSelectedCompetition={setSelectedCompetition}
            selectedConfederation={selectedConfederation}
            setSelectedConfederation={setSelectedConfederation}
            manualTeams={manualTeams}
            setManualTeams={setManualTeams}
            manualGroups={manualGroups}
            setManualGroups={setManualGroups}
            confederationGroups={confederationGroups}
            setConfederationGroups={setConfederationGroups}
            onCompetitionPresetSelect={handleCompetitionPresetSelect}
          />
          
          <TeamList
            presetType={presetType}
            selectedCompetition={selectedCompetition}
            selectedConfederation={selectedConfederation}
            teamSlots={teamSlots}
            setTeamSlots={setTeamSlots}
            autocompleteStates={autocompleteStates}
            setAutocompleteStates={setAutocompleteStates}
          />
        </div>
      </div>
    </div>
  );
});

TeamSelectionTab.displayName = 'TeamSelectionTab';

export default TeamSelectionTab;
