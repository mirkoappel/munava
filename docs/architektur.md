# Architektur des Holodecks

> [!WARNING]
> **Status: Entwurf – noch nicht geprüft**
>
> Diese Datei ist vorläufig und kann gegenüber dem aktuellen Projektstand veraltet sein. Aussagen und Anleitungen müssen vor ihrer Verwendung im Einzelfall auf Aktualität und Stichhaltigkeit geprüft und bei Bedarf angepasst werden. Maßgeblich sind derzeit der aktuelle Code und die abgestimmte Haupt-README. Die Dokumentation wird fortlaufend nachgezogen.

Dieses Dokument beschreibt die aktuelle, vorläufige Architektur des Holodeck-Prototyps. Es hält den heutigen technischen Stand, die dahinterliegenden Prinzipien und bereits erkennbare Ausbaurichtungen fest. Die Architektur entwickelt sich anhand konkreter Holodeck-Programme weiter.

## Architekturprinzipien

- **Stabiler Kern, flexible Inhalte:** Core, Holodeck-Programme und Bausteine bleiben getrennt, damit Welten und Fähigkeiten unabhängig weiterentwickelt und kombiniert werden können.
- **KI als Mitentwicklerin und Teilnehmerin:** Die KI verändert sowohl Programmcode und Assets als auch den Zustand der laufenden Welt.
- **Ein gemeinsamer Echtzeitzustand:** Menschen, Geräte und KI beziehen sich auf dieselbe aktuelle Welt.
- **Nachvollziehbare Weltfassungen:** Programmcode, Assets und bedeutsamer Weltzustand sollen gemeinsam als wiederherstellbare Fassung erhalten bleiben.
- **Weiterentwicklung in der laufenden Sitzung:** Neue Programmfassungen sollen übernommen werden, ohne die immersive Sitzung zu beenden.
- **Klare Rechte und austauschbare Infrastruktur:** Nutzung, Programmgestaltung und Systementwicklung werden getrennt; die Architektur bleibt für weitere Agenten und Bereitstellungsumgebungen offen.

## Komponenten im Überblick

| Komponente | Aufgabe |
| --- | --- |
| **Browser-Core** | Gemeinsame WebXR-Laufzeit für Darstellung, Eingabe, Programmladen, Speicherzugriff und die Werkzeuge der Welt. |
| **Holodeck-Programme** | Konkrete Welten mit Szenen, Objekten, Atmosphäre, Regeln und eigenen Assets. |
| **Bausteine** | Versionierte und wiederverwendbare Fähigkeiten wie Quest-Controller, räumliche Menüs oder Objektwerkzeuge. |
| **Desktop-Agent** | Begleitet Menschen im Sprachdialog und entwickelt Programmcode, Assets und Konfiguration weiter. |
| **WebMCP** | Stellt der KI klar benannte und begrenzte Werkzeuge der geöffneten Browseranwendung bereit. |
| **ChatGPT Sites** | Veröffentlicht die Browseranwendung und neue Programmfassungen über HTTPS und bestätigt die Anmeldung. |
| **Ticket-Worker** | Erstellt aus der bestätigten Identität eine kurzlebige Beitrittsberechtigung für Welt und Instanz. |
| **Colyseus** | Synchronisiert als Echtzeitserver den laufenden Weltzustand zwischen verbundenen Clients. |

## Zusammenspiel der Systeme

Die heutige Referenzumsetzung verbindet die Komponenten in vier Ebenen:

```text
ChatGPT Sites
├── liefert Core, Programme, Systembausteine und Assets
└── bestätigt die Anmeldung und stellt ein kurzlebiges Ticket aus
                         │ HTTPS
                         ▼
Browser-Client auf Quest oder Desktop ◄──── WebMCP ──── KI
├── stabiler Core
├── aktives Holodeck-Programm
├── wiederverwendbare Systembausteine
└── Colyseus-SDK
                         │ direkte WSS-Verbindung
                         ▼
          Colyseus-Echtzeitserver auf dem Deckeins-VPS
                         │
             gemeinsamer Weltzustand aller Clients
```

