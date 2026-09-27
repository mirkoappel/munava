---
name: Objektpalette
id: object-palette
kind: holodeck-block
version: 0.1.0
description: Aufrufbares Testwerkzeug zum Erzeugen einfacher Objekte in der aktiven Welt.
entry: index.js
capabilities:
  - primitive-creation
compatibility: prototype
---

# Objektpalette

Die Objektpalette ist ein vorläufiges Debug-Werkzeug, kein Bestandteil des Programm-Explorers. Ein Druck auf X am linken Quest-Controller blendet sie an dieser Hand ein oder aus. Mit dem rechten Laser und Trigger können Quader oder Kugeln erzeugt werden. Die neuen Objekte gehören zur aktiven Welt und werden erst durch „Stand speichern“ dauerhaft im Browser gesichert.

Der Block zeichnet nur die Palette und liefert anklickbare Aktionsziele. Die eigentliche Erzeugung erfolgt über denselben Core-Befehl, den auch Bildschirmoberfläche und Site-Werkzeuge nutzen. Greifen und Verschieben funktionieren unabhängig von der Palette.
