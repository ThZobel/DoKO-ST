# 🃏 DoKu-Vereinsverwaltung

> **Hinweis:** Dieses Projekt wurde mit KI-Unterstützung (Claude) entwickelt.

Einfache Web-App zur Verwaltung und Abrechnung von Doppelkopf-Abenden für kleine Vereine und Spielgruppen.

## ✨ Features

- 🔐 **Einfaches Login** - Ein gemeinsames Passwort für alle Mitglieder
- 👥 **Mitgliederverwaltung** - Spieler hinzufügen und verwalten
- 🎮 **Spielabende tracken** - Spiele mit Normal- und Solo-Modus erfassen
- 💰 **Automatische Abrechnung** - Berechnung inkl. Strafen, Gastgeber-Bonus und festem Beitrag
- 📊 **Finanzübersicht** - Alle Abrechnungen und Statistiken auf einen Blick
- 📱 **Mobile-optimiert** - Responsive Design für Smartphone-Nutzung
- 🔄 **Offline-fähig** - Funktioniert auch ohne Internetverbindung (PWA)

## 🚀 Schnellstart

### Lokal starten

```bash
# Repository klonen
git clone https://github.com/DEIN-USERNAME/doko-app.git
cd doko-app

# Abhängigkeiten installieren
npm install

# Passwort setzen
# .env erstellen und APP_PASSWORD=deinpasswort eintragen

# Server starten
npm start
```

Die App läuft auf: **http://localhost:3000**

### Windows
Einfach `START.bat` doppelklicken!

## 🌐 Deployment

### Glitch.com (Kostenlos & Einfach)
1. [glitch.com](https://glitch.com) → \"New Project\" → \"Import from GitHub\"
2. Repo auswählen
3. In `.env`: `APP_PASSWORD=xyz` setzen
4. Fertig! 🎉

### Fly.io (Kostenlos & Performant)
```bash
fly launch
fly secrets set APP_PASSWORD=xyz
fly deploy
```

Mehr Details: [`KOSTENLOS-HOSTING.md`](KOSTENLOS-HOSTING.md)

## 📖 Dokumentation

- [`SCHNELLSTART.md`](SCHNELLSTART.md) - Deutsche 3-Minuten-Anleitung
- [`KOSTENLOS-HOSTING.md`](KOSTENLOS-HOSTING.md) - Kostenlose Hosting-Optionen
- [`DEPLOYMENT.md`](DEPLOYMENT.md) - Detaillierte Deployment-Anleitungen
- [`PROJEKT-ÜBERSICHT.md`](PROJEKT-ÜBERSICHT.md) - Projektstruktur erklärt

## 🛠️ Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla JavaScript (kein Framework)
- **Speicherung:** JSON-Files + localStorage (Offline-Support)
- **Auth:** Cookie-basiert, einfaches Passwort

## 📁 Projektstruktur

```
DoKo_App/
├── server.js              # Backend-Server
├── package.json           # Dependencies
├── .env                   # Konfiguration (Passwort)
└── public/
    ├── index.html         # Frontend
    ├── app.js             # Logik
    └── manifest.json      # PWA-Config
```

## 🎮 Verwendung

1. **Login** mit gesetztem Passwort
2. **Mitglieder** hinzufügen
3. **Neuer Abend** starten (4-5 Teilnehmer)
4. **Spiele** erfassen (Normal 2v2 oder Solo 1v3)
5. **Abend beenden** → Automatische Abrechnung

## ⚙️ Konfiguration

In der App unter \"Einstellungen\":
- Fixer Beitrag pro Abend (Standard: 10€)
- Strafe pro Punkt (Standard: 0,50€)
- Gastgeber-Beitrag (Standard: 20€)

## 🤝 Beitragen

Dieses Projekt wurde zu Demonstrationszwecken erstellt. Issues und Pull Requests sind willkommen!

## 📄 Lizenz

MIT - Frei verwendbar für private und kommerzielle Zwecke.

## 💬 Support

Bei Fragen oder Problemen, bitte ein Issue erstellen.

---

**⚡ Made with AI** - Dieses Projekt wurde mit Unterstützung von Claude (Anthropic) entwickelt.
`
}
