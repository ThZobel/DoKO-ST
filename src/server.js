require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PASSWORD = process.env.APP_PASSWORD || 'doko2024';
const DATA_FILE = path.join(__dirname, 'data', 'storage.json');

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.static('public'));

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
        // Create storage file if it doesn't exist
        try {
            await fs.access(DATA_FILE);
        } catch {
            await fs.writeFile(DATA_FILE, JSON.stringify({
                members: [],
                evenings: [],
                settings: {
                    penaltyCost: 0.5,
                    hostBonus: 20,
                    fixedContribution: 10
                }
            }, null, 2));
        }
    } catch (err) {
        console.error('Error creating data directory:', err);
    }
}

// Simple auth middleware
function requireAuth(req, res, next) {
    if (req.cookies.authenticated === 'true') {
        next();
    } else {
        res.status(401).json({ error: 'Nicht authentifiziert' });
    }
}

// Auth endpoint
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === PASSWORD) {
        res.cookie('authenticated', 'true', { 
            httpOnly: true, 
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Falsches Passwort' });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('authenticated');
    res.json({ success: true });
});

app.get('/api/check-auth', (req, res) => {
    res.json({ authenticated: req.cookies.authenticated === 'true' });
});

// Data endpoints
app.get('/api/data', requireAuth, async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        console.error('Error reading data:', err);
        res.status(500).json({ error: 'Fehler beim Laden der Daten' });
    }
});

app.post('/api/data', requireAuth, async (req, res) => {
    try {
        const data = req.body;
        
        // Create backup
        const backupFile = path.join(__dirname, 'data', `backup-${Date.now()}.json`);
        try {
            const currentData = await fs.readFile(DATA_FILE, 'utf8');
            await fs.writeFile(backupFile, currentData);
        } catch (err) {
            console.log('No previous data to backup');
        }
        
        // Save new data
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        
        // Keep only last 10 backups
        const dataDir = path.join(__dirname, 'data');
        const files = await fs.readdir(dataDir);
        const backups = files
            .filter(f => f.startsWith('backup-'))
            .sort()
            .reverse();
        
        for (let i = 10; i < backups.length; i++) {
            await fs.unlink(path.join(dataDir, backups[i]));
        }
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error saving data:', err);
        res.status(500).json({ error: 'Fehler beim Speichern' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
ensureDataDir().then(() => {
    app.listen(PORT, () => {
        console.log(`🃏 DoKo-Server läuft auf Port ${PORT}`);
        console.log(`📱 Öffne: http://localhost:${PORT}`);
        console.log(`🔑 Passwort: ${PASSWORD}`);
    });
});
