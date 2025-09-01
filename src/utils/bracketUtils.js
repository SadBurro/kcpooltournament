function generateSeedOrder(n) {
    const order = [1];
    while (order.length < n) {
        const size = order.length * 2;
        const next = [];
        for (let i = 0; i < order.length; i++) {
            next.push(order[i]);
            next.push(size + 1 - order[i]);
        }
        order.splice(0, order.length, ...next);
    }
    return order;
}

export function buildBracket(players) {
    const rounds = Math.ceil(Math.log2(players.length));
    const slots = 2 ** rounds;
    const seedOrder = generateSeedOrder(slots);
    const seeded = Array(slots).fill("BYE");

    // Seed players according to proper tournament seeding
    for (let i = 0; i < players.length; i++) {
        seeded[seedOrder[i] - 1] = players[i];
    }

    const matches = [];
    let matchNum = 1;

    // Build Winners Bracket
    const winnersRounds = [];
    let prevRound = [];

    // Round 1 of winners bracket
    const firstRound = [];
    for (let i = 0; i < slots / 2; i++) {
        const p1 = { name: seeded[i * 2], ref: null };
        const p2 = { name: seeded[i * 2 + 1], ref: null };

        // Skip completely bye matches
        if (p1.name === "BYE" && p2.name === "BYE") {
            firstRound.push(null);
            continue;
        }

        const match = {
            id: `w-1-${i}`,
            matchNum: matchNum++,
            p1,
            p2,
            from: [],
            bracket: "W",
            round: 1,
            col: 1,
            row: i,
            score1: "0",
            score2: "0",
            table: "",
            finished: false,
            status: "Pending",
            winner: "",
        };

        // Auto-advance BYE matches
        if (p1.name === "BYE" || p2.name === "BYE") {
            match.winner = p1.name === "BYE" ? p2.name : p1.name;
            match.finished = true;
            match.status = "Auto-advanced (BYE)";
            match.score1 = p1.name === "BYE" ? "0" : "1";
            match.score2 = p2.name === "BYE" ? "0" : "1";
        }

        firstRound.push(match);
        matches.push(match);
    }
    winnersRounds.push(firstRound);
    prevRound = firstRound;

    // Subsequent winners rounds
    for (let r = 2; r <= rounds; r++) {
        const thisRound = [];
        const count = slots / (2 ** r);

        for (let i = 0; i < count; i++) {
            const m1 = prevRound[i * 2];
            const m2 = prevRound[i * 2 + 1];

            const p1 = m1 ? { name: `Winner of M${m1.matchNum}`, ref: `Winner of M${m1.matchNum}` } : { name: "BYE", ref: null };
            const p2 = m2 ? { name: `Winner of M${m2.matchNum}`, ref: `Winner of M${m2.matchNum}` } : { name: "BYE", ref: null };

            const from = [];
            if (m1) from.push(m1.id);
            if (m2) from.push(m2.id);

            if (p1.name === "BYE" && p2.name === "BYE") {
                thisRound.push(null);
                continue;
            }

            const match = {
                id: `w-${r}-${i}`,
                matchNum: matchNum++,
                p1,
                p2,
                from,
                bracket: "W",
                round: r,
                col: r,
                row: i,
                score1: "0",
                score2: "0",
                table: "",
                finished: false,
                status: "Pending",
                winner: "",
            };

            thisRound.push(match);
            matches.push(match);
        }

        winnersRounds.push(thisRound);
        prevRound = thisRound;
    }

    // Build Losers Bracket
    const {
        losersMatches,
        nextMatchNum,
        lastLoserMatch,
    } = buildLosersBracket(winnersRounds, matchNum);

    matchNum = nextMatchNum;
    matches.push(...losersMatches);

    // Grand Finals
    const finalMatch = prevRound.find(m => !!m);
    const grandFinal = {
        id: "gf-1-0",
        matchNum: matchNum++,
        bracket: "GF",
        round: rounds + 1,
        col: rounds + 1,
        row: 0,
        p1: { name: `Winner of M${finalMatch?.matchNum}`, ref: `Winner of M${finalMatch?.matchNum}` },
        p2: { name: `Winner of M${lastLoserMatch?.matchNum}`, ref: `Winner of M${lastLoserMatch?.matchNum}` },
        score1: "0",
        score2: "0",
        table: "",
        from: [finalMatch?.id, lastLoserMatch?.id].filter(Boolean),
        winner: "",
        finished: false,
        status: "Pending",
    };
    matches.push(grandFinal);

    const grandReset = {
        id: "gf-1-reset",
        matchNum: matchNum++,
        bracket: "GF",
        round: rounds + 2,
        col: rounds + 2,
        row: 0,
        p1: { name: `Winner of M${grandFinal.matchNum}`, ref: `Winner of M${grandFinal.matchNum}` },
        p2: { name: `Loser of M${grandFinal.matchNum}`, ref: `Loser of M${grandFinal.matchNum}` },
        score1: "0",
        score2: "0",
        table: "",
        from: [grandFinal.id],
        winner: "",
        finished: false,
        status: "Pending",
    };
    matches.push(grandReset);

    return matches;
}

