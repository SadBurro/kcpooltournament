import React, { useState, useMemo } from "react";
import { EliminationBracket } from "react-swiss";

// Config: Change these for your tournament
const PLAYER_NAMES = [
  "Alice", "Bob", "Carol", "Dave",
  "Eve", "Frank", "Grace", "Hank"
];
const TABLE_NUMBERS = ["1", "2", "3", "4"]; // can be numbers or names

// -- Bracket generation helpers --
function createInitialMatches(players) {
  // For 8 players: 4 matches in round 1, 2 in round 2, 1 in final
  const matches = [];
  // Winners round 1
  for (let i = 0; i < players.length; i += 2) {
    matches.push({
      id: `W1-${i/2 + 1}`,
      round: 1,
      bracket: "winners",
      player1: players[i],
      player2: players[i+1],
      table: null,
      winner: null,
      loserGoesTo: null // to be filled
    });
  }
  // Additional matches (to be filled after progression)
  return matches;
}

// -- Table Assignment Logic --
function assignTables(matches, tableNumbers) {
  // Reuse tables only for matches currently "in play"
  let tablesAvailable = [...tableNumbers];
  const tableAssignments = {};
  // Find all currently running (not finished) matches needing a table
  matches.forEach(match => {
    if (
      match.state === "READY" &&
      !match.winner &&
      match.player1 &&
      match.player2 &&
      match.player1 !== "BYE" &&
      match.player2 !== "BYE"
    ) {
      // Assign next free table, or mark as waiting
      if (tablesAvailable.length > 0) {
        tableAssignments[match.id] = tablesAvailable.shift();
      } else {
        tableAssignments[match.id] = "Waiting for table";
      }
    }
  });
  return tableAssignments;
}

// -- Progression & Bracket State --
function generateBracketState(players, tableNumbers, matchResults) {
  // For demo: 8-player double elim with 2 rounds and finals
  // You'll want to expand this logic for 16/32+ players.
  let matches = [];

  // Round 1
  let r1 = [];
  for (let i = 0; i < players.length; i += 2) {
    const id = `W1-${i/2 + 1}`;
    const winner = matchResults[id] || null;
    r1.push({ id, round: 1, bracket: "winners", player1: players[i], player2: players[i+1], winner, state: "READY" });
  }

  // Round 2
  let r2 = [];
  for (let i = 0; i < r1.length; i += 2) {
    const id = `W2-${i/2 + 1}`;
    const p1 = r1[i].winner || null;
    const p2 = r1[i+1]?.winner || null;
    const ready = p1 && p2 && p1 !== "BYE" && p2 !== "BYE";
    r2.push({ id, round: 2, bracket: "winners", player1: p1, player2: p2, winner: matchResults[id] || null, state: ready ? "READY" : "WAITING" });
  }

  // Finals (Winners)
  const wFinalId = `W-Final`;
  const p1 = r2[0]?.winner || null;
  const p2 = r2[1]?.winner || null;
  const wFinalReady = p1 && p2 && p1 !== "BYE" && p2 !== "BYE";
  let wFinal = {
    id: wFinalId,
    round: 3,
    bracket: "winners",
    player1: p1,
    player2: p2,
    winner: matchResults[wFinalId] || null,
    state: wFinalReady ? "READY" : "WAITING"
  };

  // Losers bracket (simple for demo, not full double elim logic)
  // In production, expand with proper loser mapping!
  let losers = [];
  // First round of losers: losers from round 1
  for (let i = 0; i < r1.length; i += 2) {
    const l1 = r1[i];
    const l2 = r1[i+1];
    const loser1 = l1.winner ? (l1.winner === l1.player1 ? l1.player2 : l1.player1) : null;
    const loser2 = l2.winner ? (l2.winner === l2.player1 ? l2.player2 : l2.player1) : null;
    const id = `L1-${i/2 + 1}`;
    const ready = loser1 && loser2 && loser1 !== "BYE" && loser2 !== "BYE";
    losers.push({
      id,
      round: 1,
      bracket: "losers",
      player1: loser1,
      player2: loser2,
      winner: matchResults[id] || null,
      state: ready ? "READY" : "WAITING"
    });
  }
  // Second round of losers
  let l2round = [];
  for (let i = 0; i < losers.length; i += 2) {
    const l1 = losers[i];
    const l2 = losers[i+1];
    const id = `L2-${i/2 + 1}`;
    const p1 = l1.winner || null;
    const p2 = l2.winner || null;
    const ready = p1 && p2 && p1 !== "BYE" && p2 !== "BYE";
    l2round.push({
      id,
      round: 2,
      bracket: "losers",
      player1: p1,
      player2: p2,
      winner: matchResults[id] || null,
      state: ready ? "READY" : "WAITING"
    });
  }

  // Losers final
  const lFinalId = `L-Final`;
  const lFinalP1 = l2round[0]?.winner || null;
  const lFinalP2 = l2round[1]?.winner || null;
  const lFinalReady = lFinalP1 && lFinalP2 && lFinalP1 !== "BYE" && lFinalP2 !== "BYE";
  let lFinal = {
    id: lFinalId,
    round: 3,
    bracket: "losers",
    player1: lFinalP1,
    player2: lFinalP2,
    winner: matchResults[lFinalId] || null,
    state: lFinalReady ? "READY" : "WAITING"
  };

  // Grand final
  let gFinal = {
    id: "G-Final",
    round: 4,
    bracket: "grand",
    player1: wFinal.winner || null,
    player2: lFinal.winner || null,
    winner: matchResults["G-Final"] || null,
    state: (wFinal.winner && lFinal.winner) ? "READY" : "WAITING"
  };

  // Concatenate all matches for display
  matches = [
    ...r1, ...r2, wFinal,
    ...losers, ...l2round, lFinal,
    gFinal
  ];

  // Assign tables (auto)
  const tableAssignments = assignTables(matches, tableNumbers);

  // Attach table info/status to each match
  matches = matches.map(match => ({
    ...match,
    table: match.state === "READY" && !match.winner && tableAssignments[match.id]
      ? tableAssignments[match.id]
      : (match.state === "WAITING" ? "Waiting for players" : (match.winner ? "Finished" : ""))
  }));

  return matches;
}

