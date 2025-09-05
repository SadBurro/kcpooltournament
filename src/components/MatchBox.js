// src/components/MatchBox.js

import React from "react";

export default function MatchBox({
    match,
    position,
    updateMatch,
    markFinished,
    undoFinished,
    handleMatchPlayerNameEdit
}) {
    const { p1, p2, score1, score2, finished, matchNum, table, winner, status } = match;

    const isReady = (
        !finished &&
        p1 && p2 &&
        typeof p1.name === "string" &&
        typeof p2.name === "string" &&
        !["Winner of", "Loser of"].some(prefix => p1.name.startsWith(prefix) || p2.name.startsWith(prefix)) &&
        !["BYE", "TBD"].includes(p1.name) &&
        !["BYE", "TBD"].includes(p2.name)
    );

    const canFinalize = (
        !finished &&
        score1 !== "" &&
        score2 !== "" &&
        !isNaN(score1) &&
        !isNaN(score2) &&
        Number(score1) !== Number(score2)
    );

    const renderPlayerLabel = (player, idx) => {
        // Check if this is a placeholder (winner/loser reference)
        const isPlaceholder = typeof player.name !== "string" ||
            player.name.startsWith("Winner of") ||
            player.name.startsWith("Loser of") ||
            player.name === "BYE" ||
            player.name === "TBD";

        if (isPlaceholder) {
            return (
                <span style={{
                    color: "#888",
                    fontSize: 12,
                    fontStyle: 'italic',
                    display: 'block',
                    width: 120,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {player.name || "TBD"}
                </span>
            );
        }

        // Editable player name
        return (
            <input
                value={player.name}
                style={{
                    width: 120,
                    fontSize: 12,
                    border: '1px solid #ccc',
                    borderRadius: 3,
                    padding: '1px 2px',
                    background: finished ? '#f5f5f5' : '#fff'
                }}
                onChange={e => handleMatchPlayerNameEdit(player.name, e.target.value)}
                onBlur={e => {
                    const name = e.target.value.trim();
                    if (name && name !== player.name) {
                        handleMatchPlayerNameEdit(player.name, name);
                    }
                }}
                disabled={finished}
            />
        );
    };

    // Determine winner highlighting
    const getPlayerStyle = (playerName, isWinner) => {
        if (!finished) return {};

        return {
            backgroundColor: isWinner ? '#e8f5e8' : '#f5f5f5',
            fontWeight: isWinner ? 'bold' : 'normal'
        };
    };

    const p1IsWinner = finished && winner === p1.name;
    const p2IsWinner = finished && winner === p2.name;

    return (
        <div
            style={{
                position: "absolute",
                left: position.x,
                top: position.y,
                width: 180,
                minHeight: 80,
                zIndex: 1,
                background: finished ? "#f8f9fa" : "#fff",
                border: `2px solid ${finished ? "#28a745" : "#335"}`,
                borderRadius: 8,
                padding: 8,
                boxShadow: "2px 2px 8px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                fontSize: 13,
            }}
        >
            {/* Match number header */}
            <div style={{
                fontWeight: 'bold',
                fontSize: 14,
                color: "#224",
                textAlign: 'center',
                marginBottom: 6,
                borderBottom: '1px solid #eee',
                paddingBottom: 4
            }}>
                Match {matchNum}
                {match.bracket && (
                    <span style={{
                        fontSize: 10,
                        color: '#666',
                        marginLeft: 6,
                        fontWeight: 'normal'
                    }}>
                        ({match.bracket})
                    </span>
                )}
            </div>

            {/* Player 1 */}
            <div style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 4,
                ...getPlayerStyle(p1.name, p1IsWinner)
            }}>
                <div style={{ flex: 1, marginRight: 8 }}>
                    {renderPlayerLabel(p1, 1)}
                </div>
                <input
                    value={score1}
                    style={{
                        width: 32,
                        fontSize: 13,
                        textAlign: 'center',
                        border: '1px solid #ccc',
                        borderRadius: 3,
                        backgroundColor: p1IsWinner ? '#d4edda' : '#fff'
                    }}
                    type="number"
                    min="0"
                    onChange={e => updateMatch(match.id, { score1: Math.max(0, Number(e.target.value)).toString() })}
                    disabled={finished}
                />
            </div>

            {/* Player 2 */}
            <div style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 6,
                ...getPlayerStyle(p2.name, p2IsWinner)
            }}>
                <div style={{ flex: 1, marginRight: 8 }}>
                    {renderPlayerLabel(p2, 2)}
                </div>
                <input
                    value={score2}
                    style={{
                        width: 32,
                        fontSize: 13,
                        textAlign: 'center',
                        border: '1px solid #ccc',
                        borderRadius: 3,
                        backgroundColor: p2IsWinner ? '#d4edda' : '#fff'
                    }}
                    type="number"
                    min="0"
                    onChange={e => updateMatch(match.id, { score2: Math.max(0, Number(e.target.value)).toString() })}
                    disabled={finished}
                />
            </div>

            {/* Table and controls */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 'auto'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: "#666", fontSize: 12, marginRight: 4 }}>Table:</span>
                    <input
                        style={{
                            width: 32,
                            fontSize: 12,
                            border: '1px solid #ccc',
                            borderRadius: 3,
                            textAlign: 'center'
                        }}
                        value={table}
                        onChange={e => updateMatch(match.id, { table: e.target.value })}
                        disabled={finished}
                        maxLength={3}
                    />
                </div>

                {/* Action buttons */}
                <div>
                    {canFinalize && (
                        <button
                            style={finalizeButtonStyle}
                            onClick={() => markFinished(match)}
                            title="Finalize this match"
                        >
                            ✓ Finish
                        </button>
                    )}

                    {finished && (
                        <button
                            style={undoButtonStyle}
                            onClick={() => undoFinished(match)}
                            title="Undo this match"
                        >
                            ↶ Undo
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

const finalizeButtonStyle = {
    fontSize: 11,
    padding: "3px 6px",
    borderRadius: 4,
    background: "#28a745",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontWeight: 'bold'
};

const undoButtonStyle = {
    fontSize: 11,
    padding: "3px 6px",
    borderRadius: 4,
    background: "#dc3545",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontWeight: 'bold'
};