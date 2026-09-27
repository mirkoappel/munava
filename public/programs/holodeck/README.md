---
name: Holodeck
id: holodeck
kind: holodeck-program
version: 0.1.0
description: Bearbeitbare Systemwelt und Rückkehrort für andere Holodeck-Programme.
entry: index.js
---

# Holodeck

Holodeck ist die Systemwelt mit Bodenraster, Ringen, Drahtgitterwänden und Portal. Sie liegt bewusst neben den anderen Welten im Programmkatalog und nutzt denselben Lade-, Speicher- und Hot-Reload-Weg. „Programm beenden“ führt hierher zurück.

Der Core hält darunter nur die WebXR-Laufzeit, Grundbeleuchtung und einen leeren Sicherheitsboden bereit. Die sichtbare Holodeck-Kulisse gehört diesem Programm und kann unabhängig vom Core weiterentwickelt werden. Das Portal ist als bearbeitbare Entität markiert; hinzugefügte Objekte und Änderungen lassen sich wie in den anderen Programmen zunächst im jeweiligen Browser speichern.

Der gemeinsame Katalog `dist/programs/index.json` benennt Einstiegsmodul und Live-Revision. Die Farben der Welt stehen in diesem Modul selbst.
