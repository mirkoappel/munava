# Installation, Entwicklung und Betrieb

Diese Anleitung bündelt die Installation im lokalen Checkout, den Abgleich der Arbeitsstände, die Verbindung zu ChatGPT Sites und die wichtigsten Qualitätsprüfungen. Der Quellcode liegt im [öffentlichen GitHub-Repository](https://github.com/mirkoappel/munava). Der Colyseus-Echtzeitserver ist ein separates Betriebsprojekt und gehört nicht zu diesem Repository.

## Voraussetzungen und Grenzen

Benötigt werden Node.js ab Version 22.13.0, npm und ein Arbeitsordner außerhalb cloud-synchronisierter Projektverzeichnisse. Der lokale Web-Build benötigt noch keine Sites-Zuordnung. Für die Arbeit an einer bestehenden Site ist ein berechtigter ChatGPT-Sites-Zugang nötig. Der vollständige Echtzeitbetrieb benötigt zusätzlich den separat betriebenen Colyseus-Server und passende Signaturschlüssel. Im Quellcode sind derzeit die Deckeins-WebSocket-Adresse und Ticket-Parameter hinterlegt; eine unabhängige Installation muss diese Werte und den Serverbetrieb eigens einrichten.

## Repository klonen und lokal starten

Beim ersten Einstieg:

```sh
git clone https://github.com/mirkoappel/munava.git
cd munava
npm ci
npm run dev
```

In einem vorhandenen Checkout prüfst du vor dem Aktualisieren mit `git status` lokale Änderungen und neue Dateien. Kläre sie, bevor du den GitHub-Stand holst; ein `git pull --ff-only` eignet sich, wenn der Arbeitsbaum dafür bereit ist. `npm ci` installiert die im Lockfile festgelegten Pakete nur im lokalen Checkout. `node_modules/`, Build-Ergebnisse und lokale Laufzeitdaten gehören nicht nach GitHub oder in cloud-synchronisierte Projektordner.

Der lokale Entwicklungsserver zeigt die Web-App im Browser. Ohne Sites-Anmeldung, Ticket-Secret und erreichbaren Colyseus-Server ist die vollständige Anmeldung und Mehrspieler-Synchronisation damit noch nicht nachgewiesen; eine entsprechende Verbindungsanzeige ist dann erwartbar.

## Build und lokale Prüfung

Die produktionsnahe Ausgabe entsteht mit:

```sh
npm run build
npm run start
```

Vor der Übernahme von Codeänderungen werden mindestens `npm run build` und `npm audit --omit=dev` ausgeführt. Ein Audit-Befund ist zu prüfen, nicht stillschweigend durch eine ungeprüfte Paketaktualisierung zu beheben. Änderungen am Anmelde- oder Echtzeitfluss benötigen zusätzlich einen Test mit gültigem Ticket sowie die Prüfung, dass manipulierte, abgelaufene oder falsch gebundene Tickets abgelehnt werden.

## ChatGPT Sites mit dem lokalen Checkout verbinden

Der lokale Start und Build funktionieren ohne Sites-Zuordnung. Erst wenn du den heutigen Munava-Prototyp mit seiner bestehenden Site abgleichen, dort eine Version speichern oder eine eigene Site einrichten willst, brauchst du einen berechtigten Sites-Zugang. Eine Site ist ein eigenständiges gehostetes Projekt und nicht dasselbe wie ein ChatGPT-Projekt oder das GitHub-Repository. Die [Sites-Dokumentation von OpenAI](https://learn.chatgpt.com/docs/sites) beschreibt die Projektzuordnung und die getrennten Schritte Speichern und Veröffentlichen.

### Bestehende Munava-Site in einem neuen Klon zuordnen

1. **Site finden:** Öffne ChatGPT Sites mit dem berechtigten Konto und dem richtigen Workspace. Suche die bestehende Site in der Sites-Übersicht. Wenn Sites-Werkzeuge verfügbar sind, können sie die zugänglichen Projekte auflisten und das ausgewählte Projekt im Detail anzeigen.
2. **Identität prüfen:** Vergleiche Eigentümer, Titel, Site-Adresse sowie gespeicherten und veröffentlichten Stand mit dem beabsichtigten Projekt. Ermittle die tatsächliche Projektkennung aus dem berechtigten Sites-Zugang; leite sie nicht aus Titel oder Adresse ab. Ist sie nicht eindeutig zugänglich, stoppe die Sites-Einrichtung und frage die berechtigte Person, statt eine zweite Site zu erstellen.
3. **Lokal zuordnen:** Lege im lokalen Klon `.openai/hosting.json` an und übernimm die Kennung unverändert als `project_id`. Übernimm optionale Speicher-Bindungen nur, wenn sie für diese Site tatsächlich eingerichtet sind. Das öffentliche Repository enthält keinen `.openai/`-Ordner; die Zuordnung bleibt in jedem Klon lokal.
4. **Zuordnung verifizieren:** Lies das Projekt über die eben eingetragene Kennung erneut mit dem berechtigten Sites-Zugang und prüfe, dass es noch immer die beabsichtigte Site ist. Vergewissere dich außerdem mit `git check-ignore .openai/hosting.json`, dass Git die lokale Datei ignoriert. Erst danach darfst du einen Sites-Schreibvorgang vorbereiten.

### Eine eigene Site für eine unabhängige Installation anlegen

Prüfe zuerst, ob für diese Installation bereits ein passendes Sites-Projekt existiert. Nur wenn eine neue Site ausdrücklich beauftragt ist, starte in ChatGPT Sites aus dem lokalen Projekt eine neue Site. Übernimm die dabei erzeugte Projektkennung unverändert in die lokale Zuordnung und prüfe sie anschließend wie oben. Erstelle das Projekt nicht mehrfach und setze keine erfundene Kennung als Platzhalter in eine aktive Konfigurationsdatei. Eine neue Site ist nicht automatisch veröffentlicht; speichere eine erste Version zunächst ohne Deployment.

Die lokale `hosting.json` enthält die Projektzuordnung, keine Zugangsdaten oder Secrets. Der Ticket-Endpunkt erwartet den privaten Signaturschlüssel als Sites-Secret `HOLODECK_TICKET_PRIVATE_JWK`; für einen lokalen End-to-End-Test darf der Wert ausschließlich in einer ignorierten `.dev.vars` liegen. Secrets gehören weder ins Repository noch in Prompts oder angehängte Dateien.

## Arbeitsstände abgleichen und Sites-Version prüfen

Vor neuer Arbeit an der bestehenden Site vergleiche den tatsächlichen lokalen Dateistand und `git status` mit GitHub sowie der neuesten gespeicherten und der veröffentlichten Sites-Version. Eine Änderung aus einem anderen Rechner oder einer Cloud-Umgebung kann nur in Sites vorliegen. Ein GitHub-Pull holt sie nicht automatisch. Prüfe den Quellcommit und den Inhalt der betreffenden Sites-Version, kläre beabsichtigte Unterschiede und führe dauerhafte Änderungen gezielt in den Checkout zurück. Solange die Richtung unklar ist, weder Sites noch den lokalen Stand überschreiben.

Für einen Sites-Test muss der exakte, committete Quellstand über den Sites-Workflow übertragen werden; die gespeicherte Version wird diesem Commit zugeordnet. Ein GitHub-Push ersetzt diesen Sites-Schritt nicht. Umgekehrt muss nicht jede Testschleife sofort nach GitHub gepusht werden. Dauerhafte Änderungen gehören nach der Prüfung in den maßgeblichen GitHub-Stand.

Speichere zuerst eine Sites-Version und prüfe sie. Erst ein gesondertes Deployment veröffentlicht eine gespeicherte Version. Jede Deployment-URL ist ein Produktionsstand, auch wenn sie nur zum Testen auf der Quest genutzt wird. Vor einem Deployment prüfe die Site-Zuordnung, den Quellcommit, die gespeicherte Version, die Zielgruppe und den bisherigen Live-Stand. Nach einer Veröffentlichung umfasst der Betriebscheck die Anmeldung, den sichtbaren Echtzeitstatus und einen gemeinsamen Objekttest auf Desktop und Quest.

## Den Prototyp auf der Quest ausprobieren

Im heutigen Versuchsaufbau laufen die Munava-Web-App im Browser einer Meta Quest und ChatGPT mit Codex auf einem Laptop gleichzeitig. Der Sprachmodus dient dem Gespräch über Änderungen; optional zeigt Quest Remote Desktop den Laptopbildschirm in der Brille. Für einen Test auf der Quest muss die zuvor geprüfte Sites-Version bewusst veröffentlicht sein, denn die auf der Brille erreichbare Deployment-URL ist live.

1. Öffne die bereitgestellte Munava-Web-App im Browser der Quest und wähle ein Holodeck-Programm.
2. Starte den Sprachmodus mit Codex auf dem Laptop und beschreibe die gewünschte Änderung.
3. Prüfe den geänderten Quellstand und den lokalen Build. Speichere eine Sites-Version aus genau diesem Stand und prüfe sie vor dem Deployment.
4. Veröffentliche die geprüfte Version nur, wenn die Änderung live gehen soll. Prüfe anschließend auf der Quest, ob die geöffnete Anwendung die neue Programmfassung übernimmt, ohne die WebXR-Sitzung zu beenden.

Der Kreislauf wird schrittweise automatisiert. Bereits heute können neue Programmfassungen ohne vollständiges Neuladen der Seite übernommen werden; das ist kein Ersatz für die vorherige Prüfung der Änderung.

## Sicherheitsgrenzen

- Secrets bleiben vollständig in den serverseitigen Umgebungen.
- Kurzlebige und inhaltlich begrenzte Tickets ersetzen ein gemeinsames Dauertoken.
- Die private Signatur erfolgt im Worker, die Prüfung mit dem öffentlichen Schlüssel auf dem Echtzeitserver.
- Die Browserherkunft für die öffentliche WebSocket-Verbindung wird ausdrücklich freigegeben.
- Skripte und Werkzeuge werden nur nach ausdrücklicher Freigabe ausgeführt.

## Weiterführende Dokumentation

- [Projektübersicht](../README.md)
- [Architektur des Holodecks](architektur.md)
