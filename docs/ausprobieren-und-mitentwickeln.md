# Den Prototyp ausprobieren und mitentwickeln

> [!WARNING]
> **Status: Entwurf – noch nicht geprüft**
>
> Diese Datei ist vorläufig und kann gegenüber dem aktuellen Projektstand veraltet sein. Aussagen und Anleitungen müssen vor ihrer Verwendung im Einzelfall auf Aktualität und Stichhaltigkeit geprüft und bei Bedarf angepasst werden. Maßgeblich sind derzeit der aktuelle Code und die abgestimmte Haupt-README. Die Dokumentation wird fortlaufend nachgezogen.

Diese Anleitung beschreibt den heutigen Versuchsaufbau und die geplante Öffnung des Holodeck-Projekts. Der Aufbau entwickelt sich weiter; die Haupt-README erklärt die Vision und den aktuellen Funktionsumfang.

## Worum es bei dem Aufbau geht

Der Prototyp verbindet eine Browseranwendung mit einem Desktop-Agenten. Die Browseranwendung macht das Holodeck-Programm auf einer VR-Brille oder einem anderen Gerät erlebbar. Der Desktop-Agent begleitet die Entwicklung im Sprachdialog, verändert das Programm und kann über eine Schnittstelle direkt in derselben Welt handeln.

In der aktuellen Referenzumsetzung übernimmt die ChatGPT-Desktop-App von OpenAI die Rolle des Desktop-Agenten. Darin entwickelt Codex das Holodeck-Programm gemeinsam mit dem Menschen weiter. ChatGPT Sites stellt die Browseranwendung über eine Webadresse bereit.

Dieser Aufbau nutzt vorhandene, leistungsfähige Systeme. Dadurch kann sich das Projekt zunächst auf das Holodeck-Erlebnis und die dafür nötige Architektur konzentrieren, ohne eine eigene Agentenschicht entwickeln zu müssen.

## Heutiger Versuchsaufbau

Für den vollständigen Ablauf werden derzeit verwendet:

- eine Meta Quest mit dem Holodeck-Programm im Browser;
- ein Laptop mit der ChatGPT-Desktop-App und Codex;
- der Sprachmodus für den laufenden Dialog mit dem Agenten;
- ChatGPT Sites für Vorschau und Bereitstellung der Browseranwendung;
- optional Quest Remote Desktop, um den Laptopbildschirm in der Brille zu sehen.

Quest und Desktop-Agent laufen gleichzeitig. Du kannst in der Holodeck-Welt bleiben, eine gewünschte Änderung beschreiben und das Ergebnis dort prüfen. Die optionale Bildschirmübertragung macht die Arbeit des Agenten sichtbar, ohne dass du die Quest dafür absetzen musst.

## Typischer Ablauf

1. Du öffnest das Holodeck-Programm im Browser der Meta Quest oder auf einem anderen unterstützten Gerät.
2. Du startest den Sprachmodus mit Codex in der ChatGPT-Desktop-App.
3. Du beschreibst, was sich im aktiven Holodeck-Programm verändern soll.
4. Codex entwickelt die Programmfassung weiter oder handelt über die bereitgestellte Schnittstelle direkt in der laufenden Welt.
5. Eine geprüfte neue Programmfassung wird über ChatGPT Sites bereitgestellt.
6. Die geöffnete Anwendung übernimmt die neue Fassung, und du prüfst das Ergebnis im Zusammenhang der Welt.

Der letzte Teil dieses Kreislaufs wird schrittweise weiter automatisiert. Die heutige Implementierung kann neue Programmfassungen bereits ohne vollständiges Neuladen der Seite und ohne Ende der WebXR-Sitzung übernehmen.

## Selbst einsteigen

Der vollständige Aufbau ist noch nicht öffentlich paketiert. Für einen eigenen Test werden derzeit eine Projektkopie, ein geeigneter Desktop-Agent und eine eigene Bereitstellungsumgebung benötigt.

Für eine spätere Open-Source-Veröffentlichung soll das Repository gemeinsam mit einer verständlichen Einstiegshilfe bereitstehen. Ein projektbezogener Skill oder ein Plugin kann einen kompatiblen Agenten künftig durch Einrichtung, Weiterentwicklung und Bereitstellung einer eigenen Fassung führen. Codex dient heute als Referenz; die Schnittstellen sollen auch weitere geeignete Agenten unterstützen.

Eine öffentliche Testfassung und die konkreten Schritte für eine eigene Entwicklungsumgebung werden in diesem Dokument ergänzt, sobald sie verfügbar sind.

## Zwei mögliche Wege in die Zukunft

Die heutige Trennung von Browseranwendung und Desktop-Agent kann bestehen bleiben. KI-Agenten könnten sich zu einer verbreiteten Betriebs- und Auslieferungsschicht für Software entwickeln, die Anwendungen einrichtet, anpasst und gemeinsam mit Menschen weiterentwickelt. Solche Agenten könnten künftig auch direkt auf VR-Brillen oder Smart Glasses laufen und Teil ihrer Betriebssysteme werden.

Daneben ist eine integrierte Fassung denkbar. Sprachdialog und Agentenfähigkeiten wären dann aus Sicht der Nutzer direkt Teil der Anwendung, während ein vorhandener Agent im Hintergrund arbeitet. Das Holodeck soll beide Wege unterstützen, ohne dauerhaft an ein bestimmtes Produkt gebunden zu sein.
