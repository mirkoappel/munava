import { createProgramDocument, editableEntity } from '../../core/program-document.js';

const PROGRAM_ID = 'wild-west';

function buildWorld(THREE) {
  const root = new THREE.Group();
  const sand = new THREE.MeshStandardMaterial({ color: 0xb78350, roughness: 1 });
  const road = new THREE.MeshStandardMaterial({ color: 0x93653f, roughness: 1 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x74452d, roughness: 0.92 });
  const lightWood = new THREE.MeshStandardMaterial({ color: 0xb47849, roughness: 0.92 });
  const darkWood = new THREE.MeshStandardMaterial({ color: 0x452c24, roughness: 0.9 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xe4bf79, roughness: 0.78 });
  const cactusMaterial = new THREE.MeshStandardMaterial({ color: 0x3c6845, roughness: 1 });

  function box(name, size, position, material, parent = root) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.name = name;
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }
  box('Wuestenboden', [80, 0.08, 80], [0, 0, -11], sand);
  box('Staubige Hauptstrasse', [11, 0.09, 39], [0, 0.05, -10], road);
  for (const side of [-1, 1]) {
    box('Holzsteg', [2.7, 0.23, 33], [side * 6.8, 0.18, -11], lightWood);
    for (let index = 0; index < 2; index += 1) {
      const x = side * 9.1;
      const z = -6 - index * 12;
      const building = new THREE.Group();
      building.name = index === 0 && side < 0 ? 'Saloon' : index === 0 ? 'Sheriffbuero' : 'Westernhaus';
      root.add(building);
      box('Fassade', [4.7, 4.2, 7.5], [x, 2.1, z], index === 0 ? wood : lightWood, building);
      box('Western-Giebel', [5.1, 1.2, 0.34], [x, 4.5, z + 3.8], darkWood, building);
      box('Vordach', [5.2, 0.18, 2], [x - side * 0.9, 2.8, z + 4.6], lightWood, building);
      for (const edge of [-2.2, 2.2]) {
        box('Vordachpfosten', [0.16, 2.7, 0.16], [x + edge, 1.4, z + 5.3], darkWood, building);
      }
      box('Schwingtuer', [1.45, 2, 0.16], [x, 1.25, z + 3.88], darkWood, building);
      for (const offset of [-1.55, 1.55]) {
        box('Fenster', [0.85, 0.82, 0.18], [x + offset, 1.85, z + 3.9], gold, building);
      }
      if (index === 0) {
        const label = side < 0 ? 'SALOON' : 'SHERIFF';
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        context.fillStyle = '#40271d';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = '#d5a66c';
        context.lineWidth = 10;
        context.strokeRect(6, 6, 500, 116);
        context.fillStyle = '#f2d29a';
        context.font = 'bold 72px Georgia, serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(label, 256, 67);
        const sign = new THREE.Mesh(
          new THREE.PlaneGeometry(3.5, 0.8),
          new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), side: THREE.DoubleSide }),
        );
        sign.name = `${label}-Schild`;
        sign.position.set(x, 4.52, z + 4.02);
        building.add(sign);
      }
    }
  }
  for (const [x, z] of [[-12, -2], [12, -8], [-13, -20], [13, -22]]) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 2.5, 8), cactusMaterial);
    trunk.name = 'Kaktus';
    trunk.position.set(x, 1.3, z);
    root.add(trunk);
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.9, 8), cactusMaterial);
      arm.rotation.z = side * 1.1;
      arm.position.set(x + side * 0.42, 1.25, z);
      root.add(arm);
    }
  }
  for (const x of [-12, 12]) {
    for (const z of [-1, -4, -7]) {
      box('Zaunpfosten', [0.16, 1.2, 0.16], [x, 0.65, z], wood);
    }
    for (const y of [0.52, 0.98]) {
      box('Zaunlatte', [0.12, 0.12, 6.3], [x, y, -4], wood);
    }
  }
  const firelight = new THREE.PointLight(0xffb56a, 22, 20);
  firelight.position.set(-6, 4, -7);
  root.add(firelight);
  editableEntity(box('Transportkiste', [0.9, 0.78, 0.9], [1.6, 0.48, -3.2], wood), 'kiste-1', 'box');
  return root;
}

export async function mount({ THREE, scene, snapshot, markChanged }) {
  const document = await createProgramDocument({
    THREE, scene, snapshot, markChanged, programId: PROGRAM_ID,
    buildDefault: () => buildWorld(THREE),
  });
  return { document, theme: { background: '#bd8061', fog: '#bd8061', floor: '#b78350' } };
}
