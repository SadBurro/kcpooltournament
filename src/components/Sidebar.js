// Enhanced Sidebar.js with both bulk and individual player name editing

import React, { useState } from "react";
import { isTournamentComplete } from "../utils/layoutUtils";
import { getStandings } from "../utils/bracketUtils";

export default function Sidebar({
    playersText,
    handlePlayersChange,
    handlePlayersBlur,
    handleShuffleBracket,
    shuffleButtonText,
    exportTournament,
    importTournament,
    fileInputRef,
    bracket,
    payoutAmounts,
    setPayoutAmounts,
    numPayoutPlaces,
    setNumPayoutPlaces,
    simulateTournament,
    handleSidebarPlayerNameChange,
    sidebarOpen,
    setSidebarOpen
}) {
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [showBulkEdit, setShowBulkEdit] = useState(false);

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

    // Get current players from the bracket or sidebar text
    const getCurrentPlayers = () => {
        if (bracket.length > 0) {
            // Extract unique player names from bracket
            const playerNames = new Set();
            bracket.forEach(match => {
                if (match.p1?.name &&
                    match.p1.name !== "BYE" &&
                    !match.p1.name.startsWith("Winner of") &&
                    !match.p1.name.startsWith("Loser of")) {
                    playerNames.add(match.p1.name);
                }
                if (match.p2?.name &&
                    match.p2.name !== "BYE" &&
                    !match.p2.name.startsWith("Winner of") &&
                    !match.p2.name.startsWith("Loser of")) {
                    playerNames.add(match.p2.name);
                }
            });
            return Array.from(playerNames).sort();
        } else {
            // Use sidebar text
            return playersText
                .trim()
                .split('\n')
                .filter(Boolean)
                .map(name => name.trim())
                .filter(name => name);
        }
    };

    const handlePlayerEdit = (oldName, newName) => {
        if (!newName.trim() || oldName === newName) return;

        if (handleSidebarPlayerNameChange) {
            handleSidebarPlayerNameChange(oldName, newName.trim());
        }

        setEditingPlayer(null);
        setEditValue("");
    };

    const startEditing = (playerName) => {
        setEditingPlayer(playerName);
        setEditValue(playerName);
    };

    const cancelEditing = () => {
        setEditingPlayer(null);
        setEditValue("");
    };

    const submitEdit = (oldName) => {
        handlePlayerEdit(oldName, editValue);
    };

    const handleKeyPress = (e, oldName) => {
        if (e.key === 'Enter') {
            handlePlayerEdit(oldName, editValue);
        } else if (e.key === 'Escape') {
            cancelEditing();
        }
    };

    const currentPlayers = getCurrentPlayers();
    const hasBracket = bracket.length > 0;

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                    position: 'fixed',
                    top: '50px',
                    left: sidebarOpen ? '260px' : '10px',
                    zIndex: 2000,
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#48ACD3',
                    color: '#fff',
                    border: '2px solid #000000',
                    boxShadow: '2px 2px 7px #ddd',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    transition: 'left 0.3s ease'
                }}
                title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
                {sidebarOpen ? '‹' : '›'}
            </button>

            {/* Sidebar */}
            <div style={{
                position: 'fixed',
                left: sidebarOpen ? 0 : '-270px',
                top: 0,
                width: '250px',
                height: '100vh',
                background: '#f8f9fa',
                borderRight: '2px solid #dee2e6',
                overflowY: 'auto',
                zIndex: 1000,
                padding: '20px',
                transition: 'left 0.3s ease'
            }}>
                <div>
                    <b style={{
                        padding: "7px 20px",
                        fontSize: 16,
                        borderRadius: 9,
                        background: "#48ACD3",
                        color: "#fff",
                        border: "2px solid #000000",
                        boxShadow: "2px 2px 7px #ddd",
                        marginBottom: 10,
                        display: 'block',
                        textAlign: 'center'
                    }}>
                        {hasBracket ? "Current Players" : "Enter Players Below"}
                    </b>
                    <br />

                    {hasBracket ? (
                        showBulkEdit ? (
                            // Show textarea for bulk editing when bracket exists and bulk edit is toggled
                            <div>
                                <div style={{ marginBottom: 15 }}>
                                    <button
                                        onClick={() => setShowBulkEdit(false)}
                                        style={{
                                            padding: "5px 12px",
                                            fontSize: 12,
                                            borderRadius: 5,
                                            background: "#6c757d",
                                            color: "#fff",
                                            border: "1px solid transparent",
                                            cursor: "pointer",
                                            width: "100%"
                                        }}
                                    >
                                        Switch to Individual Edit
                                    </button>
                                </div>
                                <textarea
                                    value={playersText}
                                    onChange={handlePlayersChange}
                                    onBlur={handlePlayersBlur}
                                    rows={12}
                                    placeholder="Enter one player per line"
                                    style={{
                                        width: 180,
                                        marginBottom: 20,
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
                        ) : (
                            // Show editable player list when bracket exists and individual edit mode
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ marginBottom: 15 }}>
                                    <button
                                        onClick={() => setShowBulkEdit(true)}
                                        style={{
                                            padding: "5px 12px",
                                            fontSize: 12,
                                            borderRadius: 5,
                                            background: "#28a745",
                                            color: "#fff",
                                            border: "1px solid transparent",
                                            cursor: "pointer",
                                            width: "100%"
                                        }}
                                    >
                                        Switch to Bulk Edit
                                    </button>
                                </div>
                                {currentPlayers.map((playerName, idx) => (
                                    <div key={idx} style={{
                                        marginBottom: 8,
                                        padding: '6px 8px',
                                        background: '#fff',
                                        border: '1px solid #ddd',
                                        borderRadius: 4,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        {editingPlayer === playerName ? (
                                            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onKeyDown={(e) => handleKeyPress(e, playerName)}
                                                    style={{
                                                        flex: 1,
                                                        border: '1px solid #007bff',
                                                        borderRadius: 3,
                                                        padding: '2px 4px',
                                                        fontSize: 14,
                                                        marginRight: 8
                                                    }}
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => submitEdit(playerName)}
                                                    style={{
                                                        background: '#28a745',
                                                        border: 'none',
                                                        color: '#fff',
                                                        cursor: 'pointer',
                                                        fontSize: 12,
                                                        padding: '4px 6px',
                                                        borderRadius: 3,
                                                        marginRight: 4,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                    title="Save changes"
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    onClick={cancelEditing}
                                                    style={{
                                                        background: '#dc3545',
                                                        border: 'none',
                                                        color: '#fff',
                                                        cursor: 'pointer',
                                                        fontSize: 12,
                                                        padding: '4px 6px',
                                                        borderRadius: 3,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                    title="Cancel changes"
                                                >
                                                    ✗
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span style={{
                                                    flex: 1,
                                                    fontSize: 14,
                                                    cursor: 'pointer'
                                                }}
                                                    onClick={() => startEditing(playerName)}
                                                    title="Click to edit player name">
                                                    {playerName}
                                                </span>
                                                <button
                                                    onClick={() => startEditing(playerName)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#666',
                                                        cursor: 'pointer',
                                                        fontSize: 12,
                                                        padding: '2px 4px'
                                                    }}
                                                    title="Edit player name"
                                                >
                                                    ✏️
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ))}
                                <div style={{
                                    fontSize: 12,
                                    color: '#666',
                                    fontStyle: 'italic',
                                    marginTop: 10
                                }}>
                                    Click any player name to edit
                                </div>
                            </div>
                        )
                    ) : (
                        // Show textarea when no bracket exists (always bulk edit before tournament)
                        <textarea
                            value={playersText}
                            onChange={handlePlayersChange}
                            onBlur={handlePlayersBlur}
                            rows={12}
                            placeholder="Enter one player per line"
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
                    )}
                </div>

                <button onClick={handleShuffleBracket} style={buttonStyle}>{shuffleButtonText}</button>
                <button onClick={exportTournament} style={buttonStyle}>Export Tournament</button>
                <button onClick={() => fileInputRef.current.click()} style={buttonStyle}>Load Tournament</button>
                <button onClick={simulateTournament} style={buttonStyle}>Simulate Tournament</button>
                <input
                    type="file"
                    accept="application/json"
                    style={{ display: "none" }}
                    ref={fileInputRef}
                    onChange={importTournament}
                />

                {isTournamentComplete(bracket) && (
                    <div style={boxStyle}>
                        <div style={boxHeader}>Standings</div>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <tbody>
                                {(() => {
                                    const standings = getStandings(bracket);
                                    const rows = [];
                                    let count = 0;
                                    for (let idx = 0; idx < standings.length && count < numPayoutPlaces; idx++) {
                                        let group = standings[idx];
                                        let place = idx + 1;
                                        let placeLabel = getPlaceLabel(idx);
                                        let color = ["#FFD700", "#C0C0C0", "#CD7F32"][idx] || "#333";
                                        for (let player of group) {
                                            if (count >= numPayoutPlaces) break;
                                            rows.push(
                                                <tr key={player}>
                                                    <td style={{ fontWeight: "bold", color, padding: "2px 8px", fontSize: 15 }}>
                                                        {placeLabel}
                                                    </td>
                                                    <td style={{ color, fontWeight: "bold", padding: "2px 4px", fontSize: 15 }}>
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
                    </div>
                )}

                <div style={{ ...boxStyle, marginBottom: 16 }}>
                    <div style={boxHeader}>Payout</div>
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
            </div>
        </>
    );
}

const buttonStyle = {
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
};

const boxStyle = {
    marginTop: 30,
    background: "#fff",
    border: "2px solid #335",
    borderRadius: 10,
    boxShadow: "2px 2px 7px #ddd",
    padding: 14,
    width: 170,
    color: "#222",
};

const boxHeader = {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
    color: "#243248",
};