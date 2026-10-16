# ZEROGEN LEARNING — CODEX MASTERLOOP (LEAN V1)

**Stand:** 16.10.2026  
**Rolle:** Codex = umsetzender Entwickler und Tester.  
**Priorität:** Diese Datei und `AGENTS.md` ersetzen alle älteren Academy-/Freebuff-/Antigravity-Aufträge und deren M0–M7-Umfang. Frühere Dokumente sind nur historische Referenz, nicht Feature-Auftrag.

## 1. Mission

Baue die **kleinste funktionierende persönliche Lern-PWA** für einen einzigen Nutzer:

**Nächsten Kurs anzeigen → externen Kurs öffnen → Abschluss markieren → optionale echte Kursnote erfassen → nächsten Kurs empfehlen.**

Die Anwendung ist ein *Learning Tracker*, keine Academy, kein LMS und keine Kursanbieter-Plattform. **Nicht neu konzipieren, nicht aufblasen.**

## 2. Genau diese Funktionen

1. **Weiterlernen:** Nächster nicht abgeschlossener Kurs in der festgelegten Reihenfolge; Schaltfläche zum externen Anbieter (`https://`, sicherer neuer Tab); eindeutige Anzeige, wenn alles erledigt ist.
2. **Meine Kurse:** Geordnete Liste. Pro Kurs nur `id`, `title`, `url`, optional `provider`, `order`, `completed`, `score`. Kurse per Titel + URL hinzufügen, ändern, nach oben/unten verschieben und bei Bedarf archivieren. Existierende Kursdaten importieren, nicht unnötig neu schreiben.
3. **Scoring & Fortschritt:** Abschluss markieren/rückgängig machen. Echte externe Note optional als **ganze Zahl 0–100**; ohne Note `null`. Anzeigen: `abgeschlossen / insgesamt`, Prozentfortschritt, Notendurchschnitt nur aus vorhandenen echten Noten. Keine automatisch erzeugten Leistungen und kein 80-%-Bestehensgate.
4. **Persistenz:** Sofort lokal sichern; nach späterer Firebase-Einrichtung denselben Lernstand zwischen Mac, Android und Browser synchronisieren; lokale Daten nie still überschreiben.
5. **PWA:** Nach Freigabe statisch auf GitHub Pages nutzbar und installierbar. Offline sind Oberfläche und bereits gespeicherte Kurse nutzbar; externe Lernanbieter benötigen eventuell Internet.

**Maximal drei simple Bereiche:** `Jetzt lernen`, `Meine Kurse`, `Fortschritt`. Diese dürfen bei weniger Code auch innerhalb **einer** Seite liegen. Keine komplexe Navigation.

## 3. Harte Nicht-Ziele

Nicht bauen: 52-Wochen-Zwang, neue eigene Lektionen, Quiz-/Prüfungs-Engine, PDFs/Zertifikate/Badges, Kursmarktplatz, öffentliches Signup, Rollenverwaltung, Admin-Dashboard, Kurseditor-Suite, eigener KI-Tutor, API-Integration zu ChatGPT/Groq, n8n/Agenten, Scraping, automatische Linkprüfer, Analytics, Streaks, Lernzeittracking, Quiz-Statistiken, grosse UI-Libraries, Event-Sourcing, Microservices, Cloud Functions, Cloud Storage, Firestore, Bezahlsysteme, generische Zukunftsarchitektur.

Frühere Academy-Pläne sind **keine Erlaubnis**, diese Funktionen erneut einzubauen.

## 4. Technik — kleinstmögliche Lösung

