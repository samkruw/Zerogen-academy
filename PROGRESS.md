# ZeroGen Learning — Fortschritt

## Bestand · 16.10.2026
Geändert: Vorgabedateien unverändert übernommen, minimalen Arbeitsplan gespeichert.
Tests: Workspace auf Code, Kursdaten, Git-Repository und Konfiguration untersucht; nichts vorhanden. Node 24, npm, Chromium und Java verfügbar.
Ergebnis: Start mit Vite + Vanilla TypeScript + CSS; keine Datenmigration erforderlich.
Offen: Keine vorhandene Kursliste, keine Firebase-Konfiguration/Owner-UID. Kein Live-Sync möglich.
Nächster Schritt: Etappe A implementieren und lokal testen.

## Etappe A · technischer Checkpoint
Geändert: Lokale Ein-Seiten-App mit Kursverwaltung, Reihenfolge, Archiv, Abschluss, optionaler Ganzzahlnote, Fortschritt, JSON-Import/Export. Schema-Prüfung und Schreibschutz bei parallelen Tabs; bestehende Daten bleiben bei Fehlern erhalten.
Tests: 10 Node-Einzeltests bestanden (explizit mit `--experimental-test-isolation=none`; der isolierte Runner meldete hier nur Dateien). Produktionsbuild bestanden. Browser: Lernablauf mit externer Testfixture und Reload sowie mobile Ansicht bestanden. Ein weiterer Test fand abweichende zugängliche Button-Namen; explizite ARIA-Namen ergänzt, Wiederholung läuft.
Ergebnis: Kern-App lokal bedienbar. Mobile Bildschirmaufnahme geprüft, kein horizontaler Überlauf bei 393 px.
Offen: Gate A als persönlicher Echtkurs-Abschluss noch nicht belegt: automatisierte Abschluss-/Notenwerte sind ausschliesslich Testdaten. Kein vorhandener persönlicher Kurs/keine echte Note geliefert. Externer Live-Anbieteraufruf wird zusätzlich geprüft. Kein Live-Firebase eingerichtet.
Nächster Schritt: Browser-Wiederholung auswerten, dann lokal testbare Owner-Synchronisierung und Rules.

## Etappe B · lokaler Checkpoint
Geändert: Firebase-Owner-Anmeldung ohne Registrierung; Realtime-Database-REST mit ETag/If-Match gegen konkurrierende Uploads. Dauerhafte Basisrevision und Dirty-Flag, sichtbare Zustände und bewusste Konfliktauflösung mit Sicherung. Keine Cloud-Konfiguration erfunden oder bereitgestellt.
Tests: 16 Node-Einzeltests bestanden. Offizieller Realtime-Database-Emulator v4.11.2: 3 Integrationsgruppen bestanden — Owner lesen/schreiben erlaubt; anonym/fremde UID verweigert; ungültige Noten, URL, Identität, Zusatzfelder, Revision und Löschung verweigert. Erwartete permission_denied-Meldungen stammen aus Negativtests. Produktionsbuild bestanden. Etappe-A-Browserwiederholung: 3/3 bestanden.
Ergebnis: Sync-Logik und Rules lokal verifiziert. REST statt SDK-Schreibqueue hält Offline-Änderungen ausschliesslich im geprüften lokalen Speicher; keine versteckten späteren Uploads.
Offen: Live-Sync nicht verifiziert (keine Firebase-Webkonfiguration/Owner-UID). Zwei echte Geräte und persönlicher Echtkurs-Abschluss bleiben Abnahmen am Eigentümerkonto. Rules-Datei enthält absichtlich eine zu ersetzende Owner-UID und wurde nur im Emulator mit Test-UID verwendet.
Nächster Schritt: PWA/Offline unter GitHub-Pages-Unterpfad prüfen und zusätzlichen Browser-Sync mit Auth-Mock/echtem Datenbankemulator testen.