- **Bereitstellung und Anmeldung:** ChatGPT Sites veröffentlicht die Browseranwendung über HTTPS, schützt den Zugriff und führt den Ticket-Worker aus.
- **Laufzeit im Browser:** Auf Quest und Desktop läuft jeweils ein vollständiger Client aus Core, aktivem Programm und benötigten Bausteinen.
- **Zugang der KI:** WebMCP stellt semantische Werkzeuge des geöffneten Clients bereit. Die KI kann dadurch den Weltzustand lesen und unterstützte Aktionen über dieselbe Anwendungslogik ausführen wie ein Mensch.
- **Echtzeit-Synchronisation:** Colyseus prüft das Ticket, ordnet Zustandsänderungen und verteilt sie zwischen allen verbundenen Clients.

ChatGPT Sites verteilt Anwendungscode und neue Programmfassungen. Colyseus verteilt den laufenden Weltzustand. Der Colyseus-Echtzeitserver wird als eigenständiges Betriebsprojekt gepflegt und gehört nicht zu diesem Repository.

## Browser-Laufzeit: Core, Programme und Bausteine

Die Browseranwendung ist in einen stabilen **Core**, austauschbare **Holodeck-Programme** und wiederverwendbare **Bausteine** gegliedert. Der Core stellt die gemeinsame WebXR-Laufzeit bereit: Darstellung, VR-Sitzung, Eingabe, Programmlader, Speicherzugriff und die Werkzeuge, über die Menschen und KI mit der Welt arbeiten.

Ein Holodeck-Programm bringt seine konkrete Szene, Objekte, Atmosphäre, Regeln und programmspezifischen Assets mit. Holodeck, Wild West und Sherlock Holmes nutzen dieselbe Laufzeit, können aber unabhängig voneinander weiterentwickelt und innerhalb derselben WebXR-Sitzung gewechselt werden.

Ein Baustein kapselt eine abgegrenzte Fähigkeit in einem eigenen versionierten Modul. Systembausteine wie Quest-Controller, räumliches Menü und Objektpalette werden unabhängig von einer einzelnen Welt geladen. Programmspezifische Bausteine können künftig gezielt ausgewählt, ausgetauscht und als eigene Variante weiterentwickelt werden.

Holodeck-Programme und Bausteine sollen sich bewahren, teilen und als Ausgangspunkt für eigene Varianten nutzen lassen. Das ursprüngliche Element bleibt erhalten; Herkunft und Versionsgeschichte bleiben nachvollziehbar. So kann die KI bewährte Fähigkeiten zusammensetzen und gezielt erweitern, statt jede Grundlage neu zu erzeugen.

## Die KI entwickelt und handelt in derselben Welt

Die KI arbeitet auf zwei miteinander verbundenen Ebenen:

- **Als Mitentwicklerin** liest und verändert sie den Quellstand eines Holodeck-Programms. So entstehen neue Objekte, Regeln, Verhaltensweisen und Werkzeuge, die dauerhaft zur nächsten Programmfassung gehören.
- **Als Teilnehmerin der laufenden Welt** liest und verändert sie den aktuellen Zustand. Sie kann unterstützte Objekte erzeugen, bewegen oder konfigurieren, Aktionen auslösen und perspektivisch Figuren oder Ereignisse steuern.

WebMCP ermöglicht der geöffneten Browseranwendung, einer KI klar benannte und begrenzte Werkzeuge anzubieten. Die KI kann dadurch beispielsweise Objekte auflisten, einen Gegenstand verändern oder eine vorgesehene Aktion auslösen, statt Bildschirminhalte deuten und Zeigerbewegungen nachahmen zu müssen.

```text
Person in VR ── Controller und Sprache ──┐
                                        ├──► gemeinsamer Echtzeit-Raum
KI im Dialog ── WebMCP-Schnittstelle ───┘
        │
        └── Quellcode und Assets ───────────► nächste Programmfassung
```

Die geöffnete Holodeck-Anwendung bleibt der Echtzeit-Client. Sie entscheidet, welche Werkzeuge verfügbar sind, prüft deren Eingaben und führt erlaubte Aktionen über dieselbe Anwendungslogik aus wie die räumlichen Werkzeuge eines Menschen. Relevante Änderungen überträgt sie anschließend in den gemeinsamen Raum.

## Gemeinsamer Echtzeitzustand

Der Echtzeit-Raum ist das gemeinsame Arbeitsgedächtnis des Holodecks. Quest, Desktop und KI beziehen sich auf denselben aktuellen Weltzustand. Colyseus ordnet und verteilt Änderungen, sodass alle verbundenen Clients denselben Stand erleben.