- **Vorher inspizieren:** Repository, funktionierende Dateien, Pakete, vorhandene Tests, bisherige Daten. Bestehende funktionierende Teile erhalten. Keine radikale Rewrite-Aktion bei vorhandenem guten Code.
- **Falls leer:** Vite + Vanilla TypeScript + normales CSS. Kein Framework, solange nicht im bestehenden Code sinnvoll bereits vorhanden.
- **Daten:** kleines typisiertes Kursmodell, Seed-Liste aus geprüften vorhandenen Kursen, reine Funktionen für `nextCourse`, `progress`, `averageScore`, `validateScore`. Keine erfundenen URLs/Noten.
- **Lokal:** `localStorage` mit JSON-Schema-Prüfung für den kleinen persönlichen Datenbestand plus Export/Import einer JSON-Sicherung. Bestehende Kursdaten vor Änderungen migrieren/sichern. Fehler sichtbar statt stiller Datenverlust.
- **Cloud:** Firebase Authentication für ein vordefiniertes Eigentümerkonto + **Realtime Database auf Spark**. Daten unter `/users/{uid}/courses`. Keine öffentliche Selbstregistrierung. Rules ausdrücklich auf die freigegebene Owner-UID begrenzen; Regeln mit positivem und negativem Test prüfen. Firebase-Webkonfiguration ist kein Geheimnis, administrative Schlüssel bleiben serverseitig/aus dem Repo.
- **Sync:** Nicht synchronisierte Änderungen als `nur lokal` kennzeichnen. Vor dem Überschreiben einer geänderten Remote-Version Konflikt erkennen und dem Nutzer die Wahl lassen. Kein komplexes Queue-/Event-System, aber Offline-Änderungen dürfen nach einem Browserneustart nicht verschwinden.
- **Hosting:** GitHub Pages, Manifest, kleiner Service Worker nur für App-Shell und lokale Assets. Nie externe Anbieter-Seiten aggressiv zwischenspeichern.
- **Kosten:** **CHF 0 Zusatzkosten.** Keine kostenpflichtigen KI-Calls, kein Firebase Blaze, keine optionalen Credits, keine automatischen Upgrades. Vor kostenverursachenden Aktionen stoppen.

## 5. Gestaltung — kein AI-Slop

- Sauberes, ruhiges ZeroGen-Dark-Design, klare Schrift, gut lesbare Texte, 1 Akzentfarbe, sparsame Glaseffekte.
- Ein sinnvoller Hauptbutton: **Kurs öffnen** bzw. **Weiterlernen**. Keine Marketing-Heroes, Orbs, Neon-Gradients, Fake-KPIs, Stockbilder, Card-Walls, Deko-Animationen.
- Mobile-first, am Mac ebenfalls gut bedienbar, Tastaturzugriff, Fokus-Stile, genügend Kontrast, passende Touch-Ziele.
- Prüfe die Hauptansichten nach Möglichkeit im realen Browser (Desktop/Mobil); falls nicht möglich, transparent als **ungeprüft** markieren.

## 6. Der ausführbare Codex-Loop

**Nicht nur planen, sondern lauffähigen Code liefern.** Ohne erneute Produktfragen diese Schleife anwenden:

```text
BESTAND PRÜFEN
  ↓
SCOPE-CHECK: Ist es für Öffnen → Abschliessen → Scoring nötig?
  ├─ Nein → Nicht bauen / vereinfachen / löschen (nach Sicherung)
  └─ Ja
      ↓
KLEINSTE ÄNDERUNG IMPLEMENTIEREN
      ↓
RELEVANTE TESTS AUSFÜHREN
      ├─ Fehler → gezielt korrigieren, maximal 3 Versuche
      └─ Erfolgreich
          ↓
UI / DATEN / SICHERHEIT GEGEN ABNAHME PRÜFEN
          ↓
CHECKPOINT: geänderte Dateien, echte Testresultate, nächster Schritt
          ↓
NÄCHSTE ETAPPE
```

**Wichtige Stopps:** Fehlende erforderliche Zugangsdaten, Gefahr von produktivem Datenverlust, erforderliche öffentliche Veröffentlichung, kostenpflichtige Dienste oder nach drei gezielten Reparaturversuchen ungelöster Blocker. Keine Secrets erfinden. Bei Blockade sauber dokumentieren, mit lokal testbaren Bereichen weiterarbeiten, wenn ungefährlich.

### Etappe A — Lokal benutzbarer Learning Tracker

