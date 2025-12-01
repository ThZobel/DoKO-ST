// ============================================================
// STATE MANAGEMENT
// ============================================================
let state = {
    members: [],
    evenings: [],
    currentEvening: null,
    settings: {
        penaltyCost: 0.5,
        hostBonus: 20,
        fixedContribution: 10
    },
    currentTab: 'home',
    gameState: {
        players: [],
        games: [],
        currentDealerIndex: 0,
        selectedWinners: [],
        currentPoints: '',
        isSolo: false
    },
    isOnline: navigator.onLine,
    authenticated: false
};

// ============================================================
// API FUNCTIONS
// ============================================================
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (err) {
        console.error('API Error:', err);
        throw err;
    }
}

async function login() {
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        const result = await apiCall('/api/login', {
            method: 'POST',
            body: JSON.stringify({ password })
        });
        
        if (result.success) {
            state.authenticated = true;
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('appContent').style.display = 'block';
            await loadData();
        }
    } catch (err) {
        errorDiv.textContent = 'Falsches Passwort';
        errorDiv.style.display = 'block';
    }
}

async function logout() {
    try {
        await apiCall('/api/logout', { method: 'POST' });
    } catch (err) {
        console.error('Logout error:', err);
    }
    
    state.authenticated = false;
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('appContent').style.display = 'none';
    document.getElementById('loginPassword').value = '';
}

async function checkAuth() {
    try {
        const result = await apiCall('/api/check-auth');
        if (result.authenticated) {
            state.authenticated = true;
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('appContent').style.display = 'block';
            await loadData();
        }
    } catch (err) {
        console.log('Not authenticated');
    }
}

async function loadData() {
    try {
        if (state.isOnline && state.authenticated) {
            const data = await apiCall('/api/data');
            state.members = data.members || [];
            state.evenings = data.evenings || [];
            state.settings = data.settings || state.settings;
            
            // Fallback für alte Daten
            if (!state.settings.fixedContribution) {
                state.settings.fixedContribution = 10;
            }
            
            // Auch im localStorage speichern für Offline
            localStorage.setItem('doku-club-data', JSON.stringify(data));
        } else {
            // Offline: Von localStorage laden
            const saved = localStorage.getItem('doku-club-data');
            if (saved) {
                const data = JSON.parse(saved);
                state.members = data.members || [];
                state.evenings = data.evenings || [];
                state.settings = data.settings || state.settings;
            }
        }
    } catch (err) {
        console.error('Load error:', err);
        // Fallback zu localStorage
        try {
            const saved = localStorage.getItem('doku-club-data');
            if (saved) {
                const data = JSON.parse(saved);
                state.members = data.members || [];
                state.evenings = data.evenings || [];
                state.settings = data.settings || state.settings;
            }
        } catch (e) {
            console.log('No local data');
        }
    }
    
    render();
}

