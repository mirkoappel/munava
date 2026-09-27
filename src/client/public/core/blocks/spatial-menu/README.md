---
name: Programm-Explorer
id: spatial-menu
kind: holodeck-block
version: 0.1.0
description: Aufrufbare räumliche Oberfläche für Programmwechsel, Speichern und Neustart.
entry: index.js
capabilities:
  - spatial-actions
  - program-selection
compatibility: prototype
---

# Programm-Explorer

Dieser Core-Block erzeugt den Programm-Explorer in der 3D-Szene. Er zeigt die verfügbaren Welten sowie „Stand speichern“, „Neu beginnen“ und „Programm beenden“. In VR öffnet ihn die linke Menütaste oder ersatzweise Y; er erscheint vor der aktuellen Blickposition und wird beim Programmwechsel geschlossen. Die Programmauswahl wird aus dem aktuellen Katalog aufgebaut und bei Änderungen erneuert.

Der Block stellt seine klickbaren Ziele über `getActionTargets()` bereit. Der Core sammelt diese Ziele und führt den gewählten Befehl aus; ein Eingabemodul wie `quest-controller` liefert nur den Treffer seines Lasers. So bleibt der Explorer unabhängig vom konkreten Controller. Speichern schreibt derzeit nur in den Browser des jeweiligen Geräts; benannte und gemeinsam erreichbare Speicherstände fehlen noch. Die getrennte Objektpalette bietet Quader und Kugel als Testwerkzeuge an.
