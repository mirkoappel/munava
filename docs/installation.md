# Installation, Entwicklung und Betrieb

Die [README](../README.md#hosting-mit-chatgpt-sites) erklärt das Zusammenspiel von GitHub, dem Git-Repository einer Site und ihren Versionen. Hier stehen die Schritte und Munava-spezifischen Voraussetzungen für die lokale Arbeit und den Test auf der Quest. Der Colyseus-Echtzeitserver ist ein separates Betriebsprojekt.

## Arbeitskopie einrichten

Benötigt werden Node.js ab Version 22.13.0 und npm. 
Arbeite außerhalb cloud-synchronisierter Projektordner wie Google Drive oder Dropbox, um sync Probleme, die durch den Build-Prozess ausgelöst werden können, zu vermeiden.

### Neue Site einrichten

Klone das öffentliche Munava-Repository als Ausgangspunkt:
```
git clone https://github.com/mirkoappel/munava.git
cd munava
```
Lege die Site mit dem Sites-Plugin ohne Starter-Beispielcode an. Sites vergibt dabei eine Projektkennung für `.openai/hosting.json`. Übertrage den Munava-Quellcode in das Git-Repository der neuen Site. Danach ist dessen lokale Arbeitskopie der Ausgangspunkt für weitere Änderungen.

### Bestehende Site weiterentwickeln

Verwende ihre vorhandene lokale Arbeitskopie oder klone ihr Git-Repository mit berechtigtem Sites-Zugang. Prüfe vor Änderungen, ob die Arbeitskopie zur beabsichtigten Site gehört und ob lokale Änderungen oder neuere Commits vorliegen. Ein GitHub-Klon ersetzt diese Arbeitskopie nicht.

## Pakete installieren und lokal starten

In der Arbeitskopie installierst du die Pakete und startest die lokale Entwicklung:
```sh
npm ci
npm run dev
```
Der Entwicklungsserver simuliert die Sites-Anmeldung auf `localhost`. Für einen vollständigen Mehrspieler-Test brauchst du zusätzlich den separat betriebenen Colyseus-Server und passende Signaturschlüssel. Die Deckeins-WebSocket-Adresse und Ticket-Parameter sind derzeit im Quellcode hinterlegt; eine unabhängige Installation muss sie eigens anpassen.

## Lokal bauen und prüfen

Prüfe Änderungen und erzeuge den Build mit:
```sh
npm test
npm run build
npm audit --omit=dev
```
Die gebaute Browser-App kannst du mit `npm run start` ansehen; der Ticket-Endpunkt läuft dabei nicht mit. Dafür nutze `npm run dev`.
Der Build erzeugt `dist/client/` für die Web-App und `dist/server/` für den Ticket-Endpunkt. Er benötigt lokal noch keine Site-Zuordnung. Installierte Pakete und Build-Ausgaben gehören nicht in die Git-Repositories.

## Für ChatGPT Sites bereitstellen

Prüfe vor der Übertragung die lokale `.openai/hosting.json` gegen die beabsichtigte Site. Bei einer neuen Site übernimmt sie die von Sites vergebene Kennung; bei einer bestehenden Site bleibt deren vorhandene Zuordnung erhalten. Die Datei gehört in den Quellcommit der Site, aber NICHT ins öffentliche GitHub-Repository. Da die aus GitHub übernommene `.gitignore` sie ausblendet, erfasse sie nur im Checkout des Site-Repositories ausdrücklich mit `git add -f .openai/hosting.json` und prüfe den Commit vor dem Push.

Das Sites-Plugin bereitet aus `dist/` ein `.tar.gz`-Paket vor, einschließlich einer Kopie der Hosting-Konfiguration unter `dist/.openai/hosting.json`. Das Paket enthält nicht den übrigen Quellcode: Der dazu passende Quellcommit wird getrennt in das Git-Repository der Site übertragen. Folge für Paketierung, Versionsanlage und Veröffentlichung dem aktuellen Ablauf des Sites-Plugins und der [Sites-Dokumentation](https://learn.chatgpt.com/docs/sites). Eine angelegte Version ist noch nicht live; erst eine gesonderte Veröffentlichung macht sie erreichbar.

Der Ticket-Endpunkt benötigt das Sites-Secret `HOLODECK_TICKET_PRIVATE_JWK`. Für lokale End-to-End-Tests kann der Wert in einer ignorierten `.env.local` liegen. Setze keinen `VITE_`-Präfix davor: So benannte Werte können im Browser-Build landen. Secret-Werte gehören weder in Git noch in die Hosting-Konfiguration.

**Einmaliger Wechsel vom bisherigen Dev-Klon:** Liegt ein neuer, geprüfter Stand nur im GitHub-basierten Dev-Klon, übernimm seine Quelldateien einmalig in eine Arbeitskopie des bestehenden Site-Repositories und sichere sie dort als Commit. Dessen Git-Historie und Hosting-Zuordnung bleiben erhalten. Für spätere Testschleifen arbeitest du direkt in dieser Arbeitskopie; ein GitHub-Backup erfolgt nur für ausgewählte, freigegebene Meilensteine.

## Den Prototyp auf der Quest ausprobieren

Im Versuchsaufbau laufen Munava im Browser einer Meta Quest und ChatGPT mit Codex auf dem Laptop gleichzeitig. Der Sprachmodus dient dem Gespräch über Änderungen; optional zeigt Quest Remote Desktop den Laptopbildschirm in der Brille. Auf der Quest lässt sich nur eine veröffentlichte Sites-Version testen.

1. Öffne die Munava-Site im Quest-Browser und wähle ein Holodeck-Programm.
2. Beschreibe im Sprachmodus mit Codex auf dem Laptop die gewünschte Änderung.
3. Prüfe den geänderten Quellstand und den lokalen Build. Lege daraus eine neue Sites-Version an und prüfe sie.
4. Veröffentliche diese Version, wenn die Änderung live gehen soll. Prüfe auf der Quest, ob die neue Programmfassung ohne Ende der WebXR-Sitzung übernommen wird.

Prüfe bei Änderungen an Anmeldung oder Mehrspieler-Funktionen außerdem den sichtbaren Verbindungsstatus und ein gemeinsames Objekt auf Desktop und Quest.

## Weiterführende Dokumentation

- [Projektübersicht](../README.md)
- [Architektur des Holodecks](architektur.md)
