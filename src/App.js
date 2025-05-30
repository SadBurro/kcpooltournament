import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";

/** --- Capitalization Helper --- */
function capitalizeName(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0] ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '')
    .join(' ');
}

/** --- Shuffle Helper --- */
function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** --- Bracket Generation --- */
function buildBracket(players) {
  // Pad players to nearest power of two
  const rounds = Math.ceil(Math.log2(Math.max(players.length, 2)));
  const slots = 2 ** rounds;
  const byes = slots - players.length;
  const paddedPlayers = [...players, ...Array(byes).fill("BYE")];

  let matches = [];
  let matchNum = 1;

  // --- WINNERS BRACKET ---
  const winnersRounds = [];
  let prevWinners = [];
  for (let r = 1; r <= rounds; r++) {
    const currWinners = [];
    const numMatches = slots / (2 ** r);
    for (let i = 0; i < numMatches; i++) {
      let p1, p2, from = [];
      if (r === 1) {
        p1 = { name: paddedPlayers[i * 2], ref: null };
        p2 = { name: paddedPlayers[i * 2 + 1], ref: null };
      } else {
        const m1 = prevWinners[i * 2];
        const m2 = prevWinners[i * 2 + 1];
        p1 = m1 ? { name: `Winner of M${m1.matchNum}`, ref: `Winner of M${m1.matchNum}` } : { name: "BYE", ref: null };
        p2 = m2 ? { name: `Winner of M${m2.matchNum}`, ref: `Winner of M${m2.matchNum}` } : { name: "BYE", ref: null };
        if (m1) from.push(m1.id);
        if (m2) from.push(m2.id);
      }

      let winner = "", finished = false, status = "Pending";
      if (p1.name === "BYE" && p2.name === "BYE") {
        continue; // skip "no match"
      } else if (p1.name === "BYE") {
        winner = p2.name;
        finished = true;
        status = "Finished (BYE)";
      } else if (p2.name === "BYE") {
        winner = p1.name;
        finished = true;
        status = "Finished (BYE)";
      }

      const m = {
        id: `w-${r}-${i}`,
        round: r,
        col: r,
        row: i,
        bracket: "W",
        p1, p2, winner, finished, status,
        score1: "", score2: "", table: "",
        matchNum: matchNum++,
        from,
      };
      matches.push(m);
      currWinners.push(m);
    }
    winnersRounds.push(currWinners);
    prevWinners = currWinners;
  }
  const winnerFinalMatch = prevWinners[0];

  // --- LOSERS BRACKET ---
  let losersRounds = [];
  let loserMatchNum = matchNum;
  let currLosers = [];
  for (let i = 0; i < winnersRounds[0].length; i += 2) {
    const w1 = winnersRounds[0][i];
    const w2 = winnersRounds[0][i + 1];
    if (!w1 || !w2) continue;
    let p1 = (w1.p1.name !== "BYE" && w1.p2.name !== "BYE") ? { name: `Loser of M${w1.matchNum}`, ref: `Loser of M${w1.matchNum}` } : null;
    let p2 = (w2.p1.name !== "BYE" && w2.p2.name !== "BYE") ? { name: `Loser of M${w2.matchNum}`, ref: `Loser of M${w2.matchNum}` } : null;
    if (!p1 && !p2) continue;

    const m = {
      id: `l-1-${i / 2}`,
      round: 1, col: 1, row: i / 2, bracket: "L",
      p1: p1 || { name: "BYE", ref: null },
      p2: p2 || { name: "BYE", ref: null },
      winner: "", finished: false, status: "Pending",
      score1: "", score2: "", table: "",
      matchNum: loserMatchNum++,
      from: [],
    };
    matches.push(m);
    currLosers.push(m);
  }
  losersRounds.push(currLosers);

  let losersRoundsCount = 2 * rounds - 2;
  for (let r = 2; r <= losersRoundsCount; r++) {
    const prev = losersRounds[losersRounds.length - 1].slice(); // copy
    const thisRound = [];
    const isDropIn = r % 2 === 0;
    if (isDropIn) {
      const wRound = winnersRounds[r / 2] || [];
      for (let i = 0; i < wRound.length; i++) {
        const w = wRound[i];
        let lPlayer = null;
        if (w && w.p1.name !== "BYE" && w.p2.name !== "BYE") {
          lPlayer = { name: `Loser of M${w.matchNum}`, ref: `Loser of M${w.matchNum}` };
        }
        let prevMatch = prev.shift();
        if (lPlayer && prevMatch) {
          const m = {
            id: `l-${r}-${i}`,
            round: r,
            col: r,
            row: i,
            bracket: "L",
            p1: { name: `Winner of M${prevMatch.matchNum}`, ref: `Winner of M${prevMatch.matchNum}` },
            p2: lPlayer,
            winner: "",
            finished: false,
            status: "Pending",
            score1: "", score2: "", table: "",
            matchNum: loserMatchNum++,
            from: [prevMatch.id],
          };
          matches.push(m);
          thisRound.push(m);
        } else if (lPlayer) {
          const m = {
            id: `l-${r}-${i}`,
            round: r,
            col: r,
            row: i,
            bracket: "L",
            p1: lPlayer,
            p2: { name: "BYE", ref: null },
            winner: "",
            finished: false,
            status: "Pending",
            score1: "", score2: "", table: "",
            matchNum: loserMatchNum++,
            from: [],
          };
          matches.push(m);
          thisRound.push(m);
        } else if (prevMatch) {
          const m = {
            id: `l-${r}-${i}`,
            round: r,
            col: r,
            row: i,
            bracket: "L",
            p1: { name: `Winner of M${prevMatch.matchNum}`, ref: `Winner of M${prevMatch.matchNum}` },
            p2: { name: "BYE", ref: null },
            winner: "",
            finished: false,
            status: "Pending",
            score1: "", score2: "", table: "",
            matchNum: loserMatchNum++,
            from: [prevMatch.id],
          };
          matches.push(m);
          thisRound.push(m);
        }
      }
    } else {
      for (let i = 0; i < Math.floor(prev.length / 2); i++) {
        const p1 = prev[i * 2];
        const p2 = prev[i * 2 + 1];
        if (!p1 || !p2) continue;
        const m = {
          id: `l-${r}-${i}`,
          round: r,
          col: r,
          row: i,
          bracket: "L",
          p1: { name: `Winner of M${p1.matchNum}`, ref: `Winner of M${p1.matchNum}` },
          p2: { name: `Winner of M${p2.matchNum}`, ref: `Winner of M${p2.matchNum}` },
          winner: "",
          finished: false,
          status: "Pending",
          score1: "", score2: "", table: "",
          matchNum: loserMatchNum++,
          from: [p1.id, p2.id],
        };
        matches.push(m);
        thisRound.push(m);
      }
      if (prev.length % 2 === 1) {
        const carry = prev[prev.length - 1];
        const m = {
          id: `l-${r}-${thisRound.length}`,
          round: r,
          col: r,
          row: thisRound.length,
          bracket: "L",
          p1: { name: `Winner of M${carry.matchNum}`, ref: `Winner of M${carry.matchNum}` },
          p2: { name: "BYE", ref: null },
          winner: "",
          finished: false,
          status: "Pending",
          score1: "", score2: "", table: "",
          matchNum: loserMatchNum++,
          from: [carry.id],
        };
        matches.push(m);
        thisRound.push(m);
      }
    }
    losersRounds.push(thisRound);
    currLosers = [...thisRound];
  }

  // The last match in losers bracket determines the finalist
  let loserFinal = currLosers[0];
  if (!loserFinal) {
    loserFinal = losersRounds.flat().slice(-1)[0];
  }

  // --- GRAND FINAL(S) ---
  const grandFinal = {
    id: "gf-1-0",
    round: rounds + losersRoundsCount + 1,
    col: rounds + losersRoundsCount + 1,
    row: 0,
    bracket: "GF",
    p1: winnerFinalMatch ? { name: `Winner of M${winnerFinalMatch.matchNum}`, ref: `Winner of M${winnerFinalMatch.matchNum}` } : { name: "", ref: null },
    p2: loserFinal ? { name: `Winner of M${loserFinal.matchNum}`, ref: `Winner of M${loserFinal.matchNum}` } : { name: "", ref: null },
    score1: "",
    score2: "",
    status: "Pending",
    winner: "",
    table: "",
    finished: false,
    matchNum: loserMatchNum++,
    from: [winnerFinalMatch?.id, loserFinal?.id].filter(Boolean),
  };
  matches.push(grandFinal);

  const grandFinalReset = {
    id: "gf-1-reset",
    round: rounds + losersRoundsCount + 2,
    col: rounds + losersRoundsCount + 2,
    row: 0,
    bracket: "GF",
    p1: { name: `Winner of M${grandFinal.matchNum}`, ref: `Winner of M${grandFinal.matchNum}` },
    p2: { name: `Loser of M${grandFinal.matchNum}`, ref: `Loser of M${grandFinal.matchNum}` },
    score1: "",
    score2: "",
    status: "Pending",
    winner: "",
    table: "",
    finished: false,
    matchNum: loserMatchNum++,
    from: [grandFinal.id],
  };
  matches.push(grandFinalReset);

  // Clean up
  matches = matches.filter(
    m =>
      !(
        (m.bracket === "L" && (!m.p1 || m.p1.name === "TBD") && (!m.p2 || m.p2.name === "TBD")) ||
        (m.p1.name === "BYE" && m.p2.name === "BYE")
      )
  );

  // Add status for single-slot matches (advance with BYE)
  for (const m of matches) {
    if (m.bracket === "L" && (!m.p2 || m.p2.name === "BYE")) {
      m.status = "Waiting for opponent";
    }
  }

  return matches;
}

