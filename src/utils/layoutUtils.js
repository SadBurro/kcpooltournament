import React from "react";

export function getBracketNodePositions(bracket, rounds) {
  const boxW = 180, boxH = 100, roundGap = 200;
  const yBase = 0, xBase = 40;
  const headerHeight = 30;
  const minMatchGap = 20; // Increased gap between matches

  const pos = {};

  // Group matches by bracket and round
  const winners = bracket.filter(m => m.bracket === "W");
  const losers = bracket.filter(m => m.bracket === "L");
  const grandFinals = bracket.filter(m => m.bracket === "GF");

  // Winners bracket positioning
  const winnersByRound = [];
  for (let r = 1; r <= rounds; r++) {
    winnersByRound.push(winners.filter(m => m.round === r));
  }

  // Calculate winners bracket height based on first round with minimum gaps
  const firstRoundCount = winnersByRound[0]?.length || 0;
  const winnersStartY = yBase + 60; // Increased from 30 to 60 to leave room for headers

  // Calculate the total height needed for the first round (this defines our bracket height)
  const firstRoundHeight = Math.max(firstRoundCount * (boxH + minMatchGap) - minMatchGap, boxH);

  // Position winners bracket matches
  for (let roundIdx = 0; roundIdx < winnersByRound.length; roundIdx++) {
    const roundMatches = winnersByRound[roundIdx];
    if (roundMatches.length === 0) continue;

    if (roundIdx === 0) {
      // First round - use consistent gap spacing
      for (let matchIdx = 0; matchIdx < roundMatches.length; matchIdx++) {
        const match = roundMatches[matchIdx];
        const yPosition = winnersStartY + matchIdx * (boxH + minMatchGap);

        pos[match.id] = {
          x: xBase + roundIdx * (boxW + roundGap),
          y: yPosition,
          w: boxW,
          h: boxH,
        };
      }
    } else {
      // Later rounds - distribute evenly across the first round height
      if (roundMatches.length === 1) {
        // Single match - center it
        pos[roundMatches[0].id] = {
          x: xBase + roundIdx * (boxW + roundGap),
          y: winnersStartY + (firstRoundHeight / 2) - (boxH / 2),
          w: boxW,
          h: boxH,
        };
      } else {
        // Multiple matches - distribute evenly across available height
        const availableHeight = firstRoundHeight;
        const spacing = availableHeight / (roundMatches.length + 1);

        for (let matchIdx = 0; matchIdx < roundMatches.length; matchIdx++) {
          const match = roundMatches[matchIdx];
          const yPosition = winnersStartY + spacing * (matchIdx + 1) - (boxH / 2);

          pos[match.id] = {
            x: xBase + roundIdx * (boxW + roundGap),
            y: yPosition,
            w: boxW,
            h: boxH,
          };
        }
      }
    }
  }

  // Calculate the actual height used by winners bracket
  const winnersPositions = Object.keys(pos)
    .filter(key => bracket.find(m => m.id === key)?.bracket === "W")
    .map(key => pos[key]);

  const winnersMinY = winnersPositions.length > 0 ? Math.min(...winnersPositions.map(p => p.y)) : winnersStartY;
  const winnersMaxY = winnersPositions.length > 0 ? Math.max(...winnersPositions.map(p => p.y + p.h)) : winnersStartY + boxH;

  // Losers bracket positioning
  const losersByRound = [];
  const loserRounds = [...new Set(losers.map(m => m.round))].sort((a, b) => a - b);

  for (let round of loserRounds) {
    losersByRound.push(losers.filter(m => m.round === round));
  }

  // Position losers bracket with consistent spacing and adequate separation from winners
  const losersStartY = winnersMaxY + 80; // Increased gap from 60 to 80 pixels between winners and losers

  // Calculate the total height for the losers bracket based on first round
  const firstLosersRoundCount = losersByRound[0]?.length || 0;
  const firstLosersRoundHeight = Math.max(firstLosersRoundCount * (boxH + minMatchGap) - minMatchGap, boxH);

  for (let roundIdx = 0; roundIdx < losersByRound.length; roundIdx++) {
    const roundMatches = losersByRound[roundIdx];
    if (roundMatches.length === 0) continue;

    if (roundIdx === 0) {
      // First losers round - use consistent gap spacing
      for (let matchIdx = 0; matchIdx < roundMatches.length; matchIdx++) {
        const match = roundMatches[matchIdx];
        const yPosition = losersStartY + matchIdx * (boxH + minMatchGap);

        pos[match.id] = {
          x: xBase + roundIdx * (boxW + roundGap),
          y: yPosition,
          w: boxW,
          h: boxH,
        };
      }
    } else {
      // Later losers rounds - check if we have more matches than first round
      const matchCount = roundMatches.length;
      const firstRoundCount = losersByRound[0]?.length || 0;

      if (matchCount >= firstRoundCount) {
        // If this round has as many or more matches than first round, use consistent spacing
        for (let matchIdx = 0; matchIdx < roundMatches.length; matchIdx++) {
          const match = roundMatches[matchIdx];
          const yPosition = losersStartY + matchIdx * (boxH + minMatchGap);

          pos[match.id] = {
            x: xBase + roundIdx * (boxW + roundGap),
            y: yPosition,
            w: boxW,
            h: boxH,
          };
        }
      } else {
        // Fewer matches than first round - distribute evenly
        if (roundMatches.length === 1) {
          // Single match - center it
          pos[roundMatches[0].id] = {
            x: xBase + roundIdx * (boxW + roundGap),
            y: losersStartY + (firstLosersRoundHeight / 2) - (boxH / 2),
            w: boxW,
            h: boxH,
          };
        } else {
          // Multiple matches - distribute evenly across available height
          const availableHeight = firstLosersRoundHeight;
          const spacing = availableHeight / (roundMatches.length + 1);

          for (let matchIdx = 0; matchIdx < roundMatches.length; matchIdx++) {
            const match = roundMatches[matchIdx];
            const yPosition = losersStartY + spacing * (matchIdx + 1) - (boxH / 2);

            pos[match.id] = {
              x: xBase + roundIdx * (boxW + roundGap),
              y: yPosition,
              w: boxW,
              h: boxH,
            };
          }
        }
      }
    }
  }

  // Grand Finals positioning
  if (grandFinals.length > 0) {
    const rightMostX = xBase + Math.max(winnersByRound.length, losersByRound.length) * (boxW + roundGap);

    // Calculate the overall bracket center
    const losersPositions = Object.keys(pos)
      .filter(key => bracket.find(m => m.id === key)?.bracket === "L")
      .map(key => pos[key]);

    let overallMidY;
    if (losersPositions.length > 0) {
      const losersMinY = Math.min(...losersPositions.map(p => p.y));
      const losersMaxY = Math.max(...losersPositions.map(p => p.y + p.h));
      overallMidY = (winnersMinY + winnersMaxY + losersMinY + losersMaxY) / 4;
    } else {
      overallMidY = (winnersMinY + winnersMaxY) / 2;
    }

    for (let i = 0; i < grandFinals.length; i++) {
      const match = grandFinals[i];
      pos[match.id] = {
        x: rightMostX + i * (boxW + roundGap),
        y: overallMidY - boxH / 2,
        w: boxW,
        h: boxH,
      };
    }
  }

  return pos;
}

export function isTournamentComplete(bracket) {
  const gf = bracket.find(m => m.bracket === "GF" && !m.id.includes("reset"));
  const gfReset = bracket.find(m => m.id === "gf-1-reset");
  return (gf && gf.finished) || (gfReset && gfReset.finished);
}

export function ConnectLine({ from, to, nodes }) {
  const a = nodes[from];
  const b = nodes[to];
  if (!a || !b) return null;

  const ax = a.x + a.w;
  const ay = a.y + a.h / 2;
  const bx = b.x;
  const by = b.y + b.h / 2;
  const midX = ax + (bx - ax) / 2;

  return (
    <polyline
      points={`${ax},${ay} ${midX},${ay} ${midX},${by} ${bx},${by}`}
      fill="none"
      stroke="#999"
      strokeWidth={2}
    />
  );
}