Diese Grundlage trägt heute den Einzelbenutzer-Prototyp mit mehreren Geräten. Perspektivisch kann sie gemeinsame Welten mit mehreren Menschen und KI-Akteuren unterstützen.

## Weltfassungen

Bei klassischen interaktiven Anwendungen bleibt das Programm während der Nutzung gewöhnlich unverändert. Der gespeicherte Zustand hält den Fortschritt innerhalb dieses Rahmens fest. Im Holodeck entwickelt sich auch der Rahmen während des Erlebens weiter: Menschen und KI verändern sowohl die laufende Welt als auch ihre Fähigkeiten.

Eine **Weltfassung** verbindet deshalb die Bestandteile, die als zusammengehöriger Checkpoint bewahrt werden müssen:

- die bedeutsamen Objekte und Eigenschaften der aktuellen Szene;
- den Code und die Verhaltensweisen dieser Fassung;
- verwendete Modelle, Texturen, Klänge und weitere Assets;
- den Fortschritt, an dem das Erlebnis später weitergehen soll.

Beim nächsten Öffnen soll genau diese Welt mit ihren damaligen Fähigkeiten und ihrem damaligen Stand erscheinen. Frühere Checkpoints können als Historie erhalten, verglichen, benannt oder verzweigt werden. Flüchtige Details wie eine aktuelle Kopf- oder Controllerpose bleiben Teil des Augenblicks.

Code, Szenendaten und Assets dürfen technisch in unterschiedlichen Dateien liegen. Entscheidend ist ihre gemeinsame Identität als nachvollziehbare Weltfassung.

## Live-Austausch neuer Programmfassungen

Eine klassische Webseite übernimmt neuen Code meist durch ein vollständiges Neuladen. In einer VR-Sitzung würde das den unmittelbaren Zusammenhang unterbrechen. Das Holodeck braucht deshalb einen kontrollierten **Live-Austausch**, häufig auch Hot Reload oder Hotswap genannt: Eine neue Programmfassung soll in die bereits geöffnete Welt gelangen, ohne den Core und die WebXR-Sitzung neu zu starten.

Die heutige Implementierung bildet diesen Weg bereits ab. Ein Programmkatalog nennt für jedes Programm sein Einstiegsmodul und seine Revision. Der Core prüft auf eine neue Revision, lädt das aktualisierte JavaScript-Modul ohne Browser-Cache und baut die neue Szenenebene zunächst separat auf. Erst wenn das erfolgreich war, ersetzt er die bisherige Ebene und gibt ihre Ressourcen frei. Der ungespeicherte Arbeitszustand des aktiven Programms wird dabei an die neue Fassung übergeben. Systembausteine folgen demselben Revisionsprinzip.

Damit kann eine veröffentlichte neue Programmfassung bereits ohne Seiten-Reload und ohne Ende der WebXR-Sitzung erscheinen. Der vollständige Holodeck-Kreislauf ergänzt davor die automatische Verbindung: Die KI verändert den Code aus dem Sprachdialog heraus, eine geprüfte Fassung wird bereitgestellt, und der geöffnete Client übernimmt sie selbstständig. Für beliebige Codeänderungen braucht es zusätzlich klare Regeln, wie bestehende Objekte und Zustände sicher in die neue Fassung übertragen werden.

## Berechtigungen

Gemeinsame und veröffentlichte Welten brauchen ein Berechtigungsmodell mit drei Bereichen:

- **Holodeck-Programme nutzen:** Eine Person erlebt ein Programm so, wie es freigegeben wurde. Vorgesehene Interaktionen dürfen den laufenden Weltzustand verändern; dauerhafte Änderungen an Welt, Regeln oder Programmfassung gehören nicht zu diesem Recht.
- **Holodeck-Programme entwickeln und anpassen:** Eine Person darf Inhalte, Regeln, Verhalten, Bausteine und Regie eines freigegebenen Programms verändern und neue Programmfassungen erstellen.
- **Das Holodeck-System entwickeln und anpassen:** Eine Person darf den gemeinsamen Core, systemweite Bausteine, Schnittstellen sowie Sicherheits- und Laufzeitfunktionen weiterentwickeln.