async function saveData() {
    const data = {
        members: state.members,
        evenings: state.evenings,
        settings: state.settings,
        savedAt: new Date().toISOString()
    };
    
    // Immer lokal speichern
    try {
        localStorage.setItem('doku-club-data', JSON.stringify(data));
    } catch (e) {
        console.error('LocalStorage error:', e);
    }
    
    // Online: Auch an Server senden
    if (state.isOnline && state.authenticated) {
        try {
            await apiCall('/api/data', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        } catch (err) {
            console.error('Save to server failed:', err);
            showOfflineStatus();
        }
    }
}

function showOfflineStatus() {
    const statusBar = document.getElementById('statusBar');
    statusBar.classList.add('show');
}

function hideOfflineStatus() {
    const statusBar = document.getElementById('statusBar');
    statusBar.classList.remove('show');
}

// ============================================================
// ONLINE/OFFLINE DETECTION
// ============================================================
window.addEventListener('online', async () => {
    state.isOnline = true;
    hideOfflineStatus();
    
    // Sync mit Server wenn wieder online
    if (state.authenticated) {
        await saveData();
        await loadData();
    }
});

window.addEventListener('offline', () => {
    state.isOnline = false;
    showOfflineStatus();
});

// ============================================================
// UI FUNCTIONS
// ============================================================
function switchTab(tab) {
    state.currentTab = tab;
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    
    if (tab === 'home') {
        document.querySelector('.nav-tab').classList.add('active');
        document.getElementById('homeTab').style.display = 'block';
    } else if (tab === 'members') {
        document.querySelectorAll('.nav-tab')[1].classList.add('active');
        document.getElementById('membersTab').style.display = 'block';
        renderMembersList();
    } else if (tab === 'finance') {
        document.querySelectorAll('.nav-tab')[2].classList.add('active');
        document.getElementById('financeTab').style.display = 'block';
        renderFinance();
    } else if (tab === 'settings') {
        document.querySelectorAll('.nav-tab')[3].classList.add('active');
        document.getElementById('settingsTab').style.display = 'block';
        loadSettings();
    } else if (tab === 'game') {
        document.getElementById('gameTab').style.display = 'block';
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showNewEveningModal() {
    const participantsList = document.getElementById('participantsList');
    const locationSelect = document.getElementById('locationSelect');
    
    participantsList.innerHTML = state.members.map(m => `
        <label class="checkbox-item">
            <input type="checkbox" value="${m.id}">
            <span>${m.name}</span>
        </label>
    `).join('');
    
    locationSelect.innerHTML = '<option value="">Bitte wählen...</option>' +
        '<option value="kneipe">Kneipe</option>' +
        state.members.map(m => `<option value="member_${m.id}">Bei ${m.name}</option>`).join('');
    
    document.getElementById('newEveningModal').classList.add('active');
}

function showAddMemberModal() {
    document.getElementById('memberName').value = '';
    document.getElementById('addMemberModal').classList.add('active');
}

function addMember() {
    const name = document.getElementById('memberName').value.trim();
    if (!name) return;
    
    state.members.push({
        id: Date.now(),
        name: name
    });
    
    saveData();
    closeModal('addMemberModal');
    renderMembersList();
}

function removeMember(id) {
    if (confirm('Mitglied wirklich löschen?')) {
        state.members = state.members.filter(m => m.id !== id);
        saveData();
        renderMembersList();
    }
}

function renderMembersList() {
    const list = document.getElementById('membersList');
    if (state.members.length === 0) {
        list.innerHTML = '<p style="color:#9ca3af">Noch keine Mitglieder vorhanden</p>';
        return;
    }
    
    list.innerHTML = state.members.map(m => `
        <div class="player-item">
            <span>${m.name}</span>
            <button class="btn btn-danger" style="padding:0.25rem 0.5rem" onclick="removeMember(${m.id})">✕</button>
        </div>
    `).join('');
}

function loadSettings() {
    document.getElementById('fixedContribution').value = state.settings.fixedContribution;
    document.getElementById('penaltyCost').value = state.settings.penaltyCost;
    document.getElementById('hostBonus').value = state.settings.hostBonus;
}

function saveSettings() {
    state.settings.fixedContribution = parseFloat(document.getElementById('fixedContribution').value);
    state.settings.penaltyCost = parseFloat(document.getElementById('penaltyCost').value);
    state.settings.hostBonus = parseFloat(document.getElementById('hostBonus').value);
    saveData();
    alert('Einstellungen gespeichert');
}

function createEvening() {
    const checkboxes = document.querySelectorAll('#participantsList input[type="checkbox"]:checked');
    const participantIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    const location = document.getElementById('locationSelect').value;
    
    if (participantIds.length < 4 || participantIds.length > 5) {
        alert('Es müssen 4 oder 5 Teilnehmer ausgewählt werden');
        return;
    }
    
    if (!location) {
        alert('Bitte Ort auswählen');
        return;
    }
    
    let hostId = null;
    if (location.startsWith('member_')) {
        hostId = parseInt(location.replace('member_', ''));
        if (!participantIds.includes(hostId)) {
            alert('Der Gastgeber muss auch Teilnehmer sein');
            return;
        }
    }
    
    const evening = {
        id: Date.now(),
        date: new Date().toISOString(),
        participantIds: participantIds,
        hostId: hostId,
        location: location,
        games: [],
        settlement: null,
        finished: false
    };
    
    state.evenings.push(evening);
    state.currentEvening = evening;
    
    state.gameState = {
        players: participantIds.map(id => {
            const member = state.members.find(m => m.id === id);
            return {
                id: id,
                name: member.name,
                totalPoints: 0,
                penalties: 0
            };
        }),
        games: [],
        currentDealerIndex: 0,
        selectedWinners: [],
        currentPoints: '',
        isSolo: false
    };
    
    saveData();
    closeModal('newEveningModal');
    switchTab('game');
    renderGame();
}

function openEvening(eveningId) {
    const evening = state.evenings.find(e => e.id === eveningId);
    if (!evening) return;
    
    state.currentEvening = evening;
    state.gameState = {
        players: evening.participantIds.map(id => {
            const member = state.members.find(m => m.id === id);
            const playerData = evening.playerData ? evening.playerData.find(p => p.id === id) : null;
            return playerData || {
                id: id,
                name: member.name,
                totalPoints: 0,
                penalties: 0
            };
        }),
        games: evening.games || [],
        currentDealerIndex: evening.currentDealerIndex || 0,
        selectedWinners: [],
        currentPoints: '',
        isSolo: false
    };
    
    switchTab('game');
    renderGame();
}

function toggleGameMode(isSolo) {
    state.gameState.isSolo = isSolo;
    state.gameState.selectedWinners = [];
    renderGame();
}

function toggleWinner(playerId) {
    const gs = state.gameState;
    const idx = gs.selectedWinners.indexOf(playerId);
    if (idx > -1) {
        gs.selectedWinners.splice(idx, 1);
    } else {
        const maxWinners = gs.isSolo ? 3 : 2;
        if (gs.selectedWinners.length < maxWinners) {
            gs.selectedWinners.push(playerId);
        }
    }
    renderGame();
}

function adjustPenalty(playerId, delta) {
    const player = state.gameState.players.find(p => p.id === playerId);
    if (player) {
        player.penalties = Math.max(0, player.penalties + delta);
        renderGame();
    }
}

function addGameToEvening() {
    const gs = state.gameState;
    const points = parseInt(gs.currentPoints);
    const validWinners = gs.isSolo 
        ? (gs.selectedWinners.length === 1 || gs.selectedWinners.length === 3)
        : gs.selectedWinners.length === 2;
    
    if (!points || !validWinners) return;

    gs.players = gs.players.map((player, idx) => {
        if (gs.players.length === 5 && idx === gs.currentDealerIndex) {
            return player;
        }
        
        const isWinner = gs.selectedWinners.includes(player.id);
        let pointChange;
        
        if (gs.isSolo) {
            if (gs.selectedWinners.length === 1) {
                pointChange = isWinner ? points * 3 : -points;
            } else {
                pointChange = isWinner ? points : -points * 3;
            }
        } else {
            pointChange = isWinner ? points : -points;
        }
        
        return {
            ...player,
            totalPoints: player.totalPoints + pointChange
        };
    });

    gs.games.push({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        points: points,
        winners: [...gs.selectedWinners],
        dealerIndex: gs.players.length === 5 ? gs.currentDealerIndex : null,
        isSolo: gs.isSolo
    });

    if (gs.players.length === 5) {
        gs.currentDealerIndex = (gs.currentDealerIndex + 1) % 5;
    }

    gs.currentPoints = '';
    gs.selectedWinners = [];
    gs.isSolo = false;
    
    state.currentEvening.games = gs.games;
    state.currentEvening.currentDealerIndex = gs.currentDealerIndex;
    state.currentEvening.playerData = gs.players;
    
    saveData();
    renderGame();
}

function finishEvening() {
    if (!confirm('Abend wirklich beenden?')) return;
    
    const gs = state.gameState;
    const sorted = [...gs.players].sort((a, b) => b.totalPoints - a.totalPoints);
    const basePayout = gs.players.length === 5 ? [2, 3, 4, 5, 6] : [2, 3, 4, 5];
    
    const numParticipants = gs.players.length;
    const hostContribution = state.settings.hostBonus;
    const fixedContribution = state.settings.fixedContribution;
    const hasHost = state.currentEvening.hostId !== null;
    
    const settlement = sorted.map((player, idx) => {
        const penaltyCost = player.penalties * state.settings.penaltyCost;
        const isHost = hasHost && player.id === state.currentEvening.hostId;
        
        const gameTotal = basePayout[idx] + penaltyCost;
        let gamePlusHost = gameTotal;
        let hostPayment = 0;
        
        if (hasHost) {
            hostPayment = isHost ? (numParticipants - 1) * hostContribution : hostContribution;
            gamePlusHost = isHost ? gameTotal - hostPayment : gameTotal + hostContribution;
        }
        
        const totalPayout = gamePlusHost + fixedContribution;
        
        return {
            id: player.id,
            name: player.name,
            points: player.totalPoints,
            penalties: player.penalties,
            basePayout: basePayout[idx],
            penaltyCost: penaltyCost,
            gameTotal: gameTotal,
            hostPayment: hostPayment,
            fixedContribution: fixedContribution,
            totalPayout: totalPayout,
            isHost: isHost
        };
    });
    
    const gameTotals = settlement.map(s => s.gameTotal);
    const avgGameTotal = gameTotals.reduce((sum, t) => sum + t, 0) / gameTotals.length;
    
    const nonParticipants = state.members.filter(m => 
        !state.currentEvening.participantIds.includes(m.id)
    ).map(m => ({
        id: m.id,
        name: m.name,
        points: 0,
        penalties: 0,
        basePayout: 0,
        penaltyCost: 0,
        gameTotal: avgGameTotal,
        hostPayment: 0,
        fixedContribution: fixedContribution,
        totalPayout: avgGameTotal + fixedContribution,
        isNonParticipant: true
    }));
    
    state.currentEvening.settlement = {
        participants: settlement,
        nonParticipants: nonParticipants,
        timestamp: new Date().toISOString()
    };
    state.currentEvening.finished = true;
    
    saveData();
    renderGame();
}

function renderEveningsList() {
    const list = document.getElementById('eveningsList');
    if (state.evenings.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>Noch keine DoKu-Abende</p></div>';
        return;
    }
    
    const html = state.evenings.slice().reverse().map(evening => {
        const date = new Date(evening.date);
        const host = evening.hostId ? state.members.find(m => m.id === evening.hostId) : null;
        const locationText = evening.location === 'kneipe' ? 'Kneipe' : (host ? `Bei ${host.name}` : 'Unbekannt');
        const participants = evening.participantIds.map(id => {
            const m = state.members.find(mem => mem.id === id);
            return m ? m.name : '?';
        }).join(', ');
        
        return `
            <div class="evening-card" onclick="openEvening(${evening.id})">
                <strong>${date.toLocaleDateString('de-DE')}</strong> - ${date.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'})}
                <div style="color:#9ca3af; font-size:0.875rem; margin-top:0.25rem">
                    Ort: ${locationText} | Teilnehmer: ${participants}
                </div>
                <div style="color:#9ca3af; font-size:0.875rem">
                    ${evening.games.length} Spiele ${evening.finished ? '✓ Abgeschlossen' : '⏳ Läuft'}
                </div>
            </div>
        `;
    }).join('');
    
    list.innerHTML = `<div class="card"><h2>Bisherige Abende</h2>${html}</div>`;
}

function renderGame() {
    const content = document.getElementById('gameContent');
    const gs = state.gameState;
    
    if (!state.currentEvening) {
        content.innerHTML = '<div class="empty-state">Kein aktiver Abend</div>';
        return;
    }
    
    const activePlayers = gs.players.length === 5 
        ? gs.players.filter((_, idx) => idx !== gs.currentDealerIndex)
        : gs.players;
    
    const validWinners = gs.isSolo 
        ? (gs.selectedWinners.length === 1 || gs.selectedWinners.length === 3)
        : gs.selectedWinners.length === 2;
    
    let winnerLabel;
    if (gs.isSolo) {
        if (gs.selectedWinners.length === 0) {
            winnerLabel = 'Solo-Spieler (1) oder Gewinner bei verlorenem Solo (3)';
        } else if (gs.selectedWinners.length === 1) {
            winnerLabel = 'Solo-Spieler gewählt';
        } else if (gs.selectedWinners.length < 3) {
            winnerLabel = `${gs.selectedWinners.length}/3 Gewinner`;
        } else {
            winnerLabel = 'Solo verloren (3 Gewinner)';
        }
    } else {
        winnerLabel = `Gewinner (${gs.selectedWinners.length}/2)`;
    }
    
    const host = state.currentEvening.hostId ? state.members.find(m => m.id === state.currentEvening.hostId) : null;
    const locationText = state.currentEvening.location === 'kneipe' ? 'Kneipe' : (host ? `Bei ${host.name}` : 'Unbekannt');
    
    content.innerHTML = `
        <button class="btn btn-secondary" onclick="switchTab('home')" style="margin-bottom:1rem">← Zurück zur Übersicht</button>
        
        <div class="card">
            <h2>DoKu-Abend vom ${new Date(state.currentEvening.date).toLocaleDateString('de-DE')}</h2>
            <p style="color:#9ca3af">Ort: ${locationText} | ${gs.games.length} Spiele gespielt</p>
        </div>
        
        ${!state.currentEvening.finished ? `
            <div class="card">
                <h2>Neue Runde</h2>
                ${gs.players.length === 5 ? `<div style="background:#7c2d12; padding:0.5rem; border-radius:0.375rem; font-size:0.875rem; margin-bottom:1rem">
                    <strong>Geber (setzt aus):</strong> ${gs.players[gs.currentDealerIndex]?.name}
                </div>` : ''}
                
                <div class="game-mode-selector">
                    <button class="mode-btn ${!gs.isSolo ? 'active' : ''}" onclick="toggleGameMode(false)">Normal (2v2)</button>
                    <button class="mode-btn ${gs.isSolo ? 'active' : ''}" onclick="toggleGameMode(true)">Solo (1v3)</button>
                </div>
                
                <label class="label">${winnerLabel}</label>
                <div class="winner-grid">
                    ${activePlayers.map(p => `
                        <button class="winner-btn ${gs.selectedWinners.includes(p.id) ? 'selected' : ''}" 
                                onclick="toggleWinner(${p.id})">
                            ${p.name}
                        </button>
                    `).join('')}
                </div>
                
                <label class="label">Punkte</label>
                <input type="number" id="pointsInput" placeholder="z.B. 1, 2, 3..." 
                       value="${gs.currentPoints}" 
                       oninput="state.gameState.currentPoints = this.value; renderGame()">
                
                <button class="btn btn-primary" style="width:100%; margin-top:0.5rem" 
                        onclick="addGameToEvening()" 
                        ${!gs.currentPoints || !validWinners ? 'disabled' : ''}>
                    Runde hinzufügen
                </button>
            </div>
            
            <div class="card">
                <h2>Punktestand</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Spieler</th>
                            <th class="text-center">Punkte</th>
                            <th class="text-center">Strafen</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gs.players.map((p, idx) => `
                            <tr style="${gs.players.length === 5 && idx === gs.currentDealerIndex ? 'background:#7c2d1220' : ''}">
                                <td>
                                    ${gs.players.length === 5 && idx === gs.currentDealerIndex ? '🃏 ' : ''}
                                    ${p.name}
                                </td>
                                <td class="text-center ${p.totalPoints > 0 ? 'text-green' : p.totalPoints < 0 ? 'text-red' : ''}" 
                                    style="font-size:1.125rem; font-weight:bold">
                                    ${p.totalPoints > 0 ? '+' : ''}${p.totalPoints}
                                </td>
                                <td class="text-center">
                                    <div class="penalty-controls">
                                        <button class="penalty-btn" onclick="adjustPenalty(${p.id}, -1)" ${p.penalties === 0 ? 'disabled' : ''}>−</button>
                                        <span class="text-orange" style="font-weight:bold; width:2rem">${p.penalties}</span>
                                        <button class="penalty-btn" onclick="adjustPenalty(${p.id}, 1)">+</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            ${gs.games.length > 0 ? `
                <div class="card">
                    <button class="btn btn-success" style="width:100%" onclick="finishEvening()">
                        Abend beenden & Abrechnung
                    </button>
                </div>
            ` : ''}
        ` : `
            <div class="card">
                <h2>Abrechnung</h2>
                ${renderEveningSettlement()}
            </div>
        `}
    `;
}

function renderEveningSettlement() {
    const settlement = state.currentEvening.settlement;
    if (!settlement) return '';
    
    const ranks = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    const hasHost = state.currentEvening.hostId !== null;
    const numParticipants = settlement.participants.length;
    
    let html = '<h3>Teilnehmer</h3>';
    settlement.participants.forEach((p, idx) => {
        html += `
            <div class="player-item" style="margin-bottom:0.75rem">
                <div>
                    <div style="display:flex; align-items:center; gap:0.5rem">
                        <span style="font-size:1.5rem">${ranks[idx]}</span>
                        <strong>${p.name}</strong>
                        ${p.isHost ? '<span style="color:#f97316; font-size:0.75rem">(Gastgeber)</span>' : ''}
                    </div>
                    <div style="font-size:0.875rem; color:#9ca3af">
                        ${p.points} Punkte | Basis: ${p.basePayout}€
                        ${p.penalties > 0 ? ` | Strafen: +${p.penaltyCost.toFixed(1)}€` : ''}
                        ${hasHost ? (p.isHost 
                            ? ` | Gastgeber erhält: -${p.hostPayment.toFixed(0)}€ (${numParticipants - 1}×${state.settings.hostBonus}€)` 
                            : ` | Gastgeber-Beitrag: +${state.settings.hostBonus}€`) : ''}
                        | Fixer Beitrag: +${p.fixedContribution}€
                    </div>
                </div>
                <div style="font-size:1.5rem; font-weight:bold; color:${p.totalPayout > 0 ? '#ef4444' : '#10b981'}">
                    ${p.totalPayout.toFixed(2)} €
                </div>
            </div>
        `;
    });
    
    if (settlement.nonParticipants.length > 0) {
        html += '<h3 style="margin-top:1.5rem">Nicht-Teilnehmer</h3>';
        settlement.nonParticipants.forEach(p => {
            html += `
                <div class="player-item" style="margin-bottom:0.75rem">
                    <div>
                        <strong>${p.name}</strong>
                        <div style="font-size:0.875rem; color:#9ca3af">
                            Durchschnitt der Spielabrechnung: ${p.gameTotal.toFixed(2)}€ | Fixer Beitrag: +${p.fixedContribution}€
                        </div>
                    </div>
                    <div style="font-size:1.5rem; font-weight:bold; color:#ef4444">
                        ${p.totalPayout.toFixed(2)} €
                    </div>
                </div>
            `;
        });
    }
    
    const totalIncome = settlement.participants.reduce((sum, p) => sum + p.totalPayout, 0) +
                        settlement.nonParticipants.reduce((sum, p) => sum + p.totalPayout, 0);
    
    html += `
        <div style="margin-top:1.5rem; padding:1rem; background:#374151; border-radius:0.375rem">
            <div style="font-size:0.875rem; color:#9ca3af">Gesamteinnahmen</div>
            <div style="font-size:2rem; font-weight:bold; color:#10b981">${totalIncome.toFixed(2)} €</div>
        </div>
    `;
    
    return html;
}

function renderFinance() {
    const content = document.getElementById('financeOverview');
    
    if (state.evenings.length === 0) {
        content.innerHTML = '<div class="empty-state"><p>Noch keine Abrechnungen vorhanden</p></div>';
        return;
    }
    
    const finishedEvenings = state.evenings.filter(e => e.finished && e.settlement);
    
    let totalIncome = 0;
    const memberTotals = {};
    
    state.members.forEach(m => {
        memberTotals[m.id] = { name: m.name, total: 0, evenings: 0 };
    });
    
    finishedEvenings.forEach(evening => {
        const settlement = evening.settlement;
        const eveningTotal = settlement.participants.reduce((sum, p) => sum + p.totalPayout, 0) +
                            settlement.nonParticipants.reduce((sum, p) => sum + p.totalPayout, 0);
        totalIncome += eveningTotal;
        
        settlement.participants.forEach(p => {
            if (memberTotals[p.id]) {
                memberTotals[p.id].total += p.totalPayout;
                memberTotals[p.id].evenings++;
            }
        });
        
        settlement.nonParticipants.forEach(p => {
            if (memberTotals[p.id]) {
                memberTotals[p.id].total += p.totalPayout;
            }
        });
    });
    
    const membersList = Object.values(memberTotals).sort((a, b) => b.total - a.total);
    
    let html = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${finishedEvenings.length}</div>
                <div class="stat-label">Abgerechnete Abende</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalIncome.toFixed(2)} €</div>
                <div class="stat-label">Gesamteinnahmen</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${(totalIncome / finishedEvenings.length).toFixed(2)} €</div>
                <div class="stat-label">Ø pro Abend</div>
            </div>
        </div>
        
        <div class="card">
            <h2>Mitglieder-Übersicht</h2>
            <table>
                <thead>
                    <tr>
                        <th>Mitglied</th>
                        <th class="text-center">Abende</th>
                        <th class="text-right">Gesamt gezahlt</th>
                    </tr>
                </thead>
                <tbody>
                    ${membersList.map(m => `
                        <tr>
                            <td>${m.name}</td>
                            <td class="text-center">${m.evenings}</td>
                            <td class="text-right" style="font-weight:bold; color:#ef4444">${m.total.toFixed(2)} €</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="card">
            <h2>Abrechnungen je Abend</h2>
    `;
    
    finishedEvenings.slice().reverse().forEach(evening => {
        const date = new Date(evening.date);
        const settlement = evening.settlement;
        const host = evening.hostId ? state.members.find(m => m.id === evening.hostId) : null;
        const locationText = evening.location === 'kneipe' ? 'Kneipe' : (host ? `Bei ${host.name}` : 'Unbekannt');
        const eveningTotal = settlement.participants.reduce((sum, p) => sum + p.totalPayout, 0) +
                            settlement.nonParticipants.reduce((sum, p) => sum + p.totalPayout, 0);
        
        html += `
            <div style="background:#374151; padding:1rem; border-radius:0.375rem; margin-bottom:1rem">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem">
                    <strong>${date.toLocaleDateString('de-DE')} - ${locationText}</strong>
                    <strong style="color:#10b981">${eveningTotal.toFixed(2)} €</strong>
                </div>
                <table style="width:100%; font-size:0.875rem">
                    ${settlement.participants.map(p => `
                        <tr>
                            <td>${p.name}</td>
                            <td class="text-right">${p.totalPayout.toFixed(2)} €</td>
                        </tr>
                    `).join('')}
                    ${settlement.nonParticipants.map(p => `
                        <tr style="opacity:0.7">
                            <td>${p.name} (nicht teilgenommen)</td>
                            <td class="text-right">${p.totalPayout.toFixed(2)} €</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        `;
    });
    
    html += '</div>';
    content.innerHTML = html;
}

function render() {
    if (state.currentTab === 'home') {
        renderEveningsList();
    } else if (state.currentTab === 'members') {
        renderMembersList();
    } else if (state.currentTab === 'finance') {
        renderFinance();
    }
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
