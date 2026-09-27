# Entwicklung und Betrieb

> [!WARNING]
> **Status: Entwurf – noch nicht geprüft**
>
> Diese Datei ist vorläufig und kann gegenüber dem aktuellen Projektstand veraltet sein. Aussagen und Anleitungen müssen vor ihrer Verwendung im Einzelfall auf Aktualität und Stichhaltigkeit geprüft und bei Bedarf angepasst werden. Maßgeblich sind derzeit der aktuelle Code und die abgestimmte Haupt-README. Die Dokumentation wird fortlaufend nachgezogen.

Diese Anleitung bündelt die technischen Voraussetzungen, die lokale Ausführung, sicherheitsrelevante Konfiguration und die wichtigsten Qualitätsprüfungen des Holodeck-Prototyps.

## Lokal starten

Voraussetzung ist Node.js ab Version 22.13.0. In einem normalen lokalen Checkout genügen:

```sh
npm ci
npm run dev
```

Die produktionsnahe Ausgabe entsteht mit:

```sh
npm run build
npm run start
```

## Konfiguration und Sicherheit

Der Ticket-Endpunkt erwartet den privaten Signaturschlüssel als Sites-Secret `HOLODECK_TICKET_PRIVATE_JWK`. Für einen lokalen End-to-End-Test darf dieser Wert ausschließlich in einer ignorierten `.dev.vars` bereitgestellt werden.

Sicherheitsgrenzen des Projekts:

- Secrets bleiben vollständig in den serverseitigen Umgebungen;
- kurzlebige und inhaltlich begrenzte Tickets ersetzen ein gemeinsames Dauertoken;
- die private Signatur erfolgt im Worker, die Prüfung mit dem öffentlichen Schlüssel auf dem Echtzeitserver;
- die Browserherkunft für die öffentliche WebSocket-Verbindung wird ausdrücklich freigegeben;
- Skripte und Werkzeuge werden nur nach ausdrücklicher Freigabe ausgeführt.

## Qualitätsprüfung

Vor einer Übernahme werden mindestens diese Prüfungen ausgeführt:

```sh
npm run build
npm audit --omit=dev
```

Änderungen am Anmelde- oder Echtzeitfluss benötigen zusätzlich einen Test mit gültigem Ticket sowie die Prüfung, dass manipulierte, abgelaufene oder falsch gebundene Tickets abgelehnt werden. Nach einer Veröffentlichung umfasst der Betriebscheck die Anmeldung, den sichtbaren Echtzeitstatus und einen gemeinsamen Objekttest auf Desktop und Quest.

## Weiterführende Dokumentation

- [Projektübersicht](../README.md)
- [Architektur des Holodecks](architektur.md)
- [Den Prototyp ausprobieren und mitentwickeln](ausprobieren-und-mitentwickeln.md)
