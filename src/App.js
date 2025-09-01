// src/App.js

import React, { useState, useRef, useEffect } from 'react';
import { buildBracket, getStandings, finalizeByeMatches, propagateAutoWinners } from './utils/bracketUtils';
import { getBracketNodePositions } from './utils/layoutUtils';
import { capitalizeName, shuffleArray } from './utils/nameUtils';
import Bracket from './components/Bracket';
import Sidebar from './components/Sidebar';

export default function App() {
  // Players management
  const [playersText, setPlayersText] = useState('');
  const [bracket, setBracket] = useState([]);
  const [nodePositions, setNodePositions] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Payout settings
  const [payoutAmounts, setPayoutAmounts] = useState(['']);
  const [numPayoutPlaces, setNumPayoutPlaces] = useState(3);

  // File import ref
  const fileInputRef = useRef(null);

  // Calculate tournament rounds
  const rounds = bracket.length > 0
    ? Math.ceil(Math.log2(Math.max(1, playersText.trim().split('\n').filter(Boolean).length)))
    : 1;

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

  // Shuffle bracket / Start tournament - NOW EXPLICITLY GENERATES THE BRACKET
  const handleShuffleBracket = () => {
    const playerNames = playersText
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(name => capitalizeName(name.trim()));

    if (playerNames.length >= 2) {
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
      />

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px',
        marginLeft: sidebarOpen ? '270px' : '0px',
        transition: 'margin-left 0.3s ease'
      }}>
        {bracket.length > 0 ? (
          <Bracket
            bracket={bracket}
            nodePositions={nodePositions}
            updateMatch={updateMatch}
            markFinished={markFinished}
            undoFinished={undoFinished}
            handleMatchPlayerNameEdit={handleMatchPlayerNameEdit}
          />
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