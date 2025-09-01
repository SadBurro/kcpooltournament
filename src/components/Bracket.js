// src/components/Bracket.js

import React from "react";
import { ConnectLine } from "../utils/layoutUtils";
import MatchBox from "./MatchBox";

export default function Bracket({
    bracket,
    nodePositions,
    updateMatch,
    markFinished,
    undoFinished,
    handleMatchPlayerNameEdit
}) {
    const connectors = [];
    bracket.forEach(m => {
        if (m.from) {
            m.from.forEach(src => {
                if (src && nodePositions[src] && nodePositions[m.id]) {
                    connectors.push(
                        <ConnectLine key={`${src}-${m.id}`} from={src} to={m.id} nodes={nodePositions} />
                    );
                }
            });
        }
    });

    const maxY = Math.max(...Object.values(nodePositions).map(pos => pos.y + pos.h), 800);
    const svgHeight = Math.max(1800, maxY + 100);

    // Generate column headers
    const generateHeaders = () => {
        const headers = [];
        const boxW = 180, roundGap = 200, xBase = 40;

        // Group matches by bracket and round
        const winners = bracket.filter(m => m.bracket === "W");
        const losers = bracket.filter(m => m.bracket === "L");
        const grandFinals = bracket.filter(m => m.bracket === "GF");

        // Winners headers
        const winnersRounds = [...new Set(winners.map(m => m.round))].sort((a, b) => a - b);
        winnersRounds.forEach((round, idx) => {
            const x = xBase + idx * (boxW + roundGap);
            const label = round === winnersRounds.length ? "Winners Final" : `Round ${round}`;

            // Find the topmost match in this winners round to position header above it
            const roundMatches = winners.filter(m => m.round === round);
            const roundPositions = roundMatches.map(m => nodePositions[m.id]).filter(Boolean);
            const topY = roundPositions.length > 0 ? Math.min(...roundPositions.map(p => p.y)) : 50;
            const headerY = Math.max(10, topY - 45); // Increased spacing to 45px above topmost match

            headers.push(
                <div
                    key={`w-header-${round}`}
                    style={{
                        position: 'absolute',
                        left: x,
                        top: headerY,
                        width: boxW,
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        color: '#fff',
                        background: 'rgba(40, 167, 69, 0.8)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255,255,255,0.3)'
                    }}
                >
                    {label}
                </div>
            );
        });

        // Losers headers
        const losersRounds = [...new Set(losers.map(m => m.round))].sort((a, b) => a - b);
        losersRounds.forEach((round, idx) => {
            const x = xBase + idx * (boxW + roundGap);
            const label = round === losersRounds.length ? "Losers Final" : `Losers R${round}`;

            // Find the topmost match in this losers round to position header above it
            const roundMatches = losers.filter(m => m.round === round);
            const roundPositions = roundMatches.map(m => nodePositions[m.id]).filter(Boolean);
            const topY = roundPositions.length > 0 ? Math.min(...roundPositions.map(p => p.y)) : 400;
            const headerY = Math.max(10, topY - 45); // Increased spacing to 45px above topmost match

            headers.push(
                <div
                    key={`l-header-${round}`}
                    style={{
                        position: 'absolute',
                        left: x,
                        top: headerY,
                        width: boxW,
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        color: '#fff',
                        background: 'rgba(220, 53, 69, 0.8)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255,255,255,0.3)'
                    }}
                >
                    {label}
                </div>
            );
        });

        // Grand Finals headers
        if (grandFinals.length > 0) {
            const rightMostX = xBase + Math.max(winnersRounds.length, losersRounds.length) * (boxW + roundGap);
            grandFinals.forEach((match, idx) => {
                const label = match.id.includes('reset') ? 'Grand Final Reset' : 'Grand Final';

                // Find the position of this specific grand finals match
                const matchPosition = nodePositions[match.id];
                const headerY = matchPosition ? Math.max(10, matchPosition.y - 45) : 10;

                headers.push(
                    <div
                        key={`gf-header-${idx}`}
                        style={{
                            position: 'absolute',
                            left: rightMostX + idx * (boxW + roundGap),
                            top: headerY,
                            width: boxW,
                            textAlign: 'center',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            color: '#fff',
                            background: 'rgba(255, 193, 7, 0.9)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid rgba(255,255,255,0.3)'
                        }}
                    >
                        {label}
                    </div>
                );
            });
        }

        return headers;
    };

    return (
        <div
            style={{
                position: "relative",
                width: 2400,
                height: svgHeight,
                transition: "margin-left 0.25s"
            }}
            className="bracket-container"
        >
            {/* Column Headers */}
            {generateHeaders()}

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
                    <marker id="arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L8,4 L0,8" fill="#999" />
                    </marker>
                </defs>
                {connectors}
            </svg>

            {bracket.map(match => {
                const position = nodePositions[match.id];

                if (!match.p1?.name || !match.p2?.name) {
                    console.warn(`Incomplete match: ${match.id}`, match);
                }

                if (!position) {
                    console.warn(`No position for match: ${match.id}`);
                    return null;
                }

                return (
                    <MatchBox
                        key={match.id}
                        match={match}
                        position={position}
                        updateMatch={updateMatch}
                        markFinished={markFinished}
                        undoFinished={undoFinished}
                        handleMatchPlayerNameEdit={handleMatchPlayerNameEdit}
                    />
                );
            })}
        </div>
    );
}