// --- UI Components ---
function CustomMatch({ match, onSetWinner }) {
  return (
    <div style={{
      padding: 8,
      background: "#eef5fa",
      borderRadius: 6,
      minWidth: 120,
      border: "1px solid #8cbede",
      margin: 2
    }}>
      <div>
        <b>{match.player1 || "TBD"}</b> vs <b>{match.player2 || "TBD"}</b>
      </div>
      <div>Table: <b>{match.table || "TBD"}</b></div>
      <div style={{ marginTop: 8 }}>
        <button
          onClick={() => onSetWinner(match.id, match.player1)}
          disabled={!match.player1 || match.winner || match.player1 === "BYE"}
        >Win {match.player1}</button>
        <button
          onClick={() => onSetWinner(match.id, match.player2)}
          disabled={!match.player2 || match.winner || match.player2 === "BYE"}
          style={{ marginLeft: 4 }}
        >Win {match.player2}</button>
      </div>
      {match.winner && (
        <div style={{ color: "#090", marginTop: 4 }}>
          Winner: <b>{match.winner}</b>
        </div>
      )}
      {match.table === "Waiting for table" && <div style={{ color: "#b00" }}>Waiting for table</div>}
      {match.table === "Waiting for players" && <div style={{ color: "#a80" }}>Waiting for players</div>}
    </div>
  );
}

export default function App() {
  // Track only match results; full bracket state is recomputed
  const [matchResults, setMatchResults] = useState({});

  // Bracket is generated based on players, tables, and match results
  const matches = useMemo(
    () => generateBracketState(PLAYER_NAMES, TABLE_NUMBERS, matchResults),
    [matchResults]
  );

  // Handler: Set winner for a match, which auto-progresses bracket
  const handleSetWinner = (matchId, winner) => {
    setMatchResults(results => ({
      ...results,
      [matchId]: winner
    }));
  };

  return (
    <div style={{ padding: 32, overflowX: "auto" }}>
      <h2>Pool Tournament Double Elimination Bracket</h2>
      <div style={{ marginBottom: 12 }}>
        <b>Tables:</b> {TABLE_NUMBERS.join(", ")}
      </div>
      <EliminationBracket
        matches={matches}
        renderMatch={props => (
          <CustomMatch match={props.match} onSetWinner={handleSetWinner} />
        )}
        rounds={4}
        type="double"
      />
      <div style={{ marginTop: 24, fontSize: 14, color: "#666" }}>
        <b>How to Use:</b> Click the winner for each match. Table numbers are auto-assigned and will be reused as soon as a match finishes. If no table is free, matches are marked as <span style={{ color: "#b00" }}>Waiting for table</span>.
      </div>
    </div>
  );
}
