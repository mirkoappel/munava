---
name: Sherlock Holmes
id: sherlock-holmes
kind: holodeck-program
version: 0.1.0
description: Prototypische begehbare Detektivwelt mit viktorianischer Straße.
entry: index.js
---

# Sherlock Holmes

Das Programm lädt seine Welt direkt aus `index.js`: eine neblige viktorianische Straße mit Häusern, Gaslaternen, einem Straßenschild und einem greifbaren Koffer. Das ist eine erste Kulisse, noch kein Detektivspiel. Weitere Objekte lassen sich in der laufenden Szene hinzufügen, verschieben und im jeweiligen Browser speichern.

Der gemeinsame Katalog `dist/programs/index.json` benennt Einstiegsmodul und Live-Revision; der Kern lädt eine neue Fassung ohne Seiten-Reload. Die Farbstimmung steht im Weltmodul. Frühere Hello-World-Browserstände werden einmalig in dieses Programm übernommen, ohne die alten Daten zu löschen. Der Quest-Controller bleibt als Core-Block unabhängig geladen. Ein gemeinsamer Speicher zwischen Quest und Codex fehlt noch.