## Etappe C · technischer Checkpoint
Geändert: Relatives Manifest, eigene PNG-Icons inkl. maskable, minimaler Service Worker mit versionierter App-Shell. GitHub-Pages-Unterpfad ohne Deployment vorbereitet. Tastaturfokus bleibt beim Abschluss und Notenspeichern erhalten. README mit lokalem Start, Sicherungen, optionaler Spark-Einrichtung und Testbefehlen.
Tests: Produktionsbuild und 16 Node-Einzeltests bestanden. 4/4 UI-Browsertests bestanden. 3/3 Emulator-Rules-Testgruppen und 1/1 Zwei-Profil-Sync mit Auth-Mock + echter RTDB/ETag bestanden. 3/3 PWA-Tests bestanden: 1280/393 px, echte Netzsperre und Offline-Reload, Offline-Änderung und erneuter Reload, Manifest/Service Worker unter /zerogen-learning/, Installierbarkeit ohne CDP-Fehler im normalen Profil, erhaltene Testnote nach vollständigem Browserprozess-Neustart. Desktop-/Mobil-Screenshots tatsächlich angesehen.
Ergebnis: Technische lokale Abnahme der PWA bestanden. Build umfasst ca. 172 KB inklusive Icons und optional geladenem Firebase-Auth-Code. Eine Produktionsabhängigkeit (offizielles Firebase-SDK); Vite, TypeScript, Playwright und Rules-Testbibliothek sind Entwicklungswerkzeuge. Keine bezahlten Dienste, keine Veröffentlichung.
Offen: Live-Firebase und reale Mac-/Android-Geräte nicht geprüft. Kein echter persönlicher Lernabschluss behauptet; alle automatisierten Noten sind Testwerte. Chromium meldete bei Offline-Reload trotz gesperrtem Netzwerk navigator.onLine=true; die Offline-Funktion wurde deshalb mit einem uncached Netzwerkaufruf unabhängig geprüft. Ohne Cloud-Verbindung kann die Statusanzeige dann „nur lokal“ lauten. Installationsprüfung läuft separat im normalen Profil, da Inkognito „in-incognito“ meldet.
Nächster Schritt: Abschlussreview auswerten und finale Nachweise sichern; danach ist für Live-Abnahme die öffentliche Firebase-Webkonfiguration plus freigegebene Owner-UID erforderlich.

## Abschluss · 16.10.2026
Geändert: Quellcode, startbare lokale Anwendung, Produktionsbuild und Bedien-/Einrichtungsanleitung gespeichert. Fehler beim Speichern werden zusätzlich direkt im geöffneten Kursdialog angezeigt. Kein Git-Repository oder Remote war vorhanden; keine Commits/Pull Requests/Deployments angelegt.
Tests: Abschliessender Build und 16/16 Node-Tests erneut erfolgreich. Separates Code-Review von Speicherung/Import, Sync/ETag, Owner-Rules und Service Worker ohne kritische oder wichtige Befunde. Die oben dokumentierten Browser-/Emulatorprüfungen gelten mit den genannten Mock-/Gerätegrenzen; finale UI-/PWA-Wiederholung wird zum Paketabschluss ausgewertet.
Ergebnis: Alle lokal sicher ausführbaren Arbeiten aus A–C implementiert und geprüft. Gate A funktional technisch geprüft, persönliches echtes Lernbeispiel offen. Gate B nur lokal/emuliert geprüft, Live-Sync nicht verifiziert. Gate C technisch in Chromium/Desktop und Mobilgrösse geprüft; keine physische Android-/Mac-Abnahme behauptet. Kein automatisiertes Testkonto und keine Testnoten in den App-Startdaten.
Offen / tatsächlicher Live-Blocker: Öffentliche Firebase-Webkonfiguration, freigegebene Owner-UID und bewusst angewendete Owner-Rules fehlen. Persönlicher Echtkurs-Abschluss und physische Geräteprüfung bleiben Nutzungsabnahmen. Veröffentlichung benötigt weiterhin ausdrückliche Freigabe.
Ein nächster sicherer Schritt: Firebase-Spark-Webkonfiguration und Owner-UID gemäss README eintragen, Rules mit derselben UID prüfen; danach Gate B am eigenen Konto über zwei Browserprofile durchführen. Dafür keine administrativen Schlüssel ins Repo oder in den Browser geben.

