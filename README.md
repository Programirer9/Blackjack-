# Blackjack — GitHub Pages Demo

Dieses Repository enthält eine einfache, statische Blackjack-Implementierung (HTML/CSS/JS), die du direkt mit GitHub Pages hosten kannst.

## Lokales Testen
1. Dateien sind statisch — starte einen lokalen Webserver, z.B.:
   - Python 3:
     ```bash
     python -m http.server 8000
     ```
     und öffne `http://localhost:8000` in deinem Browser.

## Auf GitHub hosten (GitHub Pages)
1. Neues Repository auf GitHub erstellen (z. B. `blackjack-gh-pages`).
2. Lokales Repo mit Git verbinden und pushen:
   ```bash
   git remote add origin https://github.com/<DEIN_USER>/<REPO>.git
   git branch -M main
   git add .
   git commit -m "Initial commit — Blackjack"
   git push -u origin main
