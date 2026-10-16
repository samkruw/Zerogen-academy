# ZeroGen Learning

Persönlicher Learning Tracker: nächsten externen Kurs öffnen, Abschluss markieren, echte optionale Note erfassen. Eine Seite, drei Bereiche, keine vorgegebenen Kurse oder erfundenen Ergebnisse.

## Lokal starten

Benötigt Node.js 24 und npm:

```sh
npm ci
npm run dev
```

Danach `http://localhost:5173` öffnen. Einen eigenen Kurs mit Titel und HTTPS-Adresse hinzufügen oder eine JSON-Sicherung importieren. Kursseiten öffnen in einem sicheren neuen Tab; zum Erfassen des Abschlusses in den Tracker zurückkehren. Nur tatsächlich erhaltene Noten eingeben. Leeres Notenfeld bedeutet keine Note; `0` ist eine echte Note. Abschluss rückgängig machen entfernt die zugehörige Note. Archivierte Kurse bleiben erhalten und zählen nicht zum aktiven Fortschritt.

`npm run build` erstellt `dist/`; `npm run preview` zeigt den Produktionsbuild lokal. Nur der Produktionsbuild registriert den Service Worker. Die Entwicklungsansicht ist keine Offline-PWA.

## Speicherung und Sicherung

Kleine Kursliste in `localStorage`, schreibend erst nach Schema-Prüfung. Fehler werden sichtbar angezeigt; beschädigte Daten werden nicht ersetzt. Bei Änderungen in einem zweiten Tab neu laden, bevor weiter gespeichert wird.

Unter **Fortschritt → Sicherung & Synchronisierung** JSON exportieren/importieren. Import ersetzt nach ausdrücklicher Bestätigung die Liste und sichert vorher den aktuellen Stand. Der zuletzt verdrängte Stand lässt sich dort herunterladen. Dies ist eine einzelne Rückfallsicherung, kein Versionsarchiv; wichtige Stände regelmässig als Datei exportieren. Browserdaten-Löschung löscht auch lokale Kurse und Rückfallsicherung.

Sicherungsformat (ohne vorgetäuschten Beispielkurs):

```json
{ "version": 1, "courses": [] }
```

Ein Kurs besitzt `id`, `title`, `url` (HTTPS), optional `provider`, `order`, `completed`, `score` (`null` oder ganze Zahl 0–100) und `archived` (bei Import optional, Standard `false`). Import benötigt eindeutige IDs und gültige Daten. Maximal 1000 Kurse, Sicherungsdatei maximal 5 MB. Noten gehören ausschliesslich zu abgeschlossenen Kursen.

## Firebase Spark — optional im eigenen Build

Die öffentliche App enthält auf Wunsch des Eigentümers keine Firebase-Projektkonfiguration und keine konkrete Owner-UID. Sie arbeitet lokal mit JSON-Sicherungen. Firebase-Auth und Sync-Code sind für einen selbst konfigurierten Build enthalten.

Für den eigenen Build `.env.example` als `.env.local` kopieren und die eigene Webkonfiguration sowie freigegebene Owner-UID eintragen. Nur Auth und Realtime Database auf Spark verwenden. Keine administrativen Schlüssel ins Frontend geben. Die eigene `.env.local` wird nicht versioniert. Werte in einem öffentlichen Browser-Build sind öffentlich lesbar; die Standardveröffentlichung verwendet deshalb ausschliesslich die leere Vorlage.

`database.rules.json` ist eine gesperrte Vorlage. Vor Anwendung im eigenen Projekt beide `REPLACE_WITH_OWNER_UID` ersetzen und die Rules prüfen. Es werden keine Firebase-Regeln oder Konten automatisch angelegt oder geändert. Die App bietet nur Anmeldung, keine Selbstregistrierung.

Synchronisierung verwendet ETag/If-Match und eine dauerhafte Basisrevision. Ein Konflikt erfordert eine bewusste Auswahl; der verdrängte Stand wird lokal gesichert. Unübertragene Änderungen bleiben lokal erhalten. Die enthaltenen Emulator-Tests verwenden einen Test-Owner ohne Zugriff auf Produktivdaten.

Die öffentliche Variante hat keine Verbindung zur persönlichen Firebase-Datenbank. Ein authentifizierter Live-Abgleich ist für diese Variante nicht aktiviert oder behauptet.

## PWA und GitHub Pages

Der Build verwendet relative Assetpfade und funktioniert auch unter einem Repository-Unterpfad. `dist/` enthält Manifest, Icons und den kleinen Service Worker. Es werden nur lokale App-Dateien gecacht, weder Firebase-Daten/Token noch externe Kursanbieter. Nach dem ersten Online-Laden sind Oberfläche und gespeicherte Kurse offline verwendbar; Kursanbieter können Internet benötigen. Neue App-Versionen werden nach Schliessen aller alten App-Tabs aktiv.

Installation über die Browserfunktion „App installieren“/„Zum Startbildschirm“. HTTPS oder localhost ist erforderlich. Installationsprüfung erfolgt technisch in Chromium; ein physisches Android-Gerät und Safari/macOS wurden hier nicht getestet.

Der Eigentümer hat am 16.10.2026 den Upload ins Repository und die direkt aufrufbare App freigegeben. Zielrepository: https://github.com/samkruw/Zerogen-academy. Der Workflow `.github/workflows/pages.yml` prüft die Kernlogik, baut die App mit der öffentlichen Konfiguration aus `.env.example` und veröffentlicht `dist/` über GitHub Pages. Er läuft bei Änderungen auf `main` und manuell. GitHub Pages muss für Actions freigegeben sein; der Workflow versucht die erstmalige Aktivierung. Falls GitHub dafür die Berechtigung verweigert, einmalig unter Settings → Pages → Source „GitHub Actions“ auswählen. Erwartete Adresse nach erfolgreichem Deployment: https://samkruw.github.io/Zerogen-academy/. Ein erfolgreicher Upload allein belegt noch kein erfolgreiches Deployment; den aktuellen Status in PROGRESS.md prüfen.

## Tests

```sh
npm test                  # Reine Logik, Persistenz und Sync mit getrennten Speichern
npm run build             # TypeScript + Vite + Offline-Shell
npm run test:browser       # Lokale Oberfläche, Desktop/Mobil, Sicherungen
npm run test:rules         # Offizieller RTDB-Emulator, Owner/Negativfälle
npm run test:sync-browser  # Zwei Browserprofile, Auth-Mock + echter RTDB-Emulator/ETag
npm run test:pwa           # Produktionsbuild unter Unterpfad, Manifest, Offline
```

Für Browser-Tests Chromium installieren und bei Bedarf `CHROMIUM_PATH=/pfad/zu/chromium` setzen (Vorgabe in dieser Umgebung: `/usr/bin/chromium`). Rules-Tests benötigen Java, curl, sha256sum, rg und timeout; das Skript lädt einmalig den offiziellen kostenlosen Emulator v4.11.2 nach `.emulators/` und prüft dessen SHA-256. Nur das Emulator-Testverfahren verwendet Admin-Testzugriffe auf `127.0.0.1`, Namespace `demo-zerogen`. Keine Produktivverbindung. Ports 9000, 4173 und 4174 müssen frei sein. Daten und Token im Test sind künstlich und werden nicht in der Anwendung vorbefüllt.

Verbindlicher Scope: [AGENTS.md](AGENTS.md), [CODEX-MASTERLOOP.md](CODEX-MASTERLOOP.md). Testnachweise, offene Gates und Fortsetzung: [PROGRESS.md](PROGRESS.md).
