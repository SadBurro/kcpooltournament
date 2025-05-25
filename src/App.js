import React, { useState, useMemo, useEffect, useRef } from "react";

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
        score1: "0", score2: "0", table: "",
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
      score1: "0", score2: "0", table: "",
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
            score1: "0", score2: "0", table: "",
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
            score1: "0", score2: "0", table: "",
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
            score1: "0", score2: "0", table: "",
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
          score1: "0", score2: "0", table: "",
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
          score1: "0", score2: "0", table: "",
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
  const boxW = 140, boxH = 120, roundGap = 70, matchGap = 32;
  const winners = bracket.filter(m => m.bracket === "W");
  const losers = bracket.filter(m => m.bracket === "L");
  const gfs = bracket.filter(m => m.bracket === "GF");

  let winnersByRound = [];
  for (let r = 1; r <= rounds; r++) {
    winnersByRound.push(winners.filter(m => m.round === r));
  }
  const loserRounds = losers.reduce((max, m) => Math.max(max, m.round), 1);
  let losersByRound = [];
  for (let r = 1; r <= loserRounds; r++) {
    losersByRound.push(losers.filter(m => m.round === r));
  }
  let pos = {};
  let yBase = 40, xBase = 40;
  for (let r = 0; r < winnersByRound.length; r++) {
    const matchesInRound = winnersByRound[r];
    let spread = (boxH + matchGap) * (winnersByRound[0].length / matchesInRound.length);
    for (let i = 0; i < matchesInRound.length; i++) {
      pos[matchesInRound[i].id] = {
        x: xBase + r * (boxW + roundGap),
        y: yBase + i * spread,
        w: boxW,
        h: boxH,
      };
    }
  }
  const winnersHeight = yBase + (winnersByRound[0].length) * (boxH + matchGap);
  let loserYStart = winnersHeight + 80;
  for (let lr = 0; lr < losersByRound.length; lr++) {
    const matchesInRound = losersByRound[lr];
    let col = lr;
    let spread = (boxH + matchGap) * (losersByRound[0].length / matchesInRound.length);
    for (let i = 0; i < matchesInRound.length; i++) {
      pos[matchesInRound[i].id] = {
        x: xBase + col * (boxW + roundGap),
        y: loserYStart + i * spread,
        w: boxW,
        h: boxH,
      };
    }
  }
  if (gfs.length > 0) {
    let gfX = xBase + (winnersByRound.length + losersByRound.length) * (boxW + roundGap) / 2;
    let gfY = yBase + (winnersByRound[0].length / 2) * (boxH + matchGap);
    for (let i = 0; i < gfs.length; i++) {
      pos[gfs[i].id] = {
        x: gfX + i * (boxW + roundGap),
        y: gfY,
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
  const ax = a.x + a.w, ay = a.y + a.h / 2;
  const bx = b.x, by = b.y + b.h / 2;
  const midX = ax + (bx - ax) * 0.5;
  return (
    <polyline
      points={`${ax},${ay} ${midX},${ay} ${midX},${by} ${bx},${by}`}
      fill="none"
      stroke="#999"
      strokeWidth={2}
    />
  );
}

export default function App() {
  const LS_KEY = "pool-tournament-v1";
  const [playersText, setPlayersText] = useState(
    "Player1\nPlayer2\nPlayer3\nPlayer4\nPlayer5\nPlayer6\nPlayer7\nPlayer8\nPlayer9\nPlayer10\nPlayer11\nPlayer12\nPlayer13\nPlayer14\nPlayer15\nPlayer16"
  );
  const [tableNumbers, setTableNumbers] = useState(["1", "2", "3", "4", "5", "6", "7"]);
  const [tableText, setTableText] = useState("1 2 3 4 5 6 7");
  const [bracket, setBracket] = useState(() => buildBracket(
    "Player1\nPlayer2\nPlayer3\nPlayer4\nPlayer5\nPlayer6\nPlayer7\nPlayer8\nPlayer9\nPlayer10\nPlayer11\nPlayer12\nPlayer13\nPlayer14\nPlayer15\nPlayer16".split("\n")
      .map(s => s.trim()).filter(Boolean).slice(0, 32)
  ));
  const fileInputRef = useRef();

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.playersText && data.bracket) {
          setPlayersText(data.playersText);
          setTableText(data.tableText || data.tableNumbers?.join(" ") || "");
          setTableNumbers(data.tableNumbers || []);
          setBracket(data.bracket);
        }
      } catch (e) {}
    }
  }, []);
  useEffect(() => {
    const data = {
      playersText,
      tableText,
      tableNumbers,
      bracket,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }, [playersText, tableText, tableNumbers, bracket]);
  const players = useMemo(
    () => playersText.split("\n").map(s => s.trim()).filter(Boolean).slice(0, 32),
    [playersText]
  );
  const rounds = Math.ceil(Math.log2(Math.max(players.length, 2)));

  useEffect(() => {
    setBracket(buildBracket(players));
    // eslint-disable-next-line
  }, [playersText]);

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
      tableText,
      tableNumbers,
      bracket,
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
          setTableText(data.tableText || data.tableNumbers?.join(" ") || "");
          setTableNumbers(data.tableNumbers || []);
          setBracket(data.bracket);
        } else {
          alert("Invalid tournament file.");
        }
      } catch (err) {
        alert("Failed to load tournament file.");
      }
    };
    reader.readAsText(file);
  }
  function handleTablesChange(e) {
    setTableText(e.target.value);
    setTableNumbers(e.target.value.split(/[\s,]+/).filter(Boolean));
  }
  function handlePlayersChange(e) {
    const newText = e.target.value;
    if (newText !== playersText) {
      const hasStarted = bracket.some(m =>
        ((m.score1 && m.score1 !== "" && !isNaN(Number(m.score1))) ||
         (m.score2 && m.score2 !== "" && !isNaN(Number(m.score2))) ||
         (m.finished && !m.status?.toLowerCase().includes("bye") && m.status !== "No Match"))
      );
      if (hasStarted) {
        if (
          !window.confirm(
            "Editing the player list will reset the tournament and erase all match results. Are you sure you want to continue?"
          )
        ) {
          return;
        }
      }
    }
    setPlayersText(newText);
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
  function getUsedTables(bracket) {
    const used = new Set();
    bracket.forEach(m => {
      if (m.status === "Playing" && m.table) used.add(m.table);
    });
    return used;
  }

  function updateMatch(id, changes) {
    setBracket(prev =>
      prev.map(m =>
        m.id === id ? { ...m, ...changes } : m
      )
    );
  }
  function startMatch(match) {
    setBracket(prev => {
      if (match.status === "Playing" && match.table) return prev;
      const usedTables = getUsedTables(prev);
      const freeTable = tableNumbers.find(t => !usedTables.has(t));
      return prev.map(m =>
        m.id === match.id
          ? {
              ...m,
              status: freeTable ? "Playing" : "Waiting for table",
              table: freeTable || "",
            }
          : m
      );
    });
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
          ? { ...m, finished: true, winner, status: "Finished", table: "" }
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

  function renderPlayerLabel(m, p, idx) {
    if (
      typeof p.name === "string" &&
      (p.name.startsWith("Winner of") || p.name.startsWith("Loser of"))
    ) {
      return <span style={{ color: "#b33", fontSize: 13 }}>{p.name}</span>;
    }
    return (
      <input
        value={p.name}
        style={{ width: 84, marginRight: 2 }}
        onChange={e =>
          updateMatch(m.id, idx === 1 ? { p1: { ...p, name: e.target.value } } : { p2: { ...p, name: e.target.value } })
        }
        disabled={m.finished}
      />
    );   
  }

  function getStandings(bracket) {
  // 1. Find the final and 3rd-place logic as before
  const gf = bracket.find(m => m.bracket === "GF" && !m.id.includes("reset"));
  const gfReset = bracket.find(m => m.id === "gf-1-reset");
  const loserFinal = bracket.filter(m => m.bracket === "L" && m.finished).slice(-1)[0];

  let places = [];
  let placed = new Set();

  // 1st and 2nd: Grand Final(s)
  if (gf && gf.finished) {
    let champ = gf.winner;
    let runnerUp = (gf.p1.name === champ ? gf.p2.name : gf.p1.name);
    places.push([champ]);  // 1st place
    placed.add(champ);
    places.push([runnerUp]);  // 2nd place
    placed.add(runnerUp);
  } else if (gfReset && gfReset.finished) {
    let champ = gfReset.winner;
    let runnerUp = (gfReset.p1.name === champ ? gfReset.p2.name : gfReset.p1.name);
    places.push([champ]);
    placed.add(champ);
    places.push([runnerUp]);
    placed.add(runnerUp);
  }

  // 3rd: Last Losers Bracket finalist
  if (loserFinal && loserFinal.finished) {
    let third = loserFinal.p1.name === loserFinal.winner ? loserFinal.p2.name : loserFinal.p1.name;
    if (!placed.has(third)) {
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
  // So we need to sort rounds descending and for each, group unplaced players
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
  // Build set of all players:
  let allPlayers = new Set();
  bracket.forEach(m => {
    if (m.p1 && typeof m.p1.name === "string" && m.p1.name && m.p1.name !== "BYE" && !m.p1.name.startsWith("Winner of") && !m.p1.name.startsWith("Loser of"))
      allPlayers.add(m.p1.name);
    if (m.p2 && typeof m.p2.name === "string" && m.p2.name && m.p2.name !== "BYE" && !m.p2.name.startsWith("Winner of") && !m.p2.name.startsWith("Loser of"))
      allPlayers.add(m.p2.name);
  });
  // Add any not yet placed as last
  const neverPlaced = Array.from(allPlayers).filter(name => !placed.has(name));
  if (neverPlaced.length) places.push(neverPlaced);

  // Now flatten as [ [Player(s) at place 1], [Player(s) at place 2], ... ]
  return places;
  }
 
  return (
    <div style={{ background: "#fafbfc", minHeight: "2400px", fontFamily: "sans-serif" }}>
      <h2 style={{ marginLeft: 20 }}>Kansas City Pool Tourney</h2>
      <div style={{ display: "flex", gap: 32 }}>
        <div style={{ minWidth: 220, marginLeft: 40 }}>
          <div>
            <b>Players:</b>
            <br />
            <textarea
              value={playersText}
              onChange={handlePlayersChange}
              onBlur={handlePlayersBlur}
              rows={12}
              style={{ width: 160, marginBottom: 10 }}
            />
          </div>
          <div>
            <b>Table numbers:</b>
            <br />
            <input
              value={tableText}
              onChange={handleTablesChange}
              style={{ width: 160 }}
              placeholder="1 2 3 4 5 6 7"
            />
          </div>
          <button
            style={{
              marginTop: 10,
              marginBottom: 10,
              padding: "6px 18px",
              fontSize: 16,
              borderRadius: 8,
              background: "#3a8",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
            onClick={handleShuffleBracket}
          >
            Create / Reshuffle Bracket
          </button>
          <div style={{ marginTop: 40, marginBottom: 8 }}>
            <button
              style={{
                marginRight: 8,
                padding: "6px 18px",
                fontSize: 16,
                borderRadius: 8,
                background: "#235",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                display: "block",
                marginBottom: 8, // Add a little spacing between buttons
              }}
              onClick={exportTournament}
            >
              Export Tournament
            </button>
            <button
              style={{
                padding: "6px 18px",
                fontSize: 16,
                borderRadius: 8,
                background: "#a84",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                display: "block",
                marginBottom: 8,
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
          </div>
          <div
            style={{
              marginTop: 32,
              marginBottom: 16,
              background: "#fff",
              border: "2px solid #335",
              borderRadius: 10,
              boxShadow: "2px 2px 7px #ddd",
              padding: 16,
              width: 180,
            }}
          >
            <div style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10, textAlign: "center" }}>
              Standings
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {getStandings(bracket).map((group, idx) => {
                  // What "place" number is this?
                  let place = idx + 1;
                  let placeLabel = `${place}th`;
                  if (place === 1) placeLabel = "1st";
                  else if (place === 2) placeLabel = "2nd";
                  else if (place === 3) placeLabel = "3rd";
                  else if (place % 10 === 1 && place !== 11) placeLabel = `${place}st`;
                  else if (place % 10 === 2 && place !== 12) placeLabel = `${place}nd`;
                  else if (place % 10 === 3 && place !== 13) placeLabel = `${place}rd`;
                  let color = "#333";
                  if (idx === 0) color = "#FFD700"; // Gold
                  else if (idx === 1) color = "#C0C0C0"; // Silver
                  else if (idx === 2) color = "#CD7F32"; // Bronze
                  return group.map(player => (
                    <tr key={player}>
                      <td
                        style={{
                          fontWeight: "bold",
                          color,
                          padding: "2px 8px",
                          fontSize: idx < 3 ? 17 : 15,
                        }}
                      >
                        {placeLabel}
                      </td>
                      <td
                        style={{
                          color,
                          fontWeight: idx < 3 ? "bold" : "normal",
                          padding: "2px 4px",
                          fontSize: idx < 3 ? 16 : 15,
                        }}
                      >
                        {player}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ position: "relative", width: 2400, height: 1800 }}>
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
                  width: pos.w,
                  height: pos.h,
                  zIndex: 1,
                  background: "#fff",
                  border: "2px solid #335",
                  borderRadius: 10,
                  padding: 8,
                  boxShadow: "2px 2px 7px #ddd",
                  overflow: "visible",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: 18, marginBottom: 2, marginTop: -4}}>
                  Match {m.matchNum}
                </div>
                <div style={{ marginBottom: 2 }}>
                  {renderPlayerLabel(m, m.p1, 1)}
                  <input
                    value={m.score1}
                    style={{ width: 28 }}
                    type="number"
                    min="0"
                    onChange={e => updateMatch(m.id, { score1: Math.max(0, Number(e.target.value)) })}
                    disabled={m.finished}
                  />
                </div>
                <div style={{ marginBottom: 2 }}>
                  {renderPlayerLabel(m, m.p2, 2)}
                  <input
                    value={m.score2}
                    style={{ width: 28 }}
                    type="number"
                    onChange={e => updateMatch(m.id, { score2: Math.max(0, Number(e.target.value)) })}
                    disabled={m.finished}
                  />
                </div>
                <div style={{ fontSize: 13, marginBottom: 2 }}>
                  <span style={{ color: "#666" }}>Table: </span>
                  <input style={{ width: 38 }} value={m.table} readOnly />
                </div>
                <div
                  style={{
                    color:
                      m.status === "Finished"
                        ? "green"
                        : m.status.startsWith("Waiting")
                        ? "#d00"
                        : "#888",
                    fontSize: 13,
                  }}
                >
                  {m.status}
                </div>
                {!m.finished && isReady && (
                  <button
                    style={{
                      marginTop: 3,
                      fontSize: 12,
                      padding: "2px 8px",
                      borderRadius: 5,
                      background: "#3a8",
                      color: "#fff",
                      border: 0,
                      cursor: "pointer",
                    }}
                    onClick={() => startMatch(m)}
                  >
                    Start Match
                  </button>
                )}
                {!m.finished &&
                  m.status === "Playing" &&
                  m.score1 !== "" &&
                  m.score2 !== "" &&
                  m.score1 !== null &&
                  m.score2 !== null && (
                    <button
                      style={{
                        marginTop: 3,
                        marginLeft: 3,
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: 5,
                        background: "#398",
                        color: "#fff",
                        border: 0,
                        cursor: "pointer",
                      }}
                      onClick={() => markFinished(m)}
                    >
                      Finalize
                    </button>
                )}
                {m.finished && (
                  <button
                    style={{
                      marginTop: 3,
                      marginLeft: 4,
                      fontSize: 12,
                      padding: "2px 8px",
                      borderRadius: 5,
                      background: "#e44",
                      color: "#fff",
                      border: 0,
                      cursor: "pointer",
                    }}
                    onClick={() => undoFinished(m)}
                  >
                    Undo
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
