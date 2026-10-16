# Umsetzung nach Masterloop

Verbindlich: ../AGENTS.md und ../CODEX-MASTERLOOP.md. Die explizite Anweisung zur selbstständigen Umsetzung ersetzt weitere Konzept-/Planfreigaben. Keine Veröffentlichung.

Bestand: Workspace ohne Repository, Anwendung, Kursdaten oder Firebase-Konfiguration. Keine bestehenden Daten zu migrieren. Keine erfundene Seed-Liste.

1. A: `src/model.ts` enthält typisierte Kurse, Schema-Prüfung, Reihenfolge, Fortschritt und Noten. `src/storage.ts` speichert atomar und prüft parallele Tab-Änderungen. `src/main.ts` und CSS bilden die drei Bereiche. Zuerst Node-Tests für Randfälle und Speicherung, dann Browser-Tests für Öffnen, Abschluss, Noten, Reload, Backup, Bearbeiten und Archivieren. Leere Liste als ehrlicher Start.
2. B: Kleiner Sync-Controller mit dauerhafter Basisrevision; Firebase-Adapter mit Owner-Anmeldung und Compare-and-set-Transaktion unter `/users/{uid}/courses`. Konflikt nur nach bewusster Wahl auflösen, verdrängten Stand lokal sichern. Rules mit offiziellen RTDB-Emulator-Tests prüfen. Keine Live-Zugangsdaten vorhanden: Live-Sync bleibt offen; zwei lokale Browserprofile/Mocks prüfen den Ablauf.
3. C: Relatives Manifest, PNG-Icons, kleiner Service Worker ausschließlich für gleichursprüngliche App-Assets. Produktionsbuild unter Unterpfad sowie Desktop/Mobil, Offline und Datenbestand testen. Keine Hosting-Automation.

Nach jeder Etappe: reale Ergebnisse und verbleibendes Gate in PROGRESS.md. Risiken: fehlerhafte Backups/Storage, parallele Änderungen, Cloud-Erstkontakt, Konflikt während Upload, veraltete Shell. Diese Fälle erhalten gezielte Tests. Keine Zusatzfeatures.
