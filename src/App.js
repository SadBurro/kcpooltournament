// src/App.js

import React, { useState, useRef, useEffect } from 'react';
import { buildBracket, getStandings, finalizeByeMatches, propagateAutoWinners } from './utils/bracketUtils';
import { getBracketNodePositions } from './utils/layoutUtils';
import { capitalizeName, shuffleArray } from './utils/nameUtils';
import { useLocalStorage } from './hooks/useLocalStorage';
import Bracket from './components/Bracket';
import Sidebar from './components/Sidebar';
import TableView from './components/TableView';

export default function App() {
  // Players management - using localStorage for persistence
  const [playersText, setPlayersText] = useLocalStorage('tournamentPlayers', '');
  const [bracket, setBracket] = useLocalStorage('tournamentBracket', []);
  const [payoutAmounts, setPayoutAmounts] = useLocalStorage('payoutAmounts', ['']);
  const [numPayoutPlaces, setNumPayoutPlaces] = useLocalStorage('numPayoutPlaces', 3);
  const [sidebarOpen, setSidebarOpen] = useLocalStorage('sidebarOpen', true);
  const [totalTables, setTotalTables] = useLocalStorage('totalTables', 8);
  const [tablesStartWithZero, setTablesStartWithZero] = useLocalStorage('tablesStartWithZero', false);
  const [customTableNumbers, setCustomTableNumbers] = useLocalStorage('customTableNumbers', '1,2,3,4,5,6,7,8');
  const [lastPlayerList, setLastPlayerList] = useLocalStorage('lastPlayerList', '');
  const [showShuffleWarning, setShowShuffleWarning] = useState(false);
  const [viewMode, setViewMode] = useLocalStorage('viewMode', 'bracket'); // 'bracket' or 'table'

  const [nodePositions, setNodePositions] = useState({});

  // File import ref
  const fileInputRef = useRef(null);

  // Calculate tournament rounds
  const rounds = bracket.length > 0
    ? Math.ceil(Math.log2(Math.max(1, playersText.trim().split('\n').filter(Boolean).length)))
    : 1;

  // Reset tournament function
  const resetTournamentData = () => {
    setBracket([]);
    setNodePositions({});
    setPayoutAmounts(['']);
    setNumPayoutPlaces(3);

    // Restore the last player list after reset
    if (lastPlayerList) {
      setPlayersText(lastPlayerList);
    }
  };

  // Navigation functions for bracket sections
  const scrollToWinnersBracket = () => {
    if (viewMode === 'bracket') {
      // Find the first winners bracket match position
      const winnersMatches = bracket.filter(m => m.bracket === 'W');
      if (winnersMatches.length > 0) {
        const firstWinnersMatch = winnersMatches[0];
        const position = nodePositions[firstWinnersMatch.id];
        if (position) {
          // Use the specific container ID we added
          const container = document.getElementById('main-content-container');
          if (container) {
            // Scroll to the match position, accounting for the padding in the main container
            container.scrollTo({
              left: Math.max(0, position.x - 20), // Account for the 20px padding in main container
              top: Math.max(0, position.y - 20),  // Account for the 20px padding in main container
              behavior: 'smooth'
            });
          }
        }
      }
    } else {
      // Table view - scroll to Winners section
      const winnersSection = document.querySelector('[data-section="winners"]');
      if (winnersSection) {
        winnersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const scrollToLosersBracket = () => {
    if (viewMode === 'bracket') {
      // Find the first losers bracket match position
      const losersMatches = bracket.filter(m => m.bracket === 'L');
      console.log('Found losers matches:', losersMatches.length); // Debug log
      if (losersMatches.length > 0) {
        const firstLosersMatch = losersMatches[0];
        console.log('First losers match ID:', firstLosersMatch.id); // Debug log
        console.log('All nodePositions keys:', Object.keys(nodePositions)); // Debug log
        const position = nodePositions[firstLosersMatch.id];
        if (position) {
          console.log('Losers bracket position details:', {
            x: position.x,
            y: position.y,
            w: position.w,
            h: position.h
          }); // More detailed debug log
          // Use the specific container ID we added
          const container = document.getElementById('main-content-container');
          if (container) {
            console.log('Container dimensions:', {
              scrollWidth: container.scrollWidth,
              scrollHeight: container.scrollHeight,
              clientWidth: container.clientWidth,
              clientHeight: container.clientHeight
            });
            console.log('Container scroll before:', container.scrollLeft, container.scrollTop); // Debug log
            // Scroll to the match position, accounting for the padding in the main container
            container.scrollTo({
              left: Math.max(0, position.x - 20), // Account for the 20px padding in main container
              top: Math.max(0, position.y - 20),  // Account for the 20px padding in main container
              behavior: 'smooth'
            });
            // Check scroll after a short delay
            setTimeout(() => {
              console.log('Container scroll after:', container.scrollLeft, container.scrollTop);
            }, 500);
          }
        } else {
          console.log('No position found for match:', firstLosersMatch.id);
        }
      }
    } else {
      // Table view - scroll to Losers section
      const losersSection = document.querySelector('[data-section="losers"]');
      if (losersSection) {
        losersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Recalculate node positions when bracket is loaded from localStorage
  useEffect(() => {
    if (bracket.length > 0 && Object.keys(nodePositions).length === 0) {
      const positions = getBracketNodePositions(bracket, rounds);
      setNodePositions(positions);
    }
  }, [bracket, nodePositions, rounds]);

  // Helper function to get available table numbers based on mode
  const getAvailableTableNumbers = () => {
    const manualTableMode = customTableNumbers.trim().length > 0;

    if (manualTableMode) {
      // Parse custom table numbers from comma-separated string
      return customTableNumbers
        .split(',')
        .map(table => table.trim())
        .filter(table => table.length > 0);
    } else {
      // Generate consecutive table numbers
      const startNum = tablesStartWithZero ? 0 : 1;
      const endNum = tablesStartWithZero ? totalTables - 1 : totalTables;
      const tables = [];
      for (let i = startNum; i <= endNum; i++) {
        tables.push(i.toString());
      }
      return tables;
    }
  };

  // Auto-assign tables when bracket changes or table settings change
  useEffect(() => {
    if (bracket.length === 0) return;

    // Find matches that need table assignments and currently active matches
    const needsTableAssignment = (match) => {
      if (match.finished) return false;
      if (match.p1?.name === "BYE" || match.p2?.name === "BYE") return false;
      if (match.p1?.name?.includes("Winner of") ||
        match.p1?.name?.includes("Loser of") ||
        match.p2?.name?.includes("Winner of") ||
        match.p2?.name?.includes("Loser of")) {
        return false;
      }
      return true;
    };

    const activeMatches = bracket.filter(needsTableAssignment);
    const matchesWithoutTables = activeMatches.filter(match => !match.table || match.table === "");

    // Only reassign if there are matches that need tables
    if (matchesWithoutTables.length > 0) {
      setBracket(prevBracket => {
        const newBracket = [...prevBracket];

        // Get currently assigned table numbers to avoid duplicates
        const assignedTables = new Set();
        newBracket.forEach(match => {
          if (match.table && match.table !== "" && needsTableAssignment(match)) {
            assignedTables.add(match.table);
          }
        });

        // Get available table numbers based on current mode
        const allTables = getAvailableTableNumbers();
        const availableTables = allTables.filter(table => !assignedTables.has(table));

        // Shuffle available tables for random assignment
        const shuffledTables = [...availableTables].sort(() => Math.random() - 0.5);

        // Assign tables to matches that don't have them
        let tableIndex = 0;
        newBracket.forEach(match => {
          if (needsTableAssignment(match) && (!match.table || match.table === "") && tableIndex < shuffledTables.length) {
            match.table = shuffledTables[tableIndex];
            tableIndex++;
          }
        });

        return newBracket;
      });
    }
  }, [bracket, totalTables, tablesStartWithZero, customTableNumbers]);

  // Manual table assignment function (kept for potential manual use)
  const assignTables = () => {
    setBracket(prevBracket => {
      const newBracket = [...prevBracket];

      // Clear all current table assignments and reassign
      newBracket.forEach(match => {
        match.table = "";
      });

      // Find matches that need table assignments
      const activeMatches = newBracket.filter(match => {
        if (match.finished) return false;
        if (match.p1?.name === "BYE" || match.p2?.name === "BYE") return false;
        if (match.p1?.name?.includes("Winner of") ||
          match.p1?.name?.includes("Loser of") ||
          match.p2?.name?.includes("Winner of") ||
          match.p2?.name?.includes("Loser of")) {
          return false;
        }
        return true;
      });

      // Get available table numbers based on current mode
      const availableTables = getAvailableTableNumbers();

      // Shuffle the table numbers for random assignment
      const shuffledTables = [...availableTables].sort(() => Math.random() - 0.5);

      // Assign tables to active matches
      activeMatches.forEach((match, index) => {
        if (index < shuffledTables.length) {
          match.table = shuffledTables[index];
        }
      });

      return newBracket;
    });
  };

  // REMOVED the automatic bracket generation useEffect
  // Bracket will only be created when user clicks "Start Tournament" or "Shuffle Bracket"

  // Handle players text change
  const handlePlayersChange = (e) => {
    setPlayersText(e.target.value);
  };

  const handlePlayersBlur = () => {
    // Only clean up if we don't have a bracket (to allow bulk editing)
    if (bracket.length === 0) {
      const cleaned = playersText
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(name => capitalizeName(name.trim()))
        .join('\n');
      setPlayersText(cleaned);
    }
  };

  // Generate bracket function - extracted from useEffect
  const generateBracket = (playerNames) => {
    if (playerNames.length >= 2) {
      console.log('Building bracket for players:', playerNames);
      const newBracket = buildBracket(playerNames);

      finalizeByeMatches(newBracket);
      propagateAutoWinners(newBracket);

      setBracket(newBracket);

      const positions = getBracketNodePositions(newBracket, rounds);
      setNodePositions(positions);

      console.log('Bracket built successfully:', newBracket.length, 'matches');
    }
  };

  // Update a match (scores, table, etc.)
  const updateMatch = (matchId, updates) => {
    setBracket(prevBracket => {
      const newBracket = prevBracket.map(match =>
        match.id === matchId
          ? { ...match, ...updates }
          : match
      );

      // Handle table number conflicts if table was updated
      if (updates.table !== undefined && updates.table !== '') {
        const updatedMatch = newBracket.find(match => match.id === matchId);
        const newTableNumber = updates.table;

        // Check if another active match already has this table number
        const conflictingMatch = newBracket.find(match =>
          match.id !== matchId &&
          match.table === newTableNumber &&
          !match.finished &&
          match.p1?.name !== "BYE" &&
          match.p2?.name !== "BYE" &&
          !match.p1?.name?.includes("Winner of") &&
          !match.p1?.name?.includes("Loser of") &&
          !match.p2?.name?.includes("Winner of") &&
          !match.p2?.name?.includes("Loser of")
        );

        if (conflictingMatch) {
          // Get all available table numbers based on current mode
          const allTables = getAvailableTableNumbers();

          // Get all currently assigned table numbers
          const assignedTables = new Set();
          newBracket.forEach(match => {
            if (match.table && match.table !== "" && match.id !== conflictingMatch.id) {
              assignedTables.add(match.table);
            }
          });

          // Find first available table number
          const availableTables = allTables.filter(table => !assignedTables.has(table));

          if (availableTables.length > 0) {
            // Randomly select from available tables
            const randomIndex = Math.floor(Math.random() * availableTables.length);
            conflictingMatch.table = availableTables[randomIndex];
          } else {
            // No tables available, clear the table assignment
            conflictingMatch.table = "";
          }
        }
      }

      return newBracket;
    });
  };

  // Mark a match as finished and propagate results
  const markFinished = (match) => {
    const score1 = Number(match.score1) || 0;
    const score2 = Number(match.score2) || 0;

    if (score1 === score2) {
      alert('Match cannot end in a tie. Please enter different scores.');
      return;
    }

    const winner = score1 > score2 ? match.p1.name : match.p2.name;

    setBracket(prevBracket => {
      const newBracket = prevBracket.map(m =>
        m.id === match.id
          ? {
            ...m,
            finished: true,
            winner,
            status: ""
          }
          : m
      );

      // Propagate results to subsequent matches
      propagateAutoWinners(newBracket);

      // Auto-finalize any new BYE matches that might have been created
      finalizeByeMatches(newBracket);

      return newBracket;
    });
  };

  // Undo a finished match
  const undoFinished = (match) => {
    setBracket(prevBracket => {
      const newBracket = prevBracket.map(m =>
        m.id === match.id
          ? {
            ...m,
            finished: false,
            winner: '',
            status: 'Pending'
          }
          : m
      );

      // Reset all dependent matches
      const resetDependentMatches = (bracket) => {
        return bracket.map(m => {
          // If this match depends on the undone match, reset it
          const dependsOnUndone = m.from && m.from.includes(match.id);
          if (dependsOnUndone) {
            return {
              ...m,
              finished: false,
              winner: '',
              status: 'Pending',
              score1: '0',
              score2: '0',
              p1: {
                ...m.p1,
                name: m.p1.ref || m.p1.name
              },
              p2: {
                ...m.p2,
                name: m.p2.ref || m.p2.name
              }
            };
          }
          return m;
        });
      };

      const resetBracket = resetDependentMatches(newBracket);

      // Recalculate all winner propagations from scratch
      const cleanBracket = resetBracket.map(m => ({
        ...m,
        p1: {
          ...m.p1,
          name: m.p1.ref || m.p1.name
        },
        p2: {
          ...m.p2,
          name: m.p2.ref || m.p2.name
        }
      }));

      propagateAutoWinners(cleanBracket);
      return cleanBracket;
    });
  };

  // Handle player name changes from match boxes
  const handleMatchPlayerNameEdit = (oldName, newName) => {
    if (!newName.trim() || oldName === newName) return;

    const cleanNewName = capitalizeName(newName.trim());

    // Update all matches in the bracket where this player appears
    setBracket(prevBracket => {
      const newBracket = prevBracket.map(match => {
        let updatedMatch = { ...match };

        // Update player 1 if it matches
        if (updatedMatch.p1.name === oldName) {
          updatedMatch.p1 = {
            ...updatedMatch.p1,
            name: cleanNewName
          };
        }

        // Update player 2 if it matches  
        if (updatedMatch.p2.name === oldName) {
          updatedMatch.p2 = {
            ...updatedMatch.p2,
            name: cleanNewName
          };
        }

        // Update winner field if it matches
        if (updatedMatch.winner === oldName) {
          updatedMatch.winner = cleanNewName;
        }

        return updatedMatch;
      });

      return newBracket;
    });

    // Update players text in sidebar
    setPlayersText(prevText => {
      const playerLines = prevText.split('\n');
      const updatedLines = playerLines.map(line => {
        const trimmedLine = line.trim();
        return trimmedLine === oldName ? cleanNewName : line;
      });
      return updatedLines.join('\n');
    });
  };

  // Handle name changes from the sidebar
  const handleSidebarPlayerNameChange = (oldName, newName) => {
    if (!newName.trim() || oldName === newName) return;

    const cleanNewName = capitalizeName(newName.trim());

    // Update the bracket
    setBracket(prevBracket => {
      const newBracket = prevBracket.map(match => {
        let updatedMatch = { ...match };

        // Update player 1 if it matches
        if (updatedMatch.p1.name === oldName) {
          updatedMatch.p1 = {
            ...updatedMatch.p1,
            name: cleanNewName
          };
        }

        // Update player 2 if it matches  
        if (updatedMatch.p2.name === oldName) {
          updatedMatch.p2 = {
            ...updatedMatch.p2,
            name: cleanNewName
          };
        }

        // Update winner field if it matches
        if (updatedMatch.winner === oldName) {
          updatedMatch.winner = cleanNewName;
        }

        return updatedMatch;
      });

      return newBracket;
    });

    // Update players text
    setPlayersText(prevText => {
      const playerLines = prevText.split('\n');
      const updatedLines = playerLines.map(line => {
        const trimmedLine = line.trim();
        return trimmedLine === oldName ? cleanNewName : line;
      });
      return updatedLines.join('\n');
    });
  };

  // Shuffle bracket / Start tournament function with warning for active tournaments
  const handleShuffleBracket = () => {
    // If tournament is active, show warning first
    if (bracket.length > 0) {
      setShowShuffleWarning(true);
      return;
    }

    // If no tournament exists, proceed directly
    performShuffleBracket();
  };

  // Actual shuffle/start tournament implementation
  const performShuffleBracket = () => {
    const playerNames = playersText
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(name => capitalizeName(name.trim()));

    if (playerNames.length >= 2) {
      // Save the current player list before starting tournament (only when starting, not shuffling)
      if (bracket.length === 0) {
        setLastPlayerList(playersText);
      }

      // For shuffle: randomize the order
      // For start: use the order as-is
      const finalPlayers = bracket.length === 0 ? playerNames : shuffleArray(playerNames);

      // Generate the bracket
      console.log('Building bracket for players:', finalPlayers);
      const newBracket = buildBracket(finalPlayers);

      finalizeByeMatches(newBracket);
      propagateAutoWinners(newBracket);

      setBracket(newBracket);

      // Calculate new rounds based on player count
      const newRounds = Math.ceil(Math.log2(finalPlayers.length));
      const positions = getBracketNodePositions(newBracket, newRounds);
      setNodePositions(positions);

      console.log('Bracket built successfully:', newBracket.length, 'matches');
    }

    // Close warning dialog if it was open
    setShowShuffleWarning(false);
  };

  // Determine button text based on tournament state
  const getShuffleButtonText = () => {
    return bracket.length === 0 ? "Start Tournament" : "Shuffle Bracket";
  };

  // Export tournament
  const exportTournament = () => {
    const tournamentData = {
      playersText,
      bracket,
      payoutAmounts,
      numPayoutPlaces,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(tournamentData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `tournament_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import tournament
  const importTournament = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const tournamentData = JSON.parse(event.target.result);

        setPlayersText(tournamentData.playersText || '');
        setBracket(tournamentData.bracket || []);
        setPayoutAmounts(tournamentData.payoutAmounts || ['']);
        setNumPayoutPlaces(tournamentData.numPayoutPlaces || 3);

        // Recalculate positions
        if (tournamentData.bracket && tournamentData.bracket.length > 0) {
          const positions = getBracketNodePositions(tournamentData.bracket, rounds);
          setNodePositions(positions);
        }

      } catch (error) {
        alert('Error loading tournament file: ' + error.message);
      }
    };
    reader.readAsText(file);

    // Reset file input
    e.target.value = '';
  };

  // Simulate tournament (for testing)
  const simulateTournament = () => {
    setBracket(prevBracket => {
      const newBracket = [...prevBracket];

      // Simulate each unfinished match
      newBracket.forEach(match => {
        if (!match.finished &&
          match.p1.name && match.p2.name &&
          !match.p1.name.includes('Winner of') &&
          !match.p1.name.includes('Loser of') &&
          match.p1.name !== 'BYE' && match.p2.name !== 'BYE') {

          // Random scores between 0-5, ensure no ties
          let score1 = Math.floor(Math.random() * 6);
          let score2 = Math.floor(Math.random() * 6);
          while (score1 === score2) {
            score2 = Math.floor(Math.random() * 6);
          }

          match.score1 = score1.toString();
          match.score2 = score2.toString();
          match.finished = true;
          match.winner = score1 > score2 ? match.p1.name : match.p2.name;
          match.status = "";
        }
      });

      // Propagate all results
      propagateAutoWinners(newBracket);
      finalizeByeMatches(newBracket);

      return newBracket;
    });
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      display: 'flex'
    }}>
      <Sidebar
        playersText={playersText}
        handlePlayersChange={handlePlayersChange}
        handlePlayersBlur={handlePlayersBlur}
        handleShuffleBracket={handleShuffleBracket}
        shuffleButtonText={getShuffleButtonText()}
        exportTournament={exportTournament}
        importTournament={importTournament}
        fileInputRef={fileInputRef}
        bracket={bracket}
        payoutAmounts={payoutAmounts}
        setPayoutAmounts={setPayoutAmounts}
        numPayoutPlaces={numPayoutPlaces}
        setNumPayoutPlaces={setNumPayoutPlaces}
        simulateTournament={simulateTournament}
        handleSidebarPlayerNameChange={handleSidebarPlayerNameChange}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        totalTables={totalTables}
        setTotalTables={setTotalTables}
        tablesStartWithZero={tablesStartWithZero}
        setTablesStartWithZero={setTablesStartWithZero}
        assignTables={assignTables}
        customTableNumbers={customTableNumbers}
        setCustomTableNumbers={setCustomTableNumbers}
        resetTournamentData={resetTournamentData}
      />

      {/* Shuffle Warning Dialog */}
      {showShuffleWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '30px',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h3 style={{
              color: '#dc3545',
              marginBottom: '15px',
              fontSize: '18px'
            }}>
              ⚠️ Warning
            </h3>
            <p style={{
              marginBottom: '20px',
              lineHeight: '1.5',
              color: '#333'
            }}>
              Shuffling will reset all current matches and results. This action cannot be undone. Are you sure you want to shuffle the bracket?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowShuffleWarning(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={performShuffleBracket}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Shuffle Bracket
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        id="main-content-container"
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px',
          marginLeft: sidebarOpen ? '270px' : '0px',
          transition: 'margin-left 0.3s ease',
          position: 'relative'
        }}>
        {/* Navigation and View Toggle Buttons - only show if bracket exists */}
        {bracket.length > 0 && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1500,
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={scrollToWinnersBracket}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: 'bold',
                borderRadius: '6px',
                background: '#28a745',
                color: '#fff',
                border: '1px solid #1e7e34',
                boxShadow: '1px 1px 4px #ddd',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Go to Winners Bracket"
            >
              Winners
            </button>

            <button
              onClick={scrollToLosersBracket}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: 'bold',
                borderRadius: '6px',
                background: '#dc3545',
                color: '#fff',
                border: '1px solid #c82333',
                boxShadow: '1px 1px 4px #ddd',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Go to Losers Bracket"
            >
              Losers
            </button>

            <button
              onClick={() => setViewMode(viewMode === 'bracket' ? 'table' : 'bracket')}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 'bold',
                borderRadius: '8px',
                background: viewMode === 'bracket' ? '#17a2b8' : '#28a745',
                color: '#fff',
                border: '2px solid #000000',
                boxShadow: '2px 2px 7px #ddd',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title={`Switch to ${viewMode === 'bracket' ? 'table' : 'bracket'} view`}
            >
              {viewMode === 'bracket' ? '📊 Table View' : '🌳 Bracket View'}
            </button>
          </div>
        )}

        {bracket.length > 0 ? (
          viewMode === 'bracket' ? (
            <Bracket
              bracket={bracket}
              nodePositions={nodePositions}
              updateMatch={updateMatch}
              markFinished={markFinished}
              undoFinished={undoFinished}
              handleMatchPlayerNameEdit={handleMatchPlayerNameEdit}
            />
          ) : (
            <TableView
              bracket={bracket}
              updateMatch={updateMatch}
              markFinished={markFinished}
              undoFinished={undoFinished}
              handleMatchPlayerNameEdit={handleMatchPlayerNameEdit}
            />
          )
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '400px',
            color: '#fff',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            Enter at least 2 players to generate bracket
          </div>
        )}
      </div>
    </div>
  );
}