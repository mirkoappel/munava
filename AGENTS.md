# Munava – Anweisungen für KI-Agenten

Diese Datei gilt für Arbeiten im Munava-Repository. Die [Projekt-README](README.md) erklärt Idee und Aufbau; [Installation, Entwicklung und Betrieb](docs/installation.md) ist die gemeinsame Anleitung für Installation, lokale Prüfung und ChatGPT Sites. Lies vor diesen Arbeiten den jeweils betroffenen Abschnitt vollständig und prüfe die dort genannten Voraussetzungen am aktuellen Code.

## Vor Änderungen den tatsächlichen Stand klären

Prüfe `git status` einschließlich neuer Dateien und ermittle den aktuellen GitHub-Stand. Bei Arbeit an der bestehenden Site prüfe zusätzlich die neueste gespeicherte und die veröffentlichte Sites-Version. Ein GitHub-Pull enthält keine Änderungen, die nur in Sites entstanden sind. Kläre Abweichungen und beabsichtigte Änderungen, bevor du einen Stand übernimmst oder eine Sites-Version überschreibst.

## Installation und lokale Tests

Installiere Abhängigkeiten und führe Builds oder Tests nur in einem nicht über Google Drive synchronisierten Checkout aus. Folge den Befehlen und Einschränkungen in [Installation, Entwicklung und Betrieb](docs/installation.md). Prüfe vor Änderungen an Anmeldung, Tickets oder Echtzeit-Synchronisation auch die dort beschriebenen zusätzlichen Tests.

## ChatGPT Sites sicher verwenden

Der gesamte `.openai/`-Ordner ist lokal, Git-ignoriert und darf nicht veröffentlicht werden. Fehlt in einem neuen Klon die Zuordnung zur bestehenden Site, ermittle die Site mit einem berechtigten Konto und richte `.openai/hosting.json` lokal ein. Rate keine Projekt-ID und lege nicht ersatzweise eine neue Site an. Prüfe vor jedem Sites-Schreibvorgang, dass die Zuordnung zur beabsichtigten Site stimmt.

Übertrage vor dem Speichern einer Sites-Version den exakten Quellstand über den Sites-Workflow und verwende den dazugehörigen Commit. Ein GitHub-Push allein aktualisiert Sites nicht; ein GitHub-Push ist aber auch nicht für jede Sites-Testschleife nötig. Speichern und Veröffentlichen sind getrennte Schritte. Veröffentliche nur auf ausdrücklichen Auftrag; jedes Deployment ist ein Live-Stand.