- Bestehendes Repo untersuchen; minimal startbare Web-App bauen.
- Die drei Bereiche implementieren: nächster Kurs, URL öffnen, Status, optionale Note, Kursreihenfolge, einfache Statistiken.
- Lokale Speicherung und JSON-Export/Import, inklusive Validierung und Fehlermeldungen.
- Automatische Tests: leere Kursliste; erster offener Kurs; alle abgeschlossen; Abschluss rückgängig; `0` und `100` gültig, negative/101/Dezimalwerte ungültig; Notendurchschnitt mit fehlenden Noten; Fortschritt 0/0 = 0 %; Reload erhält Daten.
- **Gate A:** Erstes reales Lernbeispiel vom externen Kurs zurück in die App; markierter Abschluss führt zum nächsten Kurs; korrektes Scoring nach Neustart. Sonst nicht als fertig markieren.

### Etappe B — Persönliche Cloud-Synchronisierung

- Firebase Auth/Realtime Database *erst jetzt* anschliessen, nur Owner-Account. Keine Selbstregistrierung.
- Security Rules + Tests: Owner lesen/schreiben erlaubt; anonym/fremde UID lesen/schreiben verboten.
- Lokal gespeicherte Daten dürfen durch Cloud-Erststart nicht gelöscht werden. Zeige Sync-Zustand `lokal`, `synchronisiert`, `Konflikt`, `offline`.
- **Gate B:** Zwei Geräte/Browserprofile sehen nach erfolgreicher Synchronisierung denselben Kursstand. Simulierter Konflikt führt zu sichtbarer, bewusster Auflösung. Ohne echte Firebase-Konfiguration: Emulator/Mocks testen und ausdrücklich „Live-Sync nicht verifiziert“ melden.

### Etappe C — Installierbare PWA und Abschluss

- Installations-Manifest, korrekter Service Worker, Favicon/App-Icon und GitHub-Pages-kompatibler Build.
- Kleine Regressionstests und Browser-Smoketests für Desktop/Android-Grösse, Offline-App-Shell und persistierte Kursdaten.
- Abgleich mit No-AI-Slop-Design-Contract, unnötige Abhängigkeiten und toten Code entfernen.
- **Gate C:** `build` und relevante Tests grün, kein Datenverlust, installierbare PWA technisch geprüft, keine unbeabsichtigten Kosten. **Nicht ohne ausdrückliche Zustimmung öffentlich deployen.**

## 7. Definition of Done

Fertig bedeutet erst:

- [ ] `Weiterlernen` wählt den richtigen Kurs.
- [ ] Externer Kurslink funktioniert sicher.
- [ ] Abschlussstatus und echte optionale Note werden korrekt erfasst.
- [ ] Zahlen stimmen inklusive Leer-/Randfällen.
- [ ] Lokaler Fortschritt übersteht Reload/Neustart; JSON-Backup funktioniert.
- [ ] Firebase Rules sind sicher getestet; Cloud-Sync wurde tatsächlich getestet oder klar als offen benannt.
- [ ] PWA funktioniert auf Smartphone und Desktop und zeigt keine erfundenen Daten.
- [ ] Keine Academy-Features, keine unnötigen Packages, keine API-Kosten, kein AI-Slop.

## 8. Berichtsformat / Fortsetzen

Nach jeder Etappe **nur kurz** berichten:

```text
Geändert: ...
Tests: ... (tatsächlich ausgeführt, mit Ergebnis)
Ergebnis: ...
Offen: ...
Nächster Schritt: ...
```

Lege `PROGRESS.md` an (oder aktualisiere bestehende Fortschrittsdatei) und dokumentiere den letzten bestandenen Gate, offenen Blocker und den **einen** nächsten sicheren Schritt. Falls der Prozess unterbrochen wird, beim nächsten Lauf **dort** weiterarbeiten – ohne erneut das Projekt aufzublähen.

## 9. Sofortiger Startbefehl

> Inspiziere den aktuellen Repository-Stand. Lies `AGENTS.md` und diesen `CODEX-MASTERLOOP.md`. Behandle frühere Academy-/Freebuff-Dateien als Archiv. Starte **sofort Etappe A** und liefere einen funktionierenden persönlichen Learning Tracker. Arbeite anschliessend die getesteten Etappen B und C weiter ab, soweit keine explizite Freigabe, Zahlung oder Zugangsdaten erforderlich sind. Stelle keine neuen Konzeptfragen. Keine öffentliche Veröffentlichung ohne Zustimmung. Halte den Scope strikt minimal.