function buildLosersBracket(winnersRounds, startMatchNum) {
    const losersMatches = [];
    let matchNum = startMatchNum;
    let loserRoundNum = 1;

    // Get actual matches from winners rounds (filter out nulls)
    const validWinnersRounds = winnersRounds.map(round => round.filter(m => m !== null));

    if (validWinnersRounds.length === 0) {
        return { losersMatches: [], nextMatchNum: matchNum, lastLoserMatch: null };
    }

    // This will track the "active" players in the losers bracket
    let activePlayers = [];

    // LR1: First round losers play each other
    const firstRoundLosers = validWinnersRounds[0].map(match => ({
        name: `Loser of M${match.matchNum}`,
        ref: `Loser of M${match.matchNum}`,
        sourceMatch: match
    }));

    // Create LR1 matches
    for (let i = 0; i < firstRoundLosers.length; i += 2) {
        if (i + 1 < firstRoundLosers.length) {
            const match = {
                id: `l-${loserRoundNum}-${Math.floor(i / 2)}`,
                matchNum: matchNum++,
                p1: firstRoundLosers[i],
                p2: firstRoundLosers[i + 1],
                from: [],
                bracket: "L",
                round: loserRoundNum,
                col: loserRoundNum,
                row: Math.floor(i / 2),
                score1: "0",
                score2: "0",
                table: "",
                finished: false,
                status: "Pending",
                winner: "",
            };
            losersMatches.push(match);
            activePlayers.push({
                name: `Winner of M${match.matchNum}`,
                ref: `Winner of M${match.matchNum}`,
                sourceMatch: match
            });
        }
    }
    loserRoundNum++;

    // Now process each subsequent winners round
    for (let wRound = 1; wRound < validWinnersRounds.length; wRound++) {
        const winnersThisRound = validWinnersRounds[wRound];
        const newLosers = winnersThisRound.map(match => ({
            name: `Loser of M${match.matchNum}`,
            ref: `Loser of M${match.matchNum}`,
            sourceMatch: match
        }));

        // Create upset round: new losers vs active players
        const newActivePlayers = [];
        for (let i = 0; i < newLosers.length; i++) {
            const newLoser = newLosers[i];
            const activePlayer = activePlayers[i] || { name: "BYE", ref: null };

            if (newLoser.name === "BYE" && activePlayer.name === "BYE") continue;

            const from = [];
            if (activePlayer.sourceMatch && activePlayer.sourceMatch.bracket === "L") {
                from.push(activePlayer.sourceMatch.id);
            }

            const match = {
                id: `l-${loserRoundNum}-${i}`,
                matchNum: matchNum++,
                p1: newLoser,
                p2: activePlayer,
                from,
                bracket: "L",
                round: loserRoundNum,
                col: loserRoundNum,
                row: i,
                score1: "0",
                score2: "0",
                table: "",
                finished: false,
                status: "Pending",
                winner: "",
            };

            // Auto-advance BYE matches
            if (newLoser.name === "BYE" || activePlayer.name === "BYE") {
                match.winner = newLoser.name === "BYE" ? activePlayer.name : newLoser.name;
                match.finished = true;
                match.status = "Auto-advanced (BYE)";
                match.score1 = newLoser.name === "BYE" ? "0" : "1";
                match.score2 = activePlayer.name === "BYE" ? "0" : "1";
            }

            losersMatches.push(match);
            newActivePlayers.push({
                name: `Winner of M${match.matchNum}`,
                ref: `Winner of M${match.matchNum}`,
                sourceMatch: match
            });
        }

        activePlayers = newActivePlayers;
        loserRoundNum++;

        // Create progression round ONLY if we have more than 1 active player 
        // AND this is not the last winners round
        if (activePlayers.length > 1 && wRound < validWinnersRounds.length - 1) {
            const progressionPlayers = [];
            for (let i = 0; i < activePlayers.length; i += 2) {
                if (i + 1 < activePlayers.length) {
                    const from = [];
                    if (activePlayers[i].sourceMatch) from.push(activePlayers[i].sourceMatch.id);
                    if (activePlayers[i + 1].sourceMatch) from.push(activePlayers[i + 1].sourceMatch.id);

                    const match = {
                        id: `l-${loserRoundNum}-${Math.floor(i / 2)}`,
                        matchNum: matchNum++,
                        p1: activePlayers[i],
                        p2: activePlayers[i + 1],
                        from,
                        bracket: "L",
                        round: loserRoundNum,
                        col: loserRoundNum,
                        row: Math.floor(i / 2),
                        score1: "0",
                        score2: "0",
                        table: "",
                        finished: false,
                        status: "Pending",
                        winner: "",
                    };

                    losersMatches.push(match);
                    progressionPlayers.push({
                        name: `Winner of M${match.matchNum}`,
                        ref: `Winner of M${match.matchNum}`,
                        sourceMatch: match
                    });
                }
            }
            activePlayers = progressionPlayers;
            loserRoundNum++;
        }
    }

    const lastLoserMatch = losersMatches[losersMatches.length - 1] || null;

    return {
        losersMatches,
        nextMatchNum: matchNum,
        lastLoserMatch
    };
}