/** --- Layout Function: "Diamond" Style --- */
function getBracketNodePositions(bracket, rounds) {
  const boxW = 140, boxH = 120, roundGap = 70;
  const yBase = 40, xBase = 40;

  // Winners rounds
  const winners = bracket.filter(m => m.bracket === "W");
  let winnersByRound = [];
  for (let r = 1; r <= rounds; r++) {
    winnersByRound.push(winners.filter(m => m.round === r));
  }

  // Losers rounds
  const losers = bracket.filter(m => m.bracket === "L");
  const loserRounds = losers.reduce((max, m) => Math.max(max, m.round), 1);
  let losersByRound = [];
  for (let r = 1; r <= loserRounds; r++) {
    losersByRound.push(losers.filter(m => m.round === r));
  }

  // Positions
  let pos = {};

  // ---- WINNERS BRACKET ----
  // 1. First round: even vertical spacing
  const firstWinners = winnersByRound[0];
  const winnersCount = firstWinners.length;
  const winnersTotalHeight = winnersCount > 1 ? (winnersCount - 1) * (boxH*0.8) : 0;
  for (let i = 0; i < winnersCount; i++) {
    pos[firstWinners[i].id] = {
      x: xBase,
      y: yBase + i * (winnersTotalHeight) / (winnersCount - 1 || 1),
      w: boxW,
      h: boxH,
    };
  }
  // 2. Other rounds: center between their feeder matches
  for (let r = 1; r < winnersByRound.length; r++) {
    for (let i = 0; i < winnersByRound[r].length; i++) {
      const match = winnersByRound[r][i];
      // Figure out the previous round match IDs this match depends on
      const feederIDs = match.from;
      let centerY;
      if (feederIDs && feederIDs.length) {
        // Average y of centers of the feeder matches
        let ys = feederIDs.map(fid => {
          const prev = pos[fid];
          return prev ? prev.y + boxH / 2 : 0;
        });
        centerY = ys.reduce((a, b) => a + b, 0) / ys.length;
      } else {
        centerY = yBase;
      }
      pos[match.id] = {
        x: xBase + r * (boxW + roundGap),
        y: centerY - boxH / 2,
        w: boxW,
        h: boxH,
      };
    }
  }

  // ---- LOSERS BRACKET ----
  // Place below winners
  const losersYStart = yBase + winnersTotalHeight + 160;
  // 1. First losers round: even spacing
  const firstLosers = losersByRound[0];
  const losersCount = firstLosers.length;
  const losersTotalHeight = losersCount > 1 ? (losersCount - 1) * (boxH*0.8) : 0;
  for (let i = 0; i < losersCount; i++) {
    pos[firstLosers[i].id] = {
      x: xBase,
      y: losersYStart + i * (losersTotalHeight) / (losersCount - 1 || 1),
      w: boxW,
      h: boxH,
    };
  }
  // 2. Other losers rounds: center between feeders
  for (let r = 1; r < losersByRound.length; r++) {
    for (let i = 0; i < losersByRound[r].length; i++) {
      const match = losersByRound[r][i];
      const feederIDs = match.from;
      let centerY;
      if (feederIDs && feederIDs.length) {
        let ys = feederIDs.map(fid => {
          const prev = pos[fid];
          return prev ? prev.y + boxH / 2 : 0;
        });
        centerY = ys.reduce((a, b) => a + b, 0) / ys.length;
      } else {
        centerY = losersYStart;
      }
      pos[match.id] = {
        x: xBase + r * (boxW + roundGap),
        y: centerY - boxH / 2,
        w: boxW,
        h: boxH,
      };
    }
  }

  // ---- GRAND FINALS ----
  const gfs = bracket.filter(m => m.bracket === "GF");
  if (gfs.length > 0) {
    // Place after last winners/losers column, center vertically between
    let rightMostX = xBase + Math.max(winnersByRound.length, losersByRound.length) * (boxW + roundGap);
    let allY = [
      ...Object.values(pos).map(p => p.y + p.h / 2)
    ];
    let midY = allY.length ? allY.reduce((a, b) => a + b, 0) / allY.length : yBase;
    for (let i = 0; i < gfs.length; i++) {
      pos[gfs[i].id] = {
        x: rightMostX + i * (boxW + roundGap),
        y: midY - boxH / 2,
        w: boxW,
        h: boxH,
      };
    }
  }
  return pos;
}

