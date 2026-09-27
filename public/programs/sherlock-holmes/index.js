import { createProgramDocument, editableEntity } from '../../core/program-document.js';

const PROGRAM_ID = 'sherlock-holmes';

function buildWorld(THREE) {
  const root = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x394452, roughness: 0.95 });
  const pavement = new THREE.MeshStandardMaterial({ color: 0x747775, roughness: 0.94 });
  const brick = [0x6c4b45, 0x57515b, 0x735b4d, 0x485358]
    .map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.94 }));
  const dark = new THREE.MeshStandardMaterial({ color: 0x211f28, roughness: 0.9 });
  const windowMaterial = new THREE.MeshStandardMaterial({ color: 0xf2c989, emissive: 0xb76b2e, emissiveIntensity: 0.75 });
  const brass = new THREE.MeshStandardMaterial({ color: 0x9d8256, metalness: 0.65, roughness: 0.3 });

  function box(name, size, position, material, parent = root) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.name = name;
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }
  box('Londoner Strasse', [12, 0.08, 42], [0, 0, -11], stone);
  for (const side of [-1, 1]) {
    box('Gehweg', [2.6, 0.22, 42], [side * 6.9, 0.08, -11], pavement);
    for (let index = 0; index < 3; index += 1) {
      const z = -5 - index * 8;
      const x = side * 9.3;
      const height = 5.8 + (index % 2) * 0.9;
      const facade = new THREE.Group();
      facade.name = `Viktorianisches Haus ${side}-${index + 1}`;
      root.add(facade);
      box('Mauerwerk', [4.1, height, 7.6], [x, height / 2, z], brick[(index + (side + 1)) % brick.length], facade);
      box('Gesims', [4.45, 0.2, 7.8], [x, height + 0.06, z], dark, facade);
      const faceX = x - side * 2.12;
      box('Haustuer', [0.12, 2.1, 1.1], [faceX, 1.16, z + 2.1], dark, facade);
      for (const level of [2.4, 4.3]) {
        for (const offset of [-2.1, 0.1]) {
          box('Erleuchtetes Fenster', [0.14, 0.9, 0.78], [faceX, level, z + offset], windowMaterial, facade);
        }
      }
    }
  }
  for (const z of [-3, -14]) {
    for (const side of [-1, 1]) {
      const x = side * 4.6;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.2, 8), dark);
      pole.position.set(x, 1.6, z);
      root.add(pole);
      box('Gaslaterne', [0.42, 0.5, 0.42], [x, 3.27, z], windowMaterial);
    }
  }
  const gaslight = new THREE.PointLight(0xffba6a, 20, 14);
  gaslight.position.set(-4.6, 3.3, -3);
  root.add(gaslight);
  const gaslightFar = new THREE.PointLight(0xffba6a, 14, 12);
  gaslightFar.position.set(4.6, 3.3, -14);
  root.add(gaslightFar);

  box('Strassenschild', [4.4, 0.72, 0.12], [0, 3.75, -7], dark);
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = '#251f23';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#e7d2a5';
  context.font = 'bold 52px Georgia, serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('221B BAKER STREET', canvas.width / 2, canvas.height / 2);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.1, 0.62),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), side: THREE.DoubleSide }),
  );
  sign.name = 'Baker-Street-Schild';
  sign.position.set(0, 3.75, -6.92);
  root.add(sign);
  for (const x of [-2.15, 2.15]) {
    box('Schildpfosten', [0.12, 3.9, 0.12], [x, 1.95, -7], brass);
  }
  const suitcase = editableEntity(box('Koffer', [0.72, 0.48, 0.32], [-1.3, 0.39, -3.2], dark), 'koffer-1', 'box');
  suitcase.userData.holodeck.behaviors = [];
  return root;
}

export async function mount({ THREE, scene, snapshot, markChanged }) {
  const document = await createProgramDocument({
    THREE, scene, snapshot, markChanged, programId: PROGRAM_ID,
    buildDefault: () => buildWorld(THREE),
  });
  return { document, theme: { background: '#242b38', fog: '#242b38', floor: '#394452' } };
}