Finale Wiederholung abgeschlossen: 4/4 lokale UI-Tests und 3/3 PWA-/Offline-/Browserneustarttests bestanden. Keine offenen automatisierten Testfehler. Quellpaket inklusive dist/, Tests, Lockfile, Vorgaben und Dokumentation erstellt; node_modules, Emulator-Binärdatei, Logs und private Umgebungsdateien ausgeschlossen. Letzter technischer Gate: C; persönliche/Live-Abnahmen bleiben wie oben offen.

## Fortsetzung · 16.10.2026
Geändert: Bestehenden Checkpoint wieder aufgenommen und Live-Voraussetzungen erneut geprüft; kein zusätzlicher Funktionsumfang.
Tests / Prüfung: Alle fünf erforderlichen VITE-Konfigurationswerte fehlen in der Laufzeit; keine .env/.env.local/.env.production/.env.production.local vorhanden. Umgebungsstatus meldet keine bereitgestellten Variablen, Zugangsdaten oder Identitäten. Owner-Rules enthalten weiterhin den absichtlichen Platzhalter. Keine Codeänderung, daher keine identischen Regressionstests wiederholt.
Ergebnis: Lokaler Stand bleibt erhalten. Live-Abnahme ist weiterhin tatsächlich blockiert; keine Cloud-Aktion und kein Deployment ausgeführt.
Offen: Firebase-Webkonfiguration (apiKey, authDomain, databaseURL, projectId) und freigegebene Owner-UID. Keine Passwörter oder administrativen Schlüssel erforderlich, um die Konfiguration vorzubereiten.
Ein nächster sicherer Schritt: Diese öffentlichen Konfigurationswerte vom Eigentümer erhalten und lokal eintragen; Owner-Rules mit identischer UID vorbereiten und vor Live-Zugriff prüfen.

## Firebase-Konfiguration und konkrete Owner-Rules · 16.10.2026
Geändert: Gelieferte öffentliche Webkonfiguration für FIREBASE_VALUE_HERE und Owner-UID in .env.local eingetragen; .env.example enthält dieselben öffentlichen Werte für das Quellpaket. Beide Owner-Bedingungen in database.rules.json konkret gesetzt. Tests verwenden die tatsächlich konfigurierte UID im lokalen Demo-Emulator; keine unbekannten UID-Platzhalter mehr. Keine Storage-/Messaging-Funktion hinzugefügt.
Tests: Produktionsbuild und 16/16 Node-Tests bestanden. Konkrete Owner-Rules: 3/3 Emulator-Testgruppen bestanden (Owner erlaubt, anonym/fremd und ungültige Daten verweigert). Zwei-Profil-Sync mit Auth-Mock + echtem RTDB-Emulator: 1/1 bestanden. Lokale UI: 4/4; produktive PWA mit Konfiguration, Offline und Neustart: 3/3 bestanden. Live ausschliesslich lesend auf den exakten Owner-Kurspfad geprüft: anonymer GET wurde mit HTTP 401 verweigert; kein Response-Inhalt ausgegeben und keine Daten geschrieben.
Ergebnis: Öffentliche Konfiguration und lokale Rules vollständig vorbereitet. UID in Konfiguration und beiden Rules identisch; JSON und globale Deny-Vorgaben geprüft. Nutzerangabe: bisher keine eigenen Datenbankregeln vorhanden. Deshalb ist kein Zusammenführen mit bereitgestellten eigenen Regeln erforderlich. Tatsächliche Live-Regeln sind mangels Admin-Zugriff weiterhin nicht ausgelesen/angewendet.
Offen / tatsächlicher Blocker: Administrativer Firebase-Konsolenzugriff zum Anwenden der Rules fehlt. Webkonfiguration + UID sind keine Management-Berechtigung. Keine produktiven Konten oder Daten verändert, keine Website veröffentlicht, kein Tarifupgrade. Authentifizierter Live-Sync und Spark-Tarif bleiben ungeprüft.
Ein nächster sicherer Schritt: Eigentümer fügt database.rules.json unter Firebase-Konsole → Realtime Database → Regeln ein und wendet sie an. Danach mit dem eigenen Konto in der lokalen App anmelden und Gate B mit zwei Browserprofilen abnehmen. Keine Passwörter oder Admin-Schlüssel im Chat erforderlich.