/** --- SVG Connector --- */
function ConnectLine({ from, to, nodes }) {
  const a = nodes[from];
  const b = nodes[to];
  if (!a || !b) return null;
  const ax = a.x + a.w, ay = a.y + a.h / 3;
  const bx = b.x, by = b.y + b.h / 2;
  const midX = ax + (bx - ax);
  return (
    <polyline
      points={`${ax},${ay} ${midX},${ay} ${midX},${by} ${bx},${by}`}
      fill="none"
      stroke="#999"
      strokeWidth={2}
    />
  );
}

function isTournamentComplete(bracket) {
  // Find the Grand Final match (may vary by your logic)
  const gf = bracket.find(m => m.bracket === "GF" && !m.id.includes("reset"));
  const gfReset = bracket.find(m => m.id === "gf-1-reset");
  return (gf && gf.finished) || (gfReset && gfReset.finished);
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const LS_KEY = "pool-tournament-v1";
  const [playersText, setPlayersText] = useState(
    "Player1\nPlayer2\nPlayer3\nPlayer4\nPlayer5\nPlayer6\nPlayer7\nPlayer8\nPlayer9\nPlayer10\nPlayer11\nPlayer12\nPlayer13\nPlayer14\nPlayer15\nPlayer16"
  );
  const [bracket, setBracket] = useState(() => buildBracket(
    "Player1\nPlayer2\nPlayer3\nPlayer4\nPlayer5\nPlayer6\nPlayer7\nPlayer8\nPlayer9\nPlayer10\nPlayer11\nPlayer12\nPlayer13\nPlayer14\nPlayer15\nPlayer16".split("\n")
      .map(s => s.trim()).filter(Boolean).slice(0, 32)
  ));
  const fileInputRef = useRef();
  const [numPayoutPlaces, setNumPayoutPlaces] = useState(3); // default to 3
  const [payoutAmounts, setPayoutAmounts] = useState(["", "", ""]);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.playersText && data.bracket) {
          setPlayersText(data.playersText);
          setBracket(data.bracket);
        }
        if (data.numPayoutPlaces) setNumPayoutPlaces(data.numPayoutPlaces);
        if (data.payoutAmounts) setPayoutAmounts(data.payoutAmounts);
      } catch (e) { }
    }
  }, []);

  useEffect(() => {
    setBracket(prevBracket => {
      // Get latest players array
      const playerNames = playersText.split("\n").map(s => s.trim()).filter(Boolean).slice(0, 32);
      // Build a map from previous name to new name (if you're renaming, but for now, just force update)
      return prevBracket.map(match => {
        // Update p1 and p2 if they are direct player names (not Winner/Loser of or BYE)
        let newP1 = { ...match.p1 };
        let newP2 = { ...match.p2 };
        if (
          playerNames.includes(match.p1.name) &&
          !match.p1.name.startsWith("Winner of") &&
          !match.p1.name.startsWith("Loser of") &&
          match.p1.name !== "BYE"
        ) {
          // Replace p1 name with current list version
          newP1.name = playerNames.find(n => n === match.p1.name) || match.p1.name;
        }
        if (
          playerNames.includes(match.p2.name) &&
          !match.p2.name.startsWith("Winner of") &&
          !match.p2.name.startsWith("Loser of") &&
          match.p2.name !== "BYE"
        ) {
          newP2.name = playerNames.find(n => n === match.p2.name) || match.p2.name;
        }
        return { ...match, p1: newP1, p2: newP2 };
      });
    });
  }, [playersText]);
  
  useEffect(() => {
    const data = {
      playersText,
      bracket,
      numPayoutPlaces,
      payoutAmounts,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }, [playersText, bracket, numPayoutPlaces, payoutAmounts]);
  
  const simulateTournament = useCallback(() => {
    setBracket(prevBracket => {
      let bracket = prevBracket.map(m => ({ ...m, p1: { ...m.p1 }, p2: { ...m.p2 } }));

      function resolveName(ref) {
        if (!ref) return null;
        if (!ref.startsWith("Winner of") && !ref.startsWith("Loser of")) return ref;
        let num = parseInt(ref.match(/\d+/)?.[0] || "0");
        let match = bracket.find(m => m.matchNum === num);
        if (!match) return ref;
        if (ref.startsWith("Winner")) return match.winner;
        if (ref.startsWith("Loser")) {
          if (match.score1 > match.score2) return match.p2.name;
          else return match.p1.name;
        }
        return ref;
      }

      for (let m of bracket) {
        if (m.finished) continue;
        let p1Name = resolveName(m.p1.ref || m.p1.name);
        let p2Name = resolveName(m.p2.ref || m.p2.name);

        if (
          !p1Name || !p2Name ||
          p1Name === "BYE" || p2Name === "BYE" ||
          p1Name.startsWith("Winner of") || p2Name.startsWith("Winner of") ||
          p1Name.startsWith("Loser of") || p2Name.startsWith("Loser of")
        ) continue;

        let maxScore = 5, minScore = 1;
        let s1 = Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;
        let s2 = Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;
        while (s1 === s2) s2 = Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;

        let winner = s1 > s2 ? p1Name : p2Name;

        m.p1.name = p1Name;
        m.p2.name = p2Name;
        m.score1 = s1;
        m.score2 = s2;
        m.finished = true;
        m.status = "Finished";
        m.winner = winner;

        bracket.forEach(next => {
          if (next.p1.ref === `Winner of M${m.matchNum}`) next.p1.name = winner;
          if (next.p2.ref === `Winner of M${m.matchNum}`) next.p2.name = winner;
          let loser = s1 > s2 ? p2Name : p1Name;
          if (next.p1.ref === `Loser of M${m.matchNum}`) next.p1.name = loser;
          if (next.p2.ref === `Loser of M${m.matchNum}`) next.p2.name = loser;
        });
      }
      return bracket;
    });
  }, []); // <--- NO dependencies so function is stable

  const players = useMemo(
    () => playersText.split("\n").map(s => capitalizeName(s.trim())).filter(Boolean).slice(0, 32),
    [playersText]
  );
  const rounds = Math.ceil(Math.log2(Math.max(players.length, 2)));

  function handleShuffleBracket() {
    if (
      bracket &&
      bracket.some(m => (
        (m.score1 && m.score1 !== "" && !isNaN(Number(m.score1))) ||
        (m.score2 && m.score2 !== "" && !isNaN(Number(m.score2))) ||
        (m.finished && !m.status?.toLowerCase().includes("bye") && m.status !== "No Match")
      ))
    ) {
      if (!window.confirm("A bracket has already been created and may have scores entered. Are you sure you want to reshuffle and start over?")) {
        return;
      }
    }
    const playerArr = playersText.split("\n").map(s => s.trim()).filter(Boolean).slice(0, 32);
    const shuffled = shuffleArray(playerArr);
    setPlayersText(shuffled.join("\n"));
    setBracket(buildBracket(shuffled));
  }
  function exportTournament() {
    const data = {
      playersText,
      bracket,
      numPayoutPlaces,
      payoutAmounts,
    };
    const now = new Date();
    const pad = n => String(n).padStart(2, "0");
    const fileName = `tournament_${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.json`;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  function importTournament(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.playersText && data.bracket) {
          setPlayersText(data.playersText);
          setBracket(data.bracket);
        }
        if (data.numPayoutPlaces) setNumPayoutPlaces(data.numPayoutPlaces);
        if (data.payoutAmounts) setPayoutAmounts(data.payoutAmounts);
      } catch (err) {
        alert("Failed to load tournament file.");
      }
    };
    reader.readAsText(file);
  }
 
  function handlePlayersChange(e) {
    const newText = e.target.value;
    const oldNames = playersText.split('\n').map(s => capitalizeName(s.trim())).filter(Boolean);
    const newNames = newText.split('\n').map(s => capitalizeName(s.trim())).filter(Boolean);

    // Build a map: oldName -> newName (by position)
    const nameMap = {};
    for (let i = 0; i < Math.max(oldNames.length, newNames.length); i++) {
      if (oldNames[i] && newNames[i] && oldNames[i] !== newNames[i]) {
        nameMap[oldNames[i]] = newNames[i];
      }
    }

    setPlayersText(newText);

    if (Object.keys(nameMap).length > 0) {
      setBracket(prevBracket =>
        prevBracket.map(match => {
          // Deep clone match to avoid mutating state
          const newMatch = {
            ...match,
            p1: { ...match.p1 },
            p2: { ...match.p2 },
          };

          // Update player names wherever they appear
          if (nameMap[newMatch.p1.name]) newMatch.p1.name = nameMap[newMatch.p1.name];
          if (nameMap[newMatch.p2.name]) newMatch.p2.name = nameMap[newMatch.p2.name];
          if (nameMap[newMatch.winner]) newMatch.winner = nameMap[newMatch.winner];

          // Also update downstream matches where the old player name was already advanced
          // (if a previous match was finished with the old name, propagate)
          // Only update if the name is NOT "Winner of M#" or "Loser of M#"
          if (nameMap[newMatch.p1.name] &&
            !newMatch.p1.name.startsWith("Winner of") &&
            !newMatch.p1.name.startsWith("Loser of") &&
            newMatch.p1.name !== "BYE") {
            newMatch.p1.name = nameMap[newMatch.p1.name];
          }
          if (nameMap[newMatch.p2.name] &&
            !newMatch.p2.name.startsWith("Winner of") &&
            !newMatch.p2.name.startsWith("Loser of") &&
            newMatch.p2.name !== "BYE") {
            newMatch.p2.name = nameMap[newMatch.p2.name];
          }

          // Also, sometimes 'winner' is used as input to downstream matches, so update it
          if (nameMap[newMatch.winner]) newMatch.winner = nameMap[newMatch.winner];

          return newMatch;
        })
      );
    }
  }
 
  function handlePlayersBlur(e) {
    const lines = e.target.value
      .split('\n')
      .map(line => capitalizeName(line.trim()))
      .filter(Boolean)
      .join('\n');
    if (lines !== playersText) setPlayersText(lines);
  }

  const nodePositions = useMemo(
    () => getBracketNodePositions(bracket, rounds),
    [bracket, rounds]
  );

  function updateMatch(id, changes) {
    setBracket(prev =>
      prev.map(m =>
        m.id === id ? { ...m, ...changes } : m
      )
    );
  }
  function startMatch(match) {
    setBracket(prev =>
      prev.map(m =>
        m.id === match.id
          ? { ...m, status: "Playing" }
          : m
      )
    );
  }

  function markFinished(match) {
    if (
      match.score1 === "" ||
      match.score2 === "" ||
      match.score1 === null ||
      match.score2 === null ||
      isNaN(Number(match.score1)) ||
      isNaN(Number(match.score2)) ||
      match.finished
    ) return;
      
    // Convert to numbers for comparison
    const score1 = Number(match.score1);
    const score2 = Number(match.score2);

    let winner, loser, winnerRef, loserRef;

    // Check for tie
    if (score1 === score2) {
      alert("You can't have ties!");
      return;
    }

    if (Number(match.score1) > Number(match.score2)) {
      winner = match.p1.name;
      winnerRef = match.p1.ref ?? `Winner of M${match.matchNum}`;
      loser = match.p2.name;
      loserRef = match.p2.ref ?? `Loser of M${match.matchNum}`;
    } else {
      winner = match.p2.name;
      winnerRef = match.p2.ref ?? `Winner of M${match.matchNum}`;
      loser = match.p1.name;
      loserRef = match.p1.ref ?? `Loser of M${match.matchNum}`;
    }

    setBracket(prev => {
      let next = prev.map(m => ({
        ...m,
        p1: { ...m.p1 },
        p2: { ...m.p2 }
      }));
      next.forEach(m => {
        if (m.p1.ref === `Winner of M${match.matchNum}`) m.p1.name = winner;
        if (m.p2.ref === `Winner of M${match.matchNum}`) m.p2.name = winner;
        if (m.p1.ref === `Loser of M${match.matchNum}`) m.p1.name = loser;
        if (m.p2.ref === `Loser of M${match.matchNum}`) m.p2.name = loser;
      });
      return next.map(m =>
        m.id === match.id
          ? { ...m, finished: true, winner, status: "Finished"}
          : m
      );
    });
  }

  function undoFinished(match) {
    setBracket(prev => {
      let next = prev.map(m => ({
        ...m,
        p1: { ...m.p1 },
        p2: { ...m.p2 }
      }));

      let winner = "", loser = "";
      if (match.finished && match.score1 && match.score2) {
        if (Number(match.score1) > Number(match.score2)) {
          winner = match.p1.name;
          loser = match.p2.name;
        } else {
          winner = match.p2.name;
          loser = match.p1.name;
        }
      }
      const winnerRef = `Winner of M${match.matchNum}`;
      const loserRef = `Loser of M${match.matchNum}`;

      function resetDownstream(id) {
        next.forEach(m => {
          if (m.from && m.from.includes(id)) {
            let changed = false;
            if (m.p1.ref === winnerRef) {
              m.p1.name = winnerRef;
              changed = true;
            }
            if (m.p2.ref === winnerRef) {
              m.p2.name = winnerRef;
              changed = true;
            }
            if (m.p1.ref === loserRef) {
              m.p1.name = loserRef;
              changed = true;
            }
            if (m.p2.ref === loserRef) {
              m.p2.name = loserRef;
              changed = true;
            }
            if (changed) {
              m.score1 = "";
              m.score2 = "";
              m.finished = false;
              m.status = "Pending";
              m.winner = "";
              resetDownstream(m.id);
            }
          }
        });
      }
      resetDownstream(match.id);
      return next.map(m =>
        m.id === match.id
          ? { ...m, finished: false, status: "Playing", winner: "", table: m.table, score1: "", score2: "" }
          : m
      );
    });
  }

  const connectors = [];
  bracket.forEach(m => {
    if (m.from) {
      m.from.forEach(src => {
        if (src && nodePositions[src] && nodePositions[m.id]) {
          connectors.push(
            <ConnectLine key={src + "-" + m.id} from={src} to={m.id} nodes={nodePositions} />
          );
        }
      });
    }
  });

  const maxY = Math.max(...Object.values(nodePositions).map(pos => pos.y + pos.h));
  const svgHeight = Math.max(1800, maxY + 100);

  function handleMatchPlayerNameEdit(oldName, newName) {
    newName = capitalizeName(newName);
    if (!newName.trim()) return; // Don’t allow blank

    // 1. Update playersText if name exists there
    setPlayersText(ptxt => {
      let lines = ptxt.split('\n');
      let changed = false;
      lines = lines.map(line => {
        if (capitalizeName(line.trim()) === oldName) {
          changed = true;
          return newName;
        }
        return line;
      });
      return changed ? lines.join('\n') : ptxt;
    });

    // 2. Update all matches with this player
    setBracket(prevBracket =>
      prevBracket.map(match => {
        // Deep clone match
        const newMatch = {
          ...match,
          p1: { ...match.p1 },
          p2: { ...match.p2 }
        };
        if (
          newMatch.p1.name === oldName &&
          !newMatch.p1.name.startsWith("Winner of") &&
          !newMatch.p1.name.startsWith("Loser of") &&
          newMatch.p1.name !== "BYE"
        ) {
          newMatch.p1.name = newName;
        }
        if (
          newMatch.p2.name === oldName &&
          !newMatch.p2.name.startsWith("Winner of") &&
          !newMatch.p2.name.startsWith("Loser of") &&
          newMatch.p2.name !== "BYE"
        ) {
          newMatch.p2.name = newName;
        }
        // Also update 'winner' field if needed
        if (newMatch.winner === oldName) newMatch.winner = newName;
        return newMatch;
      })
    );
  }
  
  function renderPlayerLabel(m, p, idx) {
    // Only allow editing real player names (not BYE or placeholders)
    if (
      typeof p.name === "string" &&
      (p.name.startsWith("Winner of") ||
        p.name.startsWith("Loser of") ||
        p.name === "BYE")
    ) {
      return <span style={{ color: "#b33", fontSize: 13 }}>{p.name}</span>;
    }
    return (
      <input
        value={p.name}
        style={{ width: 84, marginRight: 2 }}
        disabled={false}
        onChange={e => handleMatchPlayerNameEdit(p.name, e.target.value)}
        onBlur={e =>
          e.target.value !== capitalizeName(e.target.value) &&
          handleMatchPlayerNameEdit(p.name, capitalizeName(e.target.value))
        }
      />
    );
  }
  
  function getStandings(bracket) {
    // Find both Grand Final matches
    const gf = bracket.find(m => m.bracket === "GF" && !m.id.includes("reset"));
    const gfReset = bracket.find(m => m.id === "gf-1-reset" || (m.bracket === "GF" && m.id.includes("reset")));
  
    let places = [];
    let placed = new Set();
  
    // --- 1st/2nd: Use latest completed grand final (reset or not) ---
    let champ = null, runnerUp = null;
    if (gfReset && gfReset.finished) {
      champ = gfReset.winner;
      runnerUp = (gfReset.p1.name === champ ? gfReset.p2.name : gfReset.p1.name);
    } else if (gf && gf.finished) {
      champ = gf.winner;
      runnerUp = (gf.p1.name === champ ? gf.p2.name : gf.p1.name);
    }
    if (champ) {
      places.push([champ]); // 1st
      placed.add(champ);
    }
    if (runnerUp) {
      places.push([runnerUp]); // 2nd
      placed.add(runnerUp);
    }
  
    // --- 3rd: Losers Final (the last completed match in Loser bracket) ---
    const loserFinal = bracket.filter(m => m.bracket === "L" && m.finished).slice(-1)[0];
    if (loserFinal) {
      let third = loserFinal.p1.name === loserFinal.winner ? loserFinal.p2.name : loserFinal.p1.name;
      if (third && !placed.has(third)) {
        places.push([third]);
        placed.add(third);
      }
    }

    // --- Collect eliminated players by round ---
    // For each finished losers bracket match, the *loser* is eliminated at that round.
    let elimByRound = {};
    bracket.forEach(m => {
      if (m.bracket === "L" && m.finished) {
        let loserName = (Number(m.score1) > Number(m.score2)) ? m.p2.name : m.p1.name;
        if (!elimByRound[m.round]) elimByRound[m.round] = [];
        elimByRound[m.round].push(loserName);
      }
    });

    // The order of elimination is: latest losers rounds = higher place
    const elimRounds = Object.keys(elimByRound).map(Number).sort((a, b) => b - a);
    for (let round of elimRounds) {
      // Only add those not already placed (not top 3)
      const eliminated = elimByRound[round].filter(name => name && !placed.has(name));
      if (eliminated.length) {
        places.push(eliminated);
        eliminated.forEach(name => placed.add(name));
      }
    }

    // All players who never lost (byes, etc) and not yet placed = lowest places (first eliminated)
    let allPlayers = new Set();
    bracket.forEach(m => {
      if (m.p1 && typeof m.p1.name === "string" && m.p1.name && m.p1.name !== "BYE" && !m.p1.name.startsWith("Winner of") && !m.p1.name.startsWith("Loser of"))
        allPlayers.add(m.p1.name);
      if (m.p2 && typeof m.p2.name === "string" && m.p2.name && m.p2.name !== "BYE" && !m.p2.name.startsWith("Winner of") && !m.p2.name.startsWith("Loser of"))
        allPlayers.add(m.p2.name);
    });
    const neverPlaced = Array.from(allPlayers).filter(name => !placed.has(name));
    if (neverPlaced.length) places.push(neverPlaced);

    return places;
  }

  function getPlaceLabel(idx) {
    if (idx === 0) return "First";
    if (idx === 1) return "Second";
    if (idx === 2) return "Third";
    if (idx === 3) return "Fourth";
    if (idx === 4) return "Fifth";
    if (idx === 5) return "Sixth";
    if (idx === 6) return "Seventh";
    if (idx === 7) return "Eighth";
    return `${idx + 1}th`;
  } 
  
  return (
    <div style={{fontFamily: "sans-serif" }}>
      <nav className="navbar">
        <div className="navbar-left">
          Kansas City Pool Tournament
        </div>
        {/* Future nav links can go here */}
      </nav>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 0}}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
          {/* Toggle button */}
          <button
            onClick={() => setSidebarOpen((open) => !open)}
            className="sidebar-toggle"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? "×" : "+"}
          </button>
        </div>  
        <div className={`sidebar${sidebarOpen ? " open" : ""}`}>

          {/* Sidebar Content, only render if open */}
          {sidebarOpen && (
            <div className="sidebar-content" 
            style={{
              height: "100%",
              width: "100%",
              boxSizing: "border-box",
              padding: "1.3rem 1rem",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
              <div>
                <b style={{
                  padding: "7px 20px",
                  fontSize: 16,
                  borderRadius: 9,
                  background: "#48ACD3",
                  color: "#fff",
                  border: "2px solid #000000",
                  boxShadow: "2px 2px 7px #ddd",
                  marginBottom: 10
                }}>Enter Players Below</b>
                <br />
                <br />
                <textarea
                  value={playersText}
                  onChange={handlePlayersChange}
                  onBlur={handlePlayersBlur}
                  rows={12}
                  style={{ 
                    width: 180, 
                    marginBottom: 30,
                    resize: "none", 
                    background: "#fff", 
                    color: "#111", 
                    borderRadius: 9, 
                    border: "2px solid #000000",
                    boxShadow: "2px 2px 7px #ddd", 
                    fontSize: 15, 
                    padding: 7, 
                  }}
                />
              </div>
              <button
                style={{
                  padding: "7px 20px",
                  fontSize: 16,
                  fontWeight: "bold",
                  borderRadius: 9,
                  background: "#48ACD3",
                  color: "#fff",
                  border: "2px solid #000000",
                  boxShadow: "2px 2px 7px #ddd",
                  cursor: "pointer",
                  width: 200,
                  marginBottom: 10,
                }}
                onClick={handleShuffleBracket}
              >
                Shuffle Bracket
              </button>
              <button
                style={{
                  padding: "7px 20px",
                  fontSize: 16,
                  fontWeight: "bold",
                  borderRadius: 9,
                  background: "#48ACD3",
                  color: "#fff",
                  border: "2px solid #000000",
                  boxShadow: "2px 2px 7px #ddd",
                  cursor: "pointer",
                  display: "block",
                  width: 200,
                  marginBottom: 10,
                }}
                onClick={exportTournament}
              >
                Export Tournament
              </button>
              <button
                style={{
                  padding: "7px 20px",
                  fontSize: 16,
                  fontWeight: "bold",
                  borderRadius: 9,
                  background: "#48ACD3",
                  color: "#fff",
                  border: "2px solid #000000",
                  boxShadow: "2px 2px 7px #ddd",
                  cursor: "pointer",
                  display: "block",
                  width: 200
                }}
                onClick={() => fileInputRef.current.click()}
              >
                Load Tournament
              </button>
              <input
                type="file"
                accept="application/json"
                style={{ display: "none" }}
                ref={fileInputRef}
                onChange={importTournament}
              />
              <div
                style={{
                  marginTop: 30,
                  background: "#fff",
                  border: "2px solid #335",
                  borderRadius: 10,
                  boxShadow: "2px 2px 7px #ddd",
                  padding: 14,
                  width: 170,
                  color: "#222",
                }}
              >
                <div style={{fontWeight: "bold", fontSize: 18, marginBottom: 10, textAlign: "center", color: "#243248" }}>
                  Standings
                </div>
                {isTournamentComplete(bracket) && (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      {(() => {
                        const standings = getStandings(bracket);
                        const rows = [];
                        let count = 0;
                        for (let idx = 0; idx < standings.length && count < numPayoutPlaces; idx++) {
                          let group = standings[idx];
                          let place = idx + 1;
                          let placeLabel = `${place}th`;
                          if (place === 1) placeLabel = "1st";
                          else if (place === 2) placeLabel = "2nd";
                          else if (place === 3) placeLabel = "3rd";
                          else if (place % 10 === 1 && place !== 11) placeLabel = `${place}st`;
                          else if (place % 10 === 2 && place !== 12) placeLabel = `${place}nd`;
                          else if (place % 10 === 3 && place !== 13) placeLabel = `${place}rd`;
                          let color = "#333";
                          if (idx === 0) color = "#FFD700";
                          else if (idx === 1) color = "#C0C0C0";
                          else if (idx === 2) color = "#CD7F32";
                          for (let player of group) {
                            if (count >= numPayoutPlaces) break;
                            rows.push(
                              <tr key={player}>
                                <td style={{
                                  fontWeight: "bold",
                                  color,
                                  padding: "2px 8px",
                                  fontSize: idx < 3 ? 17 : 15,
                                }}>
                                  {placeLabel}
                                </td>
                                <td style={{
                                  color,
                                  fontWeight: idx < 3 ? "bold" : "normal",
                                  padding: "2px 4px",
                                  fontSize: idx < 3 ? 16 : 15,
                                }}>
                                  {player}
                                </td>
                              </tr>
                            );
                            count++;
                          }
                        }
                        return rows;
                      })()}
                    </tbody>
                  </table>
                )}
              </div>
              <div
                style={{
                  marginTop: 30,
                  background: "#fff",
                  border: "2px solid #335",
                  borderRadius: 10,
                  boxShadow: "2px 2px 7px #ddd",
                  padding: 14,
                  width: 170,
                  color: "#222",
                  marginBottom: 16
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10, textAlign: "center", color: "#243248" }}>
                  Payout
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>
                    <span style={{ marginRight: 6 }}>Places Paid:</span>
                    <input
                      type="number"
                      min={1}
                      max={16}
                      value={numPayoutPlaces}
                      style={{ width: 48, fontSize: 15, borderRadius: 6, border: "1px solid #bbb", textAlign: "center" }}
                      onChange={e => {
                        let n = Math.max(1, Math.min(16, Number(e.target.value)));
                        setNumPayoutPlaces(n);
                        setPayoutAmounts(prev => {
                          let next = prev.slice(0, n);
                          while (next.length < n) next.push("");
                          return next;
                        });
                      }}
                    />
                  </label>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {Array.from({ length: numPayoutPlaces }).map((_, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: "bold", padding: "2px 8px", fontSize: 15 }}>
                          {getPlaceLabel(idx)}
                        </td>
                        <td>
                          <input
                            type="text"
                            value={payoutAmounts[idx] || ""}
                            style={{ width: 64, fontSize: 15, borderRadius: 5, border: "1px solid #bbb", textAlign: "right" }}
                            onChange={e => {
                              const v = e.target.value;
                              setPayoutAmounts(payoutAmounts => {
                                const arr = payoutAmounts.slice();
                                arr[idx] = v;
                                return arr;
                              });
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* <button
                style={{
                  padding: "7px 20px",
                  fontSize: 16,
                  fontWeight: "bold",
                  borderRadius: 9,
                  background: "#ff9800",
                  color: "#fff",
                  border: "2px solid #000000",
                  boxShadow: "2px 2px 7px #ddd",
                  cursor: "pointer",
                  display: "block",
                  width: 200,
                  marginBottom: 10,
                }}
                onClick={simulateTournament}
              >
                Simulate Tournament
              </button> */}
            </div>
          )}
        </div>
        <div
          style={{
            position: "relative",
            width: 2400,
            height: 1800,
            marginLeft: sidebarOpen ? "18rem" : "2.4rem",
            transition: "margin-left 0.25s"
          }}
          className="bracket-container"
        >
          <svg
            width={2400}
            height={svgHeight}
            style={{
              position: "absolute",
              zIndex: 0,
              pointerEvents: "none",
            }}
          >
            <defs>
              <marker
                id="arrow"
                markerWidth="8"
                markerHeight="8"
                refX="8"
                refY="4"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L8,4 L0,8" fill="#999" />
              </marker>
            </defs>
            {connectors}
          </svg>
          {bracket.map(m => {
            const pos = nodePositions[m.id];
            const isReady = (
              !m.finished &&
              !m.table &&
              m.p1 &&
              m.p2 &&
              typeof m.p1.name === "string" &&
              typeof m.p2.name === "string" &&
              !m.p1.name.startsWith("Winner of") &&
              !m.p2.name.startsWith("Winner of") &&
              !m.p1.name.startsWith("Loser of") &&
              !m.p2.name.startsWith("Loser of") &&
              !["TBD", "BYE"].includes(m.p1.name) &&
              !["TBD", "BYE"].includes(m.p2.name)
            );
            return (
              <div
                key={m.id}
                style={{
                  position: "absolute",
                  left: pos.x,
                  top: pos.y,
                  width: 180,
                  minHeight: 52,
                  zIndex: 1,
                  background: "#fff",
                  border: "2px solid #335",
                  borderRadius: 10,
                  padding: 6,
                  boxShadow: "2px 2px 7px #ddd",
                  overflow: "visible",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "stretch",
                  fontSize: 15,
                }}
              >
                {/* Match # - vertical, bold */}
                <div style={{
                  fontWeight: 700,
                  width: 34,
                  marginRight: 7,
                  color: "#224",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end"
                }}>
                  M{m.matchNum}
                </div>
                {/* Right: player + score stacked */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
                    {renderPlayerLabel(m, m.p1, 1)}
                    <input
                      value={m.score1}
                      style={{ width: 28, marginLeft: 2, fontSize: 15 }}
                      type="number"
                      min="0"
                      onChange={e => updateMatch(m.id, { score1: Math.max(0, Number(e.target.value)) })}
                      disabled={m.finished}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
                    {renderPlayerLabel(m, m.p2, 2)}
                    <input
                      value={m.score2}
                      style={{ width: 28, marginLeft: 2, fontSize: 15 }}
                      type="number"
                      min="0"
                      onChange={e => updateMatch(m.id, { score2: Math.max(0, Number(e.target.value)) })}
                      disabled={m.finished}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", marginTop: 1 }}>
                    <span style={{ color: "#888", fontSize: 13, marginRight: 2 }}>Table</span>
                    <input
                      style={{ width: 24, marginRight: 4, fontSize: 13 }}
                      value={m.table}
                      onChange={e => updateMatch(m.id, { table: e.target.value })}
                      disabled={m.finished}
                    />
                    
                    {!m.finished &&
                      m.score1 !== "" &&
                      m.score2 !== "" &&
                      !isNaN(Number(m.score1)) &&
                      !isNaN(Number(m.score2)) && (
                        <button
                          style={{
                            fontSize: 12,
                            padding: "2px 8px",
                            borderRadius: 5,
                            background: "#398",
                            color: "#fff",
                            border: 0,
                            cursor: "pointer",
                            marginLeft: 2,
                          }}
                          onClick={() => markFinished(m)}
                        >
                          Finalize
                        </button>
                      )}
                    {m.finished && (
                      <button
                        style={{
                          fontSize: 12,
                          padding: "2px 8px",
                          borderRadius: 5,
                          background: "#e44",
                          color: "#fff",
                          border: 0,
                          cursor: "pointer",
                          marginLeft: 4,
                        }}
                        onClick={() => undoFinished(m)}
                      >
                        Undo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
