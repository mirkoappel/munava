---
name: Quest Controller
id: quest-controller
kind: holodeck-block
version: 0.5.4
description: Eigenständiger Quest-Controller-Block für Darstellung, Laser, Eingaben, Greifen und dreidimensionale Fortbewegung.
entry: index.js
capabilities:
  - controller-visualization
  - laser-selection
  - object-grab
  - locomotion
compatibility: prototype
---

# Quest Controller

Quest Controller bündelt die aktuelle Quest-Bedienung in einem austauschbaren Block. Er lädt über die `XRControllerModelFactory` von Three.js automatisch passende 3D-Modelle. Bis ein Modell geladen ist, bleibt eine einfache Ersatzform sichtbar. Die Modelle und Geräteprofile werden derzeit aus dem öffentlichen WebXR-Input-Profiles-Verzeichnis geladen; dafür benötigt die Quest eine Internetverbindung. Die benötigten Zusatzmodule und ihr Lizenzhinweis liegen im blockeigenen Ordner `vendor`.

## Vorläufige Bedienung

- Der Trigger betätigt räumliche Bedienelemente anderer Core-Module und wählt Objekte aus. Das Menü selbst wird vom separaten Block `spatial-menu` erzeugt.
- Der Griffknopf greift ein Objekt; beim Loslassen bleibt es an der neuen Position und gilt als noch nicht gespeichert.
- Auch beim Greifen bleiben horizontale Bewegung und Drehung möglich. Hoch und runter am rechten Stick verändert dann den Abstand des gehaltenen Objekts statt der eigenen Flughöhe; das gilt unabhängig von der greifenden Hand.
- Der linke Stick bewegt die Anwender horizontal in Blickrichtung. Ein Druck auf den linken Stick wechselt zwischen Sitzhöhe (1,20 m) und Stehhöhe (1,65 m). Beim ersten Druck wird die andere Höhe gewählt, gemessen an der aktuellen virtuellen Augenhöhe.
- Der rechte Stick dreht die Sicht nach links oder rechts: standardmäßig in Schritten von 30 Grad, nach einem Druck auf den rechten Stick weich und kontinuierlich. Im weichen Modus reagiert er um die Mitte besonders fein und erreicht bei vollem Ausschlag höchstens 45 Grad pro Sekunde. Ein weiterer Druck schaltet zurück zur Rasterdrehung.
- Ohne gegriffenes Objekt verändert hoch und runter am rechten Stick in beiden Drehmodi analog die Höhe mit bis zu 1,2 m/s. So sind horizontale Bewegung und Steigen oder Sinken zugleich möglich.
- Ein Klick auf den Boden bietet zusätzlich die bisherige Positionsänderung an.

## Grenze zum Kernel

Der Kernel hält die WebXR-Sitzung, die Szene, allgemeine Programmbefehle und eine Schnittstelle für räumliche Bedienelemente bereit. Dieser Block verwaltet Controller-Gruppen, Modelle, Laser, Eingabeereignisse, Greifen und Fortbewegung selbst und räumt sie beim Entladen wieder auf. Er erkennt Treffer auf Bedienelementen, kennt aber weder deren Darstellung noch die Menüpunkte. Die aktuelle Tastenbelegung ist ein Prototyp und kann geändert werden, ohne die allgemeinen Szenenbefehle umzubauen.
