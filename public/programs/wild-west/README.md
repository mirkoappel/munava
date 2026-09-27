---
name: Wild West
id: wild-west
kind: holodeck-program
version: 0.1.0
description: Prototypische begehbare Westernstadt mit Saloon und Sheriffbüro.
entry: index.js
---

# Wild West

Das Programm lädt seine Welt direkt aus `index.js`: eine staubige Hauptstraße mit Holzstegen, Saloon, Sheriffbüro, Kakteen, Zaun und einer greifbaren Transportkiste. Das ist eine erste Kulisse, noch kein Westernspiel. Der Wechsel zwischen dieser Welt und Sherlock Holmes funktioniert ohne Neustart der WebXR-Sitzung.

Der gemeinsame Katalog `dist/programs/index.json` benennt Einstiegsmodul und Live-Revision; die Farbstimmung steht im Weltmodul. Der Szenenstand liegt im jeweiligen Browser getrennt von Sherlock Holmes; frühere Testfeld-Stände werden einmalig übernommen, ohne die alten Daten zu löschen. Der Quest-Controller bleibt beim Programmwechsel als Core-Block aktiv. Ein gemeinsamer Speicher zwischen Quest und Codex fehlt noch.
