// src/components/TableView.js

import React from 'react';

export default function TableView({
    bracket,
    updateMatch,
    markFinished,
    undoFinished,
    handleMatchPlayerNameEdit
}) {
    // Group matches by bracket type and sort by match number
    const winnersMatches = bracket.filter(m => m.bracket === 'W').sort((a, b) => a.matchNum - b.matchNum);
    const losersMatches = bracket.filter(m => m.bracket === 'L').sort((a, b) => a.matchNum - b.matchNum);
    const grandFinalsMatches = bracket.filter(m => m.bracket === 'GF').sort((a, b) => a.matchNum - b.matchNum);

    const renderMatchRow = (match) => {
        const { p1, p2, score1, score2, finished, matchNum, table, winner, status, bracket: bracketType, round } = match;

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

        const renderPlayer = (player, scoreField) => {
            const isPlaceholder = typeof player.name !== "string" ||
                player.name.startsWith("Winner of") ||
                player.name.startsWith("Loser of") ||
                player.name === "BYE" ||
                player.name === "TBD";

            if (isPlaceholder) {
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                            color: "#888",
                            fontSize: 14,
                            fontStyle: 'italic',
                            minWidth: '120px'
                        }}>
                            {player.name || "TBD"}
                        </span>
                        <span style={{ color: '#ccc', minWidth: '30px', textAlign: 'center' }}>-</span>
                    </div>
                );
            }

            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        value={player.name}
                        style={{
                            minWidth: '120px',
                            fontSize: 14,
                            border: '1px solid #ccc',
                            borderRadius: 3,
                            padding: '2px 4px',
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
                    <input
                        value={match[scoreField]}
                        style={{
                            width: 40,
                            fontSize: 14,
                            textAlign: 'center',
                            border: '1px solid #ccc',
                            borderRadius: 3,
                            backgroundColor: finished && winner === player.name ? '#d4edda' : '#fff'
                        }}
                        type="number"
                        min="0"
                        onChange={e => updateMatch(match.id, { [scoreField]: Math.max(0, Number(e.target.value)).toString() })}
                        disabled={finished}
                    />
                </div>
            );
        };

        return (
            <tr
                key={match.id}
                style={{
                    backgroundColor: finished ? '#f8f9fa' : isReady ? '#fff' : '#fafafa',
                    borderLeft: `4px solid ${bracketType === 'W' ? '#28a745' :
                            bracketType === 'L' ? '#dc3545' :
                                '#ffc107'
                        }`
                }}
            >
                <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                    {matchNum}
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                    <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#fff',
                        backgroundColor:
                            bracketType === 'W' ? '#28a745' :
                                bracketType === 'L' ? '#dc3545' :
                                    '#ffc107'
                    }}>
                        {bracketType === 'W' ? `W-R${round}` :
                            bracketType === 'L' ? `L-R${round}` :
                                bracketType === 'GF' ? 'GF' : bracketType}
                    </span>
                </td>
                <td style={{ padding: '8px' }}>
                    {renderPlayer(p1, 'score1')}
                </td>
                <td style={{ padding: '8px' }}>
                    {renderPlayer(p2, 'score2')}
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                    <input
                        style={{
                            width: 50,
                            fontSize: 14,
                            border: '1px solid #ccc',
                            borderRadius: 3,
                            textAlign: 'center',
                            padding: '2px 4px'
                        }}
                        value={table}
                        onChange={e => updateMatch(match.id, { table: e.target.value })}
                        disabled={finished}
                        maxLength={5}
                        placeholder="Table"
                    />
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                    <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: finished ? '#fff' : '#666',
                        backgroundColor: finished ? '#28a745' : isReady ? '#17a2b8' : '#6c757d'
                    }}>
                        {finished ? 'Finished' : isReady ? 'Ready' : 'Waiting'}
                    </span>
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                    {canFinalize && (
                        <button
                            style={{
                                fontSize: 12,
                                padding: "4px 8px",
                                borderRadius: 4,
                                background: "#28a745",
                                color: "#fff",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 'bold',
                                marginRight: '4px'
                            }}
                            onClick={() => markFinished(match)}
                            title="Finalize this match"
                        >
                            ✓ Finish
                        </button>
                    )}

                    {finished && (
                        <button
                            style={{
                                fontSize: 12,
                                padding: "4px 8px",
                                borderRadius: 4,
                                background: "#dc3545",
                                color: "#fff",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 'bold'
                            }}
                            onClick={() => undoFinished(match)}
                            title="Undo this match"
                        >
                            ↶ Undo
                        </button>
                    )}
                </td>
            </tr>
        );
    };

    const renderSection = (title, matches, bgColor, sectionId) => {
        if (matches.length === 0) return null;

        return (
            <div style={{ marginBottom: '30px' }} data-section={sectionId}>
                <h3 style={{
                    backgroundColor: bgColor,
                    color: '#fff',
                    padding: '8px 16px',
                    margin: '0 0 10px 0',
                    borderRadius: '6px',
                    fontWeight: 'bold'
                }}>
                    {title} ({matches.length} matches)
                </h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        backgroundColor: '#fff',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        tableLayout: 'fixed'
                    }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', color: '#495057', width: '80px' }}>Match #</th>
                                <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', color: '#495057', width: '100px' }}>Round</th>
                                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#495057', width: '200px' }}>Player 1 & Score</th>
                                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#495057', width: '200px' }}>Player 2 & Score</th>
                                <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', color: '#495057', width: '80px' }}>Table</th>
                                <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', color: '#495057', width: '100px' }}>Status</th>
                                <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', color: '#495057', width: '120px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matches.map(renderMatchRow)}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div style={{
            padding: '20px',
            minHeight: '100vh'
        }}>
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto'
            }}>
                {renderSection('Winners Bracket', winnersMatches, '#28a745', 'winners')}
                {renderSection('Losers Bracket', losersMatches, '#dc3545', 'losers')}
                {renderSection('Grand Finals', grandFinalsMatches, '#ffc107', 'grandfinals')}

                {bracket.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: '#6c757d'
                    }}>
                        <h3>No Tournament Active</h3>
                        <p>Start a tournament to view matches in table format.</p>
                    </div>
                )}
            </div>
        </div>
    );
}