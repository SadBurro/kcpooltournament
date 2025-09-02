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
    setSidebarOpen,
    totalTables,
    setTotalTables,
    tablesStartWithZero,
    setTablesStartWithZero,
    assignTables,
    customTableNumbers,
    setCustomTableNumbers,
    resetTournamentData
}) {
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [manualTableEntry, setManualTableEntry] = useState(false);
    const [showWarningDialog, setShowWarningDialog] = useState(false);
    const [warningAction, setWarningAction] = useState(null);
    const [playersListExpanded, setPlayersListExpanded] = useState(false);

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
        // If bracket exists, extract from bracket
        if (bracket.length > 0) {
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
            // Use sidebar text as fallback when no bracket exists
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

    // Reset tournament function with warning
    const resetTournament = () => {
        setWarningAction(() => () => {
            // Clear all tournament data
            handlePlayersChange({ target: { value: '' } });
            if (resetTournamentData) {
                resetTournamentData();
            }
            setShowWarningDialog(false);
        });
        setShowWarningDialog(true);
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
                    top: '70px',
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
                {/* Players Section */}
                <div>
                    {hasBracket ? (
                        // Tournament is active - collapsible players section
                        <>
                            <button
                                onClick={() => setPlayersListExpanded(!playersListExpanded)}
                                style={{
                                    padding: "7px 15px",
                                    fontSize: 16,
                                    fontWeight: 'bold',
                                    borderRadius: 9,
                                    background: "#48ACD3",
                                    color: "#fff",
                                    border: "2px solid #000000",
                                    boxShadow: "2px 2px 7px #ddd",
                                    marginBottom: 10,
                                    display: 'block',
                                    textAlign: 'center',
                                    width: '210px',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'all 0.2s ease'
                                }}
                                title={playersListExpanded ? "Click to hide players" : "Click to show players"}
                            >
                                Current Players ({currentPlayers.length})
                                <span style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}>
                                    {playersListExpanded ? '▲' : '▼'}
                                </span>
                            </button>

                            {playersListExpanded && (
                                <div style={{ marginBottom: 20 }}>
                                    {currentPlayers.map((playerName, idx) => (
                                        <div key={idx} style={{
                                            marginBottom: 8,
                                            padding: '6px 8px',
                                            background: '#fff',
                                            border: '1px solid #ddd',
                                            borderRadius: 4,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            width: '194px'
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
                            )}
                        </>
                    ) : (
                        // Pre-tournament - show regular header and bulk edit
                        <>
                            <b style={{
                                padding: "7px 15px",
                                fontSize: 16,
                                borderRadius: 9,
                                background: "#48ACD3",
                                color: "#fff",
                                border: "2px solid #000000",
                                boxShadow: "2px 2px 7px #ddd",
                                marginBottom: 10,
                                display: 'block',
                                textAlign: 'center',
                                width: '210px'
                            }}>
                                Enter Players Below
                            </b>
                            <br />

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
                        </>
                    )}
                </div>

                {/* Action Buttons */}
                <button onClick={handleShuffleBracket} style={buttonStyle}>{shuffleButtonText}</button>
                <button onClick={exportTournament} style={buttonStyle}>Export Tournament</button>
                <button onClick={() => fileInputRef.current.click()} style={buttonStyle}>Load Tournament</button>
                <button onClick={simulateTournament} style={buttonStyle}>Simulate Tournament</button>

                {/* Reset Tournament Button - only show if tournament exists */}
                {bracket.length > 0 && (
                    <button
                        onClick={resetTournament}
                        style={{
                            ...buttonStyle,
                            background: "#dc3545",
                            marginBottom: 20
                        }}
                    >
                        Reset Tournament
                    </button>
                )}

                <input
                    type="file"
                    accept="application/json"
                    style={{ display: "none" }}
                    ref={fileInputRef}
                    onChange={importTournament}
                />

                {/* Table Management Section */}
                {bracket.length > 0 && (
                    <div style={{ ...boxStyle, marginTop: 20, marginBottom: 16 }}>
                        <div style={boxHeader}>Table Management</div>

                        <div style={{ marginBottom: 15 }}>
                            <button
                                onClick={() => setManualTableEntry(!manualTableEntry)}
                                style={{
                                    padding: "5px 12px",
                                    fontSize: 12,
                                    borderRadius: 5,
                                    background: "#28a745",
                                    color: "#fff",
                                    border: "1px solid transparent",
                                    cursor: "pointer",
                                    width: "100%",
                                    marginBottom: 12
                                }}
                            >
                                {manualTableEntry ? "Switch to Auto Tables" : "Switch to Manual Tables"}
                            </button>
                        </div>

                        {manualTableEntry ? (
                            // Manual table entry mode
                            <div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
                                        Available Tables (comma-separated):
                                    </label>
                                    <textarea
                                        value={customTableNumbers}
                                        onChange={(e) => setCustomTableNumbers(e.target.value)}
                                        placeholder="1,2,3,5,7,8,12"
                                        style={{
                                            width: '95%',
                                            height: 60,
                                            fontSize: 12,
                                            border: '1px solid #bbb',
                                            borderRadius: 4,
                                            padding: '4px',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>
                                <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                                    Enter table numbers separated by commas.
                                    Examples: "1,2,3,5" or "A,B,C" or "10,12,14"
                                </div>
                            </div>
                        ) : (
                            // Automatic consecutive table mode
                            <div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: 'block', marginBottom: 8 }}>
                                        <span style={{ marginRight: 6, fontSize: 14 }}>Total Tables:</span>
                                        <input
                                            type="number"
                                            min={1}
                                            max={50}
                                            value={totalTables}
                                            style={{
                                                width: 60,
                                                fontSize: 14,
                                                borderRadius: 4,
                                                border: "1px solid #bbb",
                                                textAlign: "center",
                                                padding: '2px 4px'
                                            }}
                                            onChange={e => setTotalTables(Math.max(1, Math.min(50, Number(e.target.value))))}
                                        />
                                    </label>

                                    <label style={{ display: 'flex', alignItems: 'center', fontSize: 14, marginBottom: 8 }}>
                                        <input
                                            type="checkbox"
                                            checked={tablesStartWithZero}
                                            onChange={e => setTablesStartWithZero(e.target.checked)}
                                            style={{ marginRight: 6 }}
                                        />
                                        Tables start with 0
                                    </label>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={assignTables}
                            style={{
                                ...buttonStyle,
                                fontSize: 14,
                                padding: "6px 12px",
                                width: '100%',
                                marginBottom: 0
                            }}
                        >
                            Re-assign All Tables
                        </button>
                    </div>
                )}

                {/* Standings Section */}
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

                {/* Payout Section */}
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

                {/* Warning Dialog */}
                {showWarningDialog && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3000
                    }}>
                        <div style={{
                            backgroundColor: '#fff',
                            padding: '30px',
                            borderRadius: '10px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                            maxWidth: '400px',
                            textAlign: 'center'
                        }}>
                            <h3 style={{
                                color: '#dc3545',
                                marginBottom: '15px',
                                fontSize: '18px'
                            }}>
                                ⚠️ Warning
                            </h3>
                            <p style={{
                                marginBottom: '20px',
                                lineHeight: '1.5',
                                color: '#333'
                            }}>
                                You have an active tournament. This action may affect matches and results. Are you sure you want to continue?
                            </p>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setShowWarningDialog(false)}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#6c757d',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => warningAction && warningAction()}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#dc3545',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

const buttonStyle = {
    padding: "7px 15px",
    fontSize: 16,
    fontWeight: "bold",
    borderRadius: 9,
    background: "#48ACD3",
    color: "#fff",
    border: "2px solid #000000",
    boxShadow: "2px 2px 7px #ddd",
    cursor: "pointer",
    display: "block",
    width: '210px',
    marginBottom: 10,
};

const boxStyle = {
    marginTop: 30,
    background: "#fff",
    border: "2px solid #335",
    borderRadius: 10,
    boxShadow: "2px 2px 7px #ddd",
    padding: 14,
    width: 180,
    color: "#222",
};

const boxHeader = {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
    color: "#243248",
};