export function getStandings(bracket) {
    // Find both Grand Final matches
    const gf = bracket.find(m => m.bracket === "GF" && !m.id.includes("reset"));
    const gfReset = bracket.find(m => m.id === "gf-1-reset");

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
    if (champ && !champ.includes("Winner of") && !champ.includes("Loser of")) {
        places.push([champ]);
        placed.add(champ);
    }
    if (runnerUp && !runnerUp.includes("Winner of") && !runnerUp.includes("Loser of")) {
        places.push([runnerUp]);
        placed.add(runnerUp);
    }

    // --- 3rd: Loser of the losers final ---
    const loserMatches = bracket.filter(m => m.bracket === "L" && m.finished);
    const loserFinal = loserMatches[loserMatches.length - 1];
    if (loserFinal && loserFinal.winner) {
        let third = loserFinal.p1.name === loserFinal.winner ? loserFinal.p2.name : loserFinal.p1.name;
        if (third && !placed.has(third) && !third.includes("Winner of") && !third.includes("Loser of")) {
            places.push([third]);
            placed.add(third);
        }
    }

    // --- Collect eliminated players by round ---
    let elimByRound = {};
    bracket.forEach(m => {
        if (m.bracket === "L" && m.finished && m.winner) {
            let loserName = (Number(m.score1) > Number(m.score2)) ? m.p2.name : m.p1.name;
            if (loserName && !loserName.includes("Winner of") && !loserName.includes("Loser of") && loserName !== "BYE") {
                if (!elimByRound[m.round]) elimByRound[m.round] = [];
                elimByRound[m.round].push(loserName);
            }
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

    // All remaining players who haven't been placed
    let allPlayers = new Set();
    bracket.forEach(m => {
        if (m.p1 && typeof m.p1.name === "string" && m.p1.name &&
            m.p1.name !== "BYE" &&
            !m.p1.name.startsWith("Winner of") &&
            !m.p1.name.startsWith("Loser of"))
            allPlayers.add(m.p1.name);
        if (m.p2 && typeof m.p2.name === "string" && m.p2.name &&
            m.p2.name !== "BYE" &&
            !m.p2.name.startsWith("Winner of") &&
            !m.p2.name.startsWith("Loser of"))
            allPlayers.add(m.p2.name);
    });
    const neverPlaced = Array.from(allPlayers).filter(name => !placed.has(name));
    if (neverPlaced.length) places.push(neverPlaced);

    return places;
}

export function finalizeByeMatches(bracket, optionalCallback) {
    for (const match of bracket) {
        const isBye1 = match.p1?.name === "BYE";
        const isBye2 = match.p2?.name === "BYE";
        const alreadyDone = match.finished;

        if (!alreadyDone && (isBye1 ^ isBye2)) {
            const winner = isBye1 ? match.p2.name : match.p1.name;

            match.finished = true;
            match.status = "Auto-advanced (BYE)";
            match.winner = winner;
            match.score1 = isBye1 ? "0" : "1";
            match.score2 = isBye2 ? "0" : "1";

            if (typeof optionalCallback === "function") {
                optionalCallback(match);
            }
        }
    }
}

export function propagateAutoWinners(bracket) {
    // Sort matches by match number to ensure proper propagation order
    const sortedMatches = [...bracket].sort((a, b) => (a.matchNum || 0) - (b.matchNum || 0));

    for (const match of sortedMatches) {
        if (match.finished && match.winner) {
            const winner = match.winner;
            const loser = (match.p1.name === winner) ? match.p2.name : match.p1.name;

            // Update all subsequent matches
            for (const m of bracket) {
                if (m.p1?.ref === `Winner of M${match.matchNum}`) {
                    m.p1.name = winner;
                }
                if (m.p2?.ref === `Winner of M${match.matchNum}`) {
                    m.p2.name = winner;
                }
                if (m.p1?.ref === `Loser of M${match.matchNum}`) {
                    m.p1.name = loser;
                }
                if (m.p2?.ref === `Loser of M${match.matchNum}`) {
                    m.p2.name = loser;
                }
            }
        }
    }
}