## Veröffentlichte Rules bestätigt · 16.10.2026
Geändert: Nutzer bestätigt Veröffentlichung der Firebase-Rules; README und Checkpoint entsprechend aktualisiert. Keine Website-Veröffentlichung aus dieser Aussage abgeleitet. Kein Anwendungscode geändert.
Tests / Prüfung: Erneuter echter anonymer GET ausschliesslich auf /users/OWNER_UID_HERE/courses: HTTP 401. Keine Antwortdaten ausgegeben, keine Daten geschrieben. Konfiguration vollständig und Owner-UID lokal in beiden Rules identisch. Produktionsbuild lokal gestartet und in Chromium geprüft: Anmeldeformular sichtbar, 0 JavaScript-Fehler, 0 Kurs-Datenbankaufrufe vor Anmeldung. Temporärer Prüfserver nur an 127.0.0.1.
Ergebnis: Lokale Anmeldung ist vorbereitet; anonymer Live-Zugriff bleibt verweigert. Die genaue veröffentlichte Rule-Version ist ohne administrative Berechtigung nicht ausgelesen; Veröffentlichung beruht auf der Eigentümerbestätigung.
Offen / tatsächlicher Blocker: Keine authentifizierte Owner-Sitzung für Live-Abnahme verfügbar. Kein Passwort und kein ID-Token angefordert oder im Chat verarbeitet. Authentifizierter Live-Sync und der Abgleich zweier Geräte/Browserprofile bleiben unbestätigt.
Ein nächster sicherer Schritt: Eigentümer startet das aktuelle Projektpaket auf seinem Mac (README: .env.example nach .env.local kopieren, npm ci, npm run dev), öffnet localhost:5173 und meldet sich unter Fortschritt → Sicherung & Synchronisierung am Eigentümerkonto an. Danach den angezeigten Sync-Zustand prüfen und denselben Stand im zweiten Browserprofil synchronisieren. Zugangsdaten nur im lokalen Anmeldeformular eingeben.

## Repository-Upload und Veröffentlichung freigegeben · 16.10.2026
Auftrag: „lade nun alles ins repo so das die app geöfnet werden kann“. Dies ist die ausdrückliche Freigabe für Repository-Upload und eine über GitHub Pages erreichbare App; frühere fehlende Veröffentlichungsfreigabe ist damit erledigt.
Bestand: samkruw/Zerogen-academy gefunden, öffentlich, Admin-/Schreibberechtigung über verbundenen GitHub-Zugang. GitHub bestätigt leeres Repository, kein Altcode zu überschreiben. Kein separater funktionierender gh-CLI-Zugang; verbundene GitHub-Tools werden verwendet.
Geändert: GitHub-Pages-Workflow vorbereitet (Node 24, npm ci, Kernlogiktests, Build, offizieller Pages-Upload/Deploy). Öffentliche Firebase-Konfiguration aus .env.example, keine administrativen Schlüssel. .env.local, node_modules, Emulator, Logs und Browserdaten bleiben ausgeschlossen. Regeln und Daten in Firebase werden durch diesen Workflow nicht verändert.
Nächster Schritt: Build prüfen, kompletten Quellstand inklusive Icons atomar hochladen und Pages-Deployment auswerten. Der erwartete URL ist bis zum erfolgreichen HTTP-/Browsertest noch nicht als erreichbar bestätigt.


## Öffentliche Variante ohne Firebase-Werte · 16.10.2026
Nutzer hat die zwischenzeitliche öffentliche Freigabe der Webkonfiguration und Owner-UID zurückgenommen. Diese aktuelle Anweisung hat Vorrang. Alle konkreten Firebase-Werte und die UID wurden vor dem Upload aus dieser öffentlichen Variante entfernt. .env.example ist leer; database.rules.json enthält den gesperrten Platzhalter. Die unveränderte private Konfiguration bleibt ausschliesslich im lokalen Entwicklungsstand, nicht im öffentlichen Repository. Das veröffentlichte Frontend arbeitet als lokaler Learning Tracker mit JSON-Backup.
Nächster Schritt: öffentlichen Build und Datenschutzprüfung ausführen, vollständigen Quellstand veröffentlichen und Pages-Deployment prüfen.
