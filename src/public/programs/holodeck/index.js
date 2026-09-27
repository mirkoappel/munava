import { createProgramDocument, editableEntity } from '../../core/program-document.js';

function buildWorld(THREE) {
  const root = new THREE.Group();
  root.name = 'Holodeck-Raum';

  const grid = new THREE.GridHelper(80, 80, 0x4babb9, 0x265168);
  grid.name = 'Bodenraster';
  grid.material.transparent = true;
  grid.material.opacity = 0.38;
  grid.position.y = 0.012;
  root.add(grid);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x56dce5,
    transparent: true,
    opacity: 0.47,
    side: THREE.DoubleSide,
  });
  for (const radius of [9, 18, 27]) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius - 0.018, radius + 0.018, 128), ringMaterial);
    ring.name = `Bodenring ${radius}`;
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.025;
    root.add(ring);
  }

  const walls = new THREE.Group();
  walls.name = 'Drahtgitterwaende';
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x317285, transparent: true, opacity: 0.35 });
  for (let index = -30; index <= 30; index += 3) {
    for (const z of [-30, 30]) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(index, 0, z),
        new THREE.Vector3(index, 14, z),
      ]);
      walls.add(new THREE.Line(geometry, lineMaterial));
    }
    for (const x of [-30, 30]) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0, index),
        new THREE.Vector3(x, 14, index),
      ]);
      walls.add(new THREE.Line(geometry, lineMaterial));
    }
  }
  for (let y = 0; y <= 14; y += 3) {
    for (const z of [-30, 30]) {
      walls.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-30, y, z), new THREE.Vector3(30, y, z)]),
        lineMaterial,
      ));
    }
    for (const x of [-30, 30]) {
      walls.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, y, -30), new THREE.Vector3(x, y, 30)]),
        lineMaterial,
      ));
    }
  }
  root.add(walls);

  const portal = editableEntity(new THREE.Mesh(
    new THREE.TorusGeometry(2.8, 0.035, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0x63ebea }),
  ), 'portal-1', 'portal');
  portal.position.set(0, 4, -13);
  root.add(portal);
  const halo = new THREE.PointLight(0x56e6ed, 50, 14);
  halo.position.copy(portal.position);
  root.add(halo);

  return root;
}

export async function mount({ THREE, scene, snapshot, markChanged }) {
  const document = await createProgramDocument({
    THREE, scene, snapshot, markChanged, programId: 'holodeck',
    buildDefault: () => buildWorld(THREE),
  });
  return { document, theme: { background: '#08121f', fog: '#08121f', floor: '#102338' } };
}