Diese Rechte sollen sich später pro Programm und Welt kombinieren lassen. Auch die KI handelt ausschließlich innerhalb der Rechte der jeweiligen Person oder einer ausdrücklich eingerichteten KI-Rolle. Die fein abgestufte Rechteverwaltung ist eine zukünftige Funktion.

## Bereitstellung und Infrastruktur

ChatGPT Sites eignet sich für den Prototypen, weil Änderungen schnell in der Vorschau geprüft, veröffentlicht und aktualisiert werden können. Die Anwendung liegt über HTTPS für die VR-Brille erreichbar im Netz, und die Anmeldung kann serverseitig genutzt werden. Dadurch lassen sich Ideen unmittelbar in einer echten Quest-Sitzung ausprobieren.

ChatGPT Sites trägt die aktuelle Prototyping-Phase. Portable Programme und Kernkonzepte halten zugleich den Weg für weitere geeignete Infrastrukturen offen.

## Perspektive: externe oder integrierte KI

Die heutige Trennung von Browseranwendung und Desktop-Agent kann bestehen bleiben. KI-Agenten könnten Anwendungen künftig auf verschiedenen Geräten einrichten, anpassen und gemeinsam mit Menschen weiterentwickeln; auch direkt auf VR-Brillen oder Smart Glasses. Ebenso ist eine integrierte Fassung denkbar, in der Sprachdialog und Agentenfähigkeiten aus Nutzersicht Teil von Munava sind. Die Architektur soll beide Wege ermöglichen, ohne dauerhaft an ein bestimmtes KI-Produkt gebunden zu sein.

## Sicherheitsgrenzen

- Secrets bleiben vollständig in den serverseitigen Umgebungen.
- Kurzlebige und inhaltlich begrenzte Tickets ersetzen ein gemeinsames Dauertoken.
- Der private Signaturschlüssel liegt ausschließlich als Sites-Secret; auf dem VPS liegt nur der öffentliche Prüfschlüssel.
- Der Browser hält das Ticket ausschließlich im Arbeitsspeicher.
- Caddy stellt TLS bereit und leitet die direkte WebSocket-Verbindung intern an Colyseus weiter.
- Browserherkunft, Welt und Instanz werden beim Beitritt geprüft.
- Neue Skripte und KI-Werkzeuge werden nur nach ausdrücklicher Freigabe ausgeführt.

## Vorläufige Projektstruktur

Die Ordnerstruktur bildet den aktuellen Prototyp ab und kann sich mit der Architektur weiterentwickeln:

```text
.
├── index.html              Einstieg in die Browseranwendung
├── src/
│   ├── client/             Browseranwendung und Colyseus-Verbindung
│   │   └── public/
│   │       ├── core/       WebXR-Laufzeit und gemeinsame Werkzeuge
│   │       │   └── blocks/ versionierte, wiederverwendbare Bausteine
│   │       └── programs/   Holodeck, Wild West und Sherlock Holmes
│   └── server/             Ticket-Endpunkt als Cloudflare Worker
├── build/                  Sites-spezifischer Build-Adapter
├── docs/                   vertiefende Projekt- und Entwicklungsdokumentation
├── dist/                   lokal erzeugte, Git-ignorierte Build-Ausgabe
├── vite.config.js          Build-Konfiguration
└── wrangler.json           Worker- und Asset-Konfiguration
```

Vite übernimmt `src/client/public/` unverändert in `dist/client/`. Dadurch behalten Core, Blocks und Programme ihre bisherigen Web-Pfade unter `/core/` und `/programs/`. Der Quellordner `src/server/` wird als Worker nach `dist/server/` gebaut.

Die Zuordnung zu einem Sites-Projekt liegt bei Bedarf nur lokal in `.openai/hosting.json`. Der gesamte `.openai/`-Ordner gehört nicht zum öffentlichen Repository.

Die Codebasis ist bewusst klein gehalten. Ihre Kernwerkzeuge sind Vite, der Cloudflare-Vite-Adapter, das Colyseus-SDK und browsernatives WebXR. Vite erzeugt aus der lesbaren Quelle das Browser-Bundle und den ausführbaren Worker für die Sites-Laufzeit.

## Weiterführende Dokumentation

- [Projektübersicht](../README.md)
- [Installation, Entwicklung und Betrieb](installation.md)
