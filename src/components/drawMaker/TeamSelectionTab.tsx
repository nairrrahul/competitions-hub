import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import drawPresets from '../../config/draw_presets.json';
import { useGlobalStore } from '../../state/GlobalState';
import PresetSelection from './PresetSelection';
import TeamList from './TeamList';
import ValidationErrorModal from './ValidationErrorModal';
import { type TeamSlot, type TeamData, type PresetType, type Confederation } from '../../types/DrawMakerTypes';


interface TeamSelectionTabProps {
  onMoveToDrawSimulator: (data: TeamData) => void;
  onValidationUpdate: (canAccess: boolean) => void;
  initialData?: TeamData | null;
}

interface TeamSelectionTabRef {
  getCurrentTeamData: () => TeamData | null;
}

const TeamSelectionTab = forwardRef<TeamSelectionTabRef, TeamSelectionTabProps>((props, ref) => {
  const { onValidationUpdate, initialData } = props;
  const [presetType, setPresetType] = useState<PresetType>((initialData?.presetType as PresetType) || 'manual');
  const [selectedCompetition, setSelectedCompetition] = useState<string>(initialData?.selectedCompetition || '');
  const [selectedConfederation, setSelectedConfederation] = useState<Confederation>((initialData?.selectedConfederation as Confederation) || 'UEFA');
  const [manualTeams, setManualTeams] = useState<number>(initialData?.manualTeams || 16);
  const [manualGroups, setManualGroups] = useState<number>(initialData?.manualGroups || 4);
  const [confederationGroups, setConfederationGroups] = useState<number>(initialData?.confederationGroups || 4);
  const [homeAwayPairs, setHomeAwayPairs] = useState<number>(initialData?.homeAwayPairs || 4);
  const [bracketTeams, setBracketTeams] = useState<number>(initialData?.bracketTeams || 8);

  // Get global state functions
  const getNationFlagCode = useGlobalStore(state => state.getNationFlagCode);

  // Team management state
  const [teamSlots, setTeamSlots] = useState<TeamSlot[]>(initialData?.teamSlots || []);
  const [autocompleteStates, setAutocompleteStates] = useState<{ [key: string]: { isOpen: boolean; filteredTeams: string[]; selectedIndex: number } }>({});
  
  // Validation modal state
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);


  // Update validation state whenever relevant data changes
  useEffect(() => {
    onValidationUpdate(canNavigateToDrawSimulator());
  }, [presetType, teamSlots, manualTeams, manualGroups, homeAwayPairs, bracketTeams]);

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
        homeAwayPairs,
        bracketTeams,
        teamSlots: [...teamSlots]
      };
    }
  }), [presetType, selectedCompetition, selectedConfederation, manualTeams, manualGroups, confederationGroups, homeAwayPairs, bracketTeams, teamSlots]);

  // Handle switching to competition mode with auto-selection
  const handleCompetitionPresetSelect = () => {
    setPresetType('competition');
    setSelectedCompetition('WorldCup');
  };

  // Validation functions for navigation
  const canNavigateToDrawSimulator = (): boolean => {
    if (presetType === 'homeaway') {
      // Home and Away mode: all teams must be filled out
      const allTeamsFilled = teamSlots.every(slot => slot.name.trim() !== '');
      return allTeamsFilled;
    } else if (presetType === 'bracket') {
      // Bracket mode: all teams must be filled out
      const allTeamsFilled = teamSlots.every(slot => slot.name.trim() !== '');
      return allTeamsFilled;
    } else if (presetType === 'manual') {
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
  }, [manualTeams, selectedCompetition, presetType, initialData]);

  // Initialize team slots when confederation groups count changes (only if no initial data or switching to confederation with different data)
  useEffect(() => {
    if (presetType === 'confederation') {
      // If we have initial data for confederation, use it
      if (initialData && initialData.presetType === 'confederation' && initialData.selectedConfederation === selectedConfederation) {
        setTeamSlots(initialData.teamSlots);
      } else if (!initialData || initialData.presetType !== 'confederation' || initialData.selectedConfederation !== selectedConfederation) {
        // Only create fresh data if we don't have matching initial data
        const allNationalities = useGlobalStore.getState().getAllNationalities();
        const nationInfo = useGlobalStore.getState().nationInfo;
        const confederationTeams = allNationalities
          .filter(nation => {
            const nationData = nationInfo[nation];
            return nationData && nationData.confederationID === selectedConfederation;
          })
          .map((teamName) => ({
            id: `confed-${teamName}`,
            name: teamName,
            flagCode: getNationFlagCode(teamName),
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

  // Handle JSON import for competition mode
  const handleImportJSON = (data: any) => {
    if (presetType !== 'competition') {
      alert('JSON import is only available in competition mode.');
      return;
    }

    const allNationalities = useGlobalStore.getState().getAllNationalities();
    const nationInfo = useGlobalStore.getState().nationInfo;
    const validationErrors: string[] = [];

    // Get expected counts from competition preset
    const competition = drawPresets[selectedCompetition as keyof typeof drawPresets];
    if (!competition) {
      alert('Could not find competition preset data.');
      return;
    }

    // Validate and process each confederation section
    const processedData: { [key: string]: { name: string; isHost: boolean }[] } = {};

    Object.entries(data).forEach(([sectionKey, teams]) => {
      const teamsArray = teams as string[];
      
      // Validate section key
      const validSections = ['UEFA', 'AFC', 'OFC', 'CAF', 'CONMEBOL', 'CONCACAF', 'Intl Playoff', 'UEFA Playoff'];
      if (!validSections.includes(sectionKey)) {
        validationErrors.push(`Invalid section key: "${sectionKey}". Valid keys are: ${validSections.join(', ')}`);
        return;
      }

      processedData[sectionKey] = [];

      teamsArray.forEach((teamName) => {
        // Check for host designation (asterisk prefix)
        const isHost = teamName.startsWith('*');
        const cleanName = isHost ? teamName.substring(1) : teamName;

        // Validate country spelling
        if (!allNationalities.includes(cleanName)) {
          validationErrors.push(`Invalid country name: "${cleanName}" in section "${sectionKey}"`);
          return;
        }

        // Get nation info for validation
        const nationData = nationInfo[cleanName];
        if (!nationData) {
          validationErrors.push(`Could not find nation data for: "${cleanName}"`);
          return;
        }

        // Validate confederation membership
        if (sectionKey === 'Intl Playoff') {
          // Intl Playoff: must NOT be UEFA
          if (nationData.confederationID === 'UEFA') {
            validationErrors.push(`"${cleanName}" is in Intl Playoff but is a UEFA nation (not allowed)`);
            return;
          }
        } else if (sectionKey === 'UEFA Playoff') {
          // UEFA Playoff: must be UEFA
          if (nationData.confederationID !== 'UEFA') {
            validationErrors.push(`"${cleanName}" is in UEFA Playoff but is not a UEFA nation`);
            return;
          }
        } else {
          // Regular confederation: must match
          if (nationData.confederationID !== sectionKey) {
            validationErrors.push(`"${cleanName}" is in section "${sectionKey}" but belongs to ${nationData.confederationID}`);
            return;
          }
        }

        processedData[sectionKey].push({ name: cleanName, isHost });
      });

      // Validate count matches expected
      if (sectionKey === 'Intl Playoff') {
        const expectedCount = competition.numIntlPlayoff;
        if (teamsArray.length !== expectedCount) {
          validationErrors.push(`Intl Playoff: Expected ${expectedCount} teams, got ${teamsArray.length}`);
        }
      } else if (sectionKey === 'UEFA Playoff') {
        const expectedCount = competition.numEUROPlayoff;
        if (teamsArray.length !== expectedCount) {
          validationErrors.push(`UEFA Playoff: Expected ${expectedCount} teams, got ${teamsArray.length}`);
        }
      } else {
        // Regular confederation
        const expectedCount = competition.confederations[sectionKey as keyof typeof competition.confederations];
        if (expectedCount !== undefined && teamsArray.length !== expectedCount) {
          validationErrors.push(`${sectionKey}: Expected ${expectedCount} teams, got ${teamsArray.length}`);
        }
      }
    });

    // If validation failed, show errors in modal
    if (validationErrors.length > 0) {
      setValidationErrors(validationErrors);
      setValidationModalOpen(true);
      return;
    }

    // Map processed data to team slots
    const assignedTeams = new Set<string>();
    const updatedSlots = teamSlots.map(slot => {
      const parts = slot.id.split('-');
      const sectionId = parts[0]; // e.g., "WorldCup" from "WorldCup-UEFA-0"
      const slotConfederation = parts[1]; // e.g., "UEFA" from "WorldCup-UEFA-0"

      // Determine which section this slot belongs to
      let sectionKey = '';
      if (sectionId === 'intl') {
        sectionKey = 'Intl Playoff';
      } else if (sectionId === 'euro') {
        sectionKey = 'UEFA Playoff';
      } else {
        sectionKey = slotConfederation;
      }

      // Get the team data for this section
      const sectionTeams = processedData[sectionKey] || [];
      
      // Find the first unused team in this section
      const teamIndex = sectionTeams.findIndex(t => {
        return !assignedTeams.has(t.name);
      });

      if (teamIndex !== -1) {
        const teamData = sectionTeams[teamIndex];
        assignedTeams.add(teamData.name);
        return {
          ...slot,
          name: teamData.name,
          flagCode: getNationFlagCode(teamData.name),
          isHost: teamData.isHost
        };
      }

      return slot;
    });

    setTeamSlots(updatedSlots);
  };

  // Initialize team slots for home and away mode (only if no initial data)
  useEffect(() => {
    if (presetType === 'homeaway' && (!initialData || initialData.presetType !== 'homeaway' || initialData.homeAwayPairs !== homeAwayPairs)) {
      const newSlots: TeamSlot[] = [];
      const totalTeams = homeAwayPairs * 2;

      for (let i = 0; i < totalTeams; i++) {
        newSlots.push({
          id: `homeaway-${i}`,
          name: '',
          flagCode: ''
        });
      }

      setTeamSlots(newSlots);
    }
  }, [homeAwayPairs, presetType, initialData]);

  // Initialize team slots for bracket mode (only if no initial data)
  useEffect(() => {
    if (presetType === 'bracket' && (!initialData || initialData.presetType !== 'bracket' || initialData.bracketTeams !== bracketTeams)) {
      const newSlots: TeamSlot[] = [];

      for (let i = 0; i < bracketTeams; i++) {
        newSlots.push({
          id: `bracket-${i}`,
          name: '',
          flagCode: ''
        });
      }

      setTeamSlots(newSlots);
    }
  }, [bracketTeams, presetType, initialData]);


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
            homeAwayPairs={homeAwayPairs}
            setHomeAwayPairs={setHomeAwayPairs}
            bracketTeams={bracketTeams}
            setBracketTeams={setBracketTeams}
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
            onImportJSON={handleImportJSON}
          />
        </div>
      </div>
      
      <ValidationErrorModal
        isOpen={validationModalOpen}
        errors={validationErrors}
        onClose={() => setValidationModalOpen(false)}
      />
    </div>
  );
});

TeamSelectionTab.displayName = 'TeamSelectionTab';

export default TeamSelectionTab;
