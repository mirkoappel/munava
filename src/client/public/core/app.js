import * as THREE from './three.js/three.module.js';
import { VRButton } from './three.js/VRButton.js';
import { createProgramStore } from './program-store.js';

const blockIndexURL = new URL('./blocks/index.json', import.meta.url);
const programIndexURL = new URL('../programs/index.json', import.meta.url);
const DEFAULT_PROGRAM_ID = 'holodeck';
const PROGRAM_SELECTION_KEY = 'holodeck:active-program';
const stage = document.querySelector('#stage');
const panel = document.querySelector('.panel');
const status = document.querySelector('#status');
const liveState = document.querySelector('#live-state');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x08121f);
scene.fog = new THREE.FogExp2(0x08121f, 0.026);
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.05, 250);
camera.position.set(0, 1.65, 7);
const rig = new THREE.Group();
rig.name = 'holodeck-rig';
rig.add(camera);
scene.add(rig);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.xr.enabled = true;
stage.appendChild(renderer.domElement);

function buildRoom() {
  scene.add(new THREE.HemisphereLight(0x8bd6ee, 0x182d49, 2.5));
  const light = new THREE.PointLight(0x63e6eb, 95, 28);
  light.position.set(0, 6, 0);
  scene.add(light);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({ color: 0x102338, roughness: 0.86, metalness: 0.18 }),
  );
  floor.name = 'holodeck-floor';
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const grid = new THREE.GridHelper(80, 80, 0x4babb9, 0x265168);
  grid.material.transparent = true;
  grid.material.opacity = 0.38;
  grid.position.y = 0.012;
  scene.add(grid);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x56dce5,
    transparent: true,
    opacity: 0.47,
    side: THREE.DoubleSide,
  });
  for (const radius of [9, 18, 27]) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius - 0.018, radius + 0.018, 128), ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.025;
    scene.add(ring);
  }

  const walls = new THREE.Group();
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
  scene.add(walls);

  const portal = new THREE.Mesh(
    new THREE.TorusGeometry(2.8, 0.035, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0x63ebea }),
  );
  portal.position.set(0, 4, -13);
  scene.add(portal);
  const halo = new THREE.PointLight(0x56e6ed, 50, 14);
  halo.position.copy(portal.position);
  scene.add(halo);
  return { floor, grid, walls, portal, halo };
}

const room = buildRoom();
const floor = room.floor;
const programStore = createProgramStore();
const liveBlocks = new Map();
const dirtyPrograms = new Set();
let liveProgram = null;
let activeProgram = null;
let availablePrograms = [];
let selectedProgramId = DEFAULT_PROGRAM_ID;
try {
  const previousSelection = localStorage.getItem(PROGRAM_SELECTION_KEY);
  selectedProgramId = ({
    'hello-world': 'sherlock-holmes',
    testfeld: 'wild-west',
  })[previousSelection] || previousSelection || DEFAULT_PROGRAM_ID;
} catch (error) {
  console.warn('Program selection will not persist in this browser.', error);
}
let livePending = false;
let lastLiveCheck = 0;

const beacon = new THREE.Mesh(
  new THREE.OctahedronGeometry(0.14),
  new THREE.MeshBasicMaterial({ color: 0xe6ae56 }),
);
beacon.position.set(0, 1.75, -3);
scene.add(beacon);

function liveMessage(message, color = 0x5de7c8) {
  liveState.textContent = message;
  beacon.material.color.setHex(color);
}

function workspaceMessage(message) {
  status.textContent = message;
}

function disposeLayer(group) {
  if (!group) return;
  group.traverse((node) => {
    node.geometry?.dispose();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) material?.dispose();
  });
}

function unloadLiveBlock(id) {
  const block = liveBlocks.get(id);
  if (!block) return;
  scene.remove(block.layer);
  try {
    block.dispose?.();
  } finally {
    disposeLayer(block.layer);
    liveBlocks.delete(id);
    dirtyPrograms.delete(id);
  }
}

function markProgramChanged(programId, change = {}) {
  if (change.type === 'entity-transformed' && liveProgram?.id === programId) {
    const entity = liveProgram.document.getEntity(change.entityId);
    if (entity) entity.userData.holodeck.modified = true;
  }
  dirtyPrograms.add(programId);
  workspaceMessage(`${programId} geändert · noch nicht gespeichert`);
  window.dispatchEvent(new CustomEvent('holodeck-change', { detail: { programId, ...change } }));
}

async function loadLiveBlock(definition, options = {}) {
  const { force = false, ignoreSnapshot = false } = options;
  if (
    !definition
    || typeof definition.id !== 'string'
    || !/^[a-z0-9-]+$/.test(definition.id)
    || typeof definition.revision !== 'string'
    || typeof definition.module !== 'string'
  ) throw new Error('Invalid block definition');

  const current = liveBlocks.get(definition.id);
  if (!force && current?.revision === definition.revision) return false;

  const moduleURL = new URL(definition.module, blockIndexURL);
  const blockFolderURL = new URL(`./${definition.id}/`, blockIndexURL);
  if (moduleURL.origin !== location.origin || !moduleURL.pathname.startsWith(blockFolderURL.pathname)
    || !moduleURL.pathname.endsWith('.js')) {
    throw new Error(`Invalid module URL for ${definition.id}`);
  }
  moduleURL.searchParams.set('revision', definition.revision);
  const module = await import(moduleURL.href);
  if (typeof module.mount !== 'function') throw new Error(`${definition.id} has no mount function`);

  const savedRecord = ignoreSnapshot ? null : await programStore.load(definition.id);
  const nextLayer = new THREE.Group();
  nextLayer.name = definition.id;
  nextLayer.userData.holodeckBlockId = definition.id;
  let hooks;
  try {
    hooks = await module.mount({
      THREE,
      scene: nextLayer,
      camera,
      rig,
      renderer,
      snapshot: savedRecord?.scene || null,
      markChanged: (change) => markProgramChanged(definition.id, change),
      controls: {
        floor,
        getEditableTargets: editableTargets,
        getActionTargets: actionTargets,
        activateActionTarget,
        getProgramIdForEntity: programIdForEntity,
        listPrograms: () => availablePrograms.map(({ id, name }) => ({ id, name })),
        getActiveProgram: () => activeProgram,
        markProgramChanged,
        runAction,
        message: workspaceMessage,
      },
      block: { id: definition.id, revision: definition.revision },
    }) || {};
  } catch (error) {
    disposeLayer(nextLayer);
    throw error;
  }

  scene.add(nextLayer);
  if (current) {
    scene.remove(current.layer);
    try {
      current.dispose?.();
    } finally {
      disposeLayer(current.layer);
    }
  }
  liveBlocks.set(definition.id, {
    definition,
    revision: definition.revision,
    savedRevision: savedRecord?.revision || null,
    layer: nextLayer,
    update: hooks.update || null,
    dispose: hooks.dispose || null,
    document: hooks.document || null,
    getActionTargets: hooks.getActionTargets || null,
  });
  dirtyPrograms.delete(definition.id);
  return true;
}

function applyProgramTheme(theme) {
  scene.background.set(theme.background);
  scene.fog.color.set(theme.fog);
  floor.material.color.set(theme.floor);
  room.grid.visible = false;
  room.walls.visible = false;
  room.portal.visible = false;
  room.halo.visible = false;
}

async function loadLiveProgram(definition, catalogURL, options = {}) {
  const { force = false, ignoreSnapshot = false } = options;
  const current = liveProgram;
  if (!force && current?.id === definition.id && current.revision === definition.revision) return false;
  if (current) window.dispatchEvent(new Event('holodeck-before-world-replace'));

  const moduleURL = new URL(definition.module, catalogURL);
  const folderURL = new URL(`./${definition.id}/`, catalogURL);
  if (moduleURL.origin !== location.origin || !moduleURL.pathname.startsWith(folderURL.pathname)
    || !moduleURL.pathname.endsWith('.js')) {
    throw new Error(`Invalid program module URL: ${definition.id}`);
  }
  moduleURL.searchParams.set('revision', definition.revision);
  const module = await import(moduleURL.href);
  if (typeof module.mount !== 'function') throw new Error(`Program ${definition.id} has no mount function`);

  const workingSnapshot = !ignoreSnapshot && current?.id === definition.id && dirtyPrograms.has(definition.id)
    ? current.document.serialize() : null;
  const savedRecord = ignoreSnapshot || workingSnapshot ? null : await programStore.load(definition.id);
  const nextLayer = new THREE.Group();
  nextLayer.name = definition.id;
  nextLayer.userData.holodeckProgramId = definition.id;
  let hooks;
  try {
    hooks = await module.mount({
      THREE, scene: nextLayer, camera, rig, renderer,
      snapshot: workingSnapshot || savedRecord?.scene || null,
      markChanged: (change) => markProgramChanged(definition.id, change),
      program: { id: definition.id, revision: definition.revision },
    }) || {};
    if (!hooks.document?.serialize || !hooks.document?.getEditableObjects) {
      throw new Error(`Program ${definition.id} has no document interface`);
    }
    if (!hooks.theme || ['background', 'fog', 'floor'].some((key) => !/^#[0-9a-f]{6}$/i.test(hooks.theme[key] || ''))) {
      throw new Error(`Program ${definition.id} has no valid theme`);
    }
  } catch (error) {
    disposeLayer(nextLayer);
    throw error;
  }

  scene.add(nextLayer);
  if (current) {
    scene.remove(current.layer);
    try { current.dispose?.(); } finally { disposeLayer(current.layer); }
  }
  liveProgram = {
    id: definition.id,
    definition,
    catalogURL,
    revision: definition.revision,
    savedRevision: savedRecord?.revision || (current?.id === definition.id ? current.savedRevision : null),
    layer: nextLayer,
    document: hooks.document,
    update: hooks.update || null,
    dispose: hooks.dispose || null,
  };
  if (!workingSnapshot) dirtyPrograms.delete(definition.id);
  applyProgramTheme(hooks.theme);
  return true;
}

async function refreshLiveBlocks() {
  if (livePending) return false;
  livePending = true;
  try {
    const indexRequestURL = new URL(programIndexURL);
    indexRequestURL.searchParams.set('t', Date.now());
    const indexResponse = await fetch(indexRequestURL, { cache: 'no-store', credentials: 'same-origin' });
    if (!indexResponse.ok) throw new Error('Program index request: ' + indexResponse.status);
    const index = await indexResponse.json();
    if (!Array.isArray(index.programs) || index.programs.length === 0
      || index.programs.some(({ id, name, module, revision, blocks }) => !/^[a-z0-9-]+$/.test(id)
        || typeof name !== 'string' || typeof module !== 'string' || typeof revision !== 'string'
        || !Array.isArray(blocks) || blocks.some((blockId) => typeof blockId !== 'string'
          || !/^[a-z0-9-]+$/.test(blockId)) || new Set(blocks).size !== blocks.length)
      || !index.programs.some(({ id }) => id === DEFAULT_PROGRAM_ID)
      || new Set(index.programs.map(({ id }) => id)).size !== index.programs.length) {
      throw new Error('Invalid program index');
    }
    availablePrograms = index.programs.map(({ id, name }) => ({ id, name }));
    if (!availablePrograms.some(({ id }) => id === selectedProgramId)) selectedProgramId = DEFAULT_PROGRAM_ID;
    const program = index.programs.find(({ id }) => id === selectedProgramId);

    const requestURL = new URL(blockIndexURL);
    requestURL.searchParams.set('t', Date.now());
    const response = await fetch(requestURL, { cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) throw new Error(`Block list request: ${response.status}`);
    const manifest = await response.json();
    if (!Array.isArray(manifest.blocks)) throw new Error('Invalid block list');
    const availableBlocks = new Set(manifest.blocks.map((definition) => definition.id));
    if (availableBlocks.size !== manifest.blocks.length) throw new Error('Duplicate block in index');
    const programBlocks = new Set(program.blocks);
    for (const id of programBlocks) {
      if (!availableBlocks.has(id)) throw new Error('Program block not found: ' + id);
    }

    const activeIds = new Set();
    let changed = await loadLiveProgram(program, programIndexURL);
    for (const definition of manifest.blocks) {
      if (definition.scope !== 'system' && !programBlocks.has(definition.id)) continue;
      activeIds.add(definition.id);
      changed = await loadLiveBlock(definition) || changed;
    }
    for (const id of [...liveBlocks.keys()]) {
      if (!activeIds.has(id)) {
        unloadLiveBlock(id);
        changed = true;
      }
    }
    activeProgram = { id: program.id, name: program.name, revision: program.revision, blocks: [...program.blocks] };
    renderProgramChoices();
    liveMessage(changed ? 'Live verbunden · Programm aktualisiert' : 'Live verbunden');
    return true;
  } catch (error) {
    console.warn('Live block update failed:', error);
    liveMessage('Live-Verbindung pausiert', 0xe6ae56);
    return false;
  } finally {
    livePending = false;
  }
}

function renderProgramChoices() {
  document.querySelector('.eyebrow').textContent = activeProgram ? 'AKTUELLES PROGRAMM' : 'HOLODECK';
  document.querySelector('.panel h1').textContent = activeProgram?.name || 'Holodeck';
  const container = document.querySelector('#program-actions');
  if (!container) return;
  container.replaceChildren();
  for (const program of availablePrograms) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = program.name;
    button.disabled = program.id === activeProgram?.id;
    button.addEventListener('click', () => runAction(`program:${program.id}`).catch((error) => workspaceMessage(`Fehler: ${error.message}`)));
    container.appendChild(button);
  }
  const exitButton = document.querySelector('[data-holodeck-action="exit-program"]');
  if (exitButton) exitButton.disabled = !activeProgram || activeProgram.id === DEFAULT_PROGRAM_ID;
  for (const action of ['save', 'reset', 'add-box', 'add-sphere']) {
    const button = document.querySelector(`[data-holodeck-action="${action}"]`);
    if (button) button.disabled = !activeProgram;
  }
}

async function switchProgram(programId) {
  if (!availablePrograms.some(({ id }) => id === programId)) throw new Error(`Unbekanntes Programm: ${programId}`);
  if (activeProgram?.id === programId) return getHolodeckState();
  window.dispatchEvent(new Event('holodeck-before-program-switch'));
  if (activeProgram && dirtyPrograms.has(activeProgram.id)) {
    throw new Error('Bitte zuerst das aktuelle Programm speichern oder zurücksetzen.');
  }
  while (livePending) await new Promise((resolve) => setTimeout(resolve, 50));
  const previousProgramId = selectedProgramId;
  selectedProgramId = programId;
  if (!await refreshLiveBlocks() || activeProgram?.id !== programId) {
    selectedProgramId = previousProgramId;
    await refreshLiveBlocks();
    throw new Error('Programmwechsel fehlgeschlagen');
  }
  try { localStorage.setItem(PROGRAM_SELECTION_KEY, programId); } catch (error) {
    console.warn('Program selection could not be saved.', error);
  }
  workspaceMessage(`${activeProgram.name} geladen`);
  window.dispatchEvent(new CustomEvent('holodeck-program-switch', { detail: { programId } }));
  return getHolodeckState();
}

async function exitProgram() {
  if (activeProgram?.id === DEFAULT_PROGRAM_ID) return getHolodeckState();
  const state = await switchProgram(DEFAULT_PROGRAM_ID);
  workspaceMessage('Programm beendet · Holodeck geladen');
  return state;
}

function getDocumentProgram(programId = activeProgram?.id || DEFAULT_PROGRAM_ID) {
  if (!activeProgram) throw new Error('Bitte zuerst ein Programm laden.');
  if (liveProgram?.id !== programId || !liveProgram.document) {
    throw new Error(`Program document not ready: ${programId}`);
  }
  return liveProgram;
}

function spawnPositionFor(block) {
  const worldPosition = camera.getWorldPosition(new THREE.Vector3());
  const worldDirection = camera.getWorldDirection(new THREE.Vector3());
  worldPosition.addScaledVector(worldDirection, 3);
  worldPosition.y = Math.max(0.5, worldPosition.y - 0.65);
  return block.document.root.worldToLocal(worldPosition).toArray();
}

function getHolodeckState(programId = null) {
  const blocks = [...liveBlocks.entries()].map(([id, block]) => ({
    id,
    revision: block.revision,
    savedRevision: block.savedRevision,
    dirty: dirtyPrograms.has(id),
    entities: block.document?.listEntities?.() || [],
  }));
  const document = liveProgram && {
    id: liveProgram.id,
    revision: liveProgram.revision,
    savedRevision: liveProgram.savedRevision,
    dirty: dirtyPrograms.has(liveProgram.id),
    entities: liveProgram.document.listEntities(),
  };
  if (!programId) return {
    activeProgram,
    availablePrograms: availablePrograms.map(({ id, name }) => ({ id, name })),
    document,
    activeBlocks: blocks,
  };
  if (document?.id !== programId) throw new Error(`Unknown or inactive program: ${programId}`);
  return document;
}

function createPrimitive(input = {}) {
  const programId = input.programId || activeProgram?.id || DEFAULT_PROGRAM_ID;
  const block = getDocumentProgram(programId);
  const entity = block.document.createPrimitive({
    ...input,
    position: input.position || spawnPositionFor(block),
  });
  workspaceMessage(`${entity.id} erstellt`);
  return { programId, entity };
}

function setEntityTransform(input = {}) {
  const programId = input.programId || activeProgram?.id || DEFAULT_PROGRAM_ID;
  const block = getDocumentProgram(programId);
  const entity = block.document.setTransform(input.entityId, input);
  workspaceMessage(`${entity.id} verändert`);
  return { programId, entity };
}

function removeEntity(input = {}) {
  const programId = input.programId || activeProgram?.id || DEFAULT_PROGRAM_ID;
  const block = getDocumentProgram(programId);
  const result = block.document.removeEntity(input.entityId);
  workspaceMessage(`${input.entityId} entfernt`);
  return { programId, ...result };
}

async function saveProgram(programId = activeProgram?.id || DEFAULT_PROGRAM_ID) {
  const block = getDocumentProgram(programId);
  const record = await programStore.save(programId, block.document.serialize());
  block.savedRevision = record.revision;
  dirtyPrograms.delete(programId);
  workspaceMessage(`Gespeichert · ${new Date(record.savedAt).toLocaleTimeString('de-DE')}`);
  window.dispatchEvent(new CustomEvent('holodeck-save', { detail: { programId, revision: record.revision } }));
  return {
    programId,
    revision: record.revision,
    savedAt: record.savedAt,
    entities: block.document.listEntities(),
  };
}

async function resetProgram(programId = activeProgram?.id || DEFAULT_PROGRAM_ID) {
  const block = getDocumentProgram(programId);
  await programStore.clear(programId);
  await loadLiveProgram(block.definition, block.catalogURL, { force: true, ignoreSnapshot: true });
  workspaceMessage(`${programId} auf Ausgangszustand zurückgesetzt`);
  return getHolodeckState(programId);
}

function exportProgram(programId = activeProgram?.id || DEFAULT_PROGRAM_ID) {
  const block = getDocumentProgram(programId);
  return {
    format: 'holodeck-program-export',
    formatVersion: 1,
    programId,
    exportedAt: new Date().toISOString(),
    sourceRevision: block.revision,
    blocks: activeProgram?.blocks || [programId],
    scene: block.document.serialize(),
  };
}

async function runAction(action) {
  if (action.startsWith('program:')) return switchProgram(action.slice('program:'.length));
  if (action === 'exit-program') return exitProgram();
  if (action === 'add-box') return createPrimitive({ type: 'box' });
  if (action === 'add-sphere') return createPrimitive({ type: 'sphere' });
  if (action === 'save') return saveProgram();
  if (action === 'reset') return resetProgram();
  throw new Error(`Unknown action: ${action}`);
}

for (const button of document.querySelectorAll('[data-holodeck-action]')) {
  button.addEventListener('click', async () => {
    try {
      await runAction(button.dataset.holodeckAction);
    } catch (error) {
      console.error(error);
      workspaceMessage(`Fehler: ${error.message}`);
    }
  });
}

let exploring = false;
let dragging = false;
let yaw = 0;
let pitch = 0;
let lastX = 0;
let lastY = 0;
const keys = new Set();

function begin() {
  exploring = true;
  panel.classList.add('hidden');
  document.body.classList.add('exploring');
  workspaceMessage('Im Raum · Esc für Menü');
}

document.querySelector('#enter').addEventListener('click', begin);
addEventListener('keydown', (event) => {
  keys.add(event.code);
  if (event.code === 'Escape' && !renderer.xr.isPresenting) {
    exploring = false;
    panel.classList.remove('hidden');
    document.body.classList.remove('exploring');
    workspaceMessage('Raum bereit');
  }
});
addEventListener('keyup', (event) => keys.delete(event.code));
renderer.domElement.addEventListener('pointerdown', (event) => {
  if (!exploring) return;
  dragging = true;
  lastX = event.clientX;
  lastY = event.clientY;
  renderer.domElement.setPointerCapture(event.pointerId);
});
renderer.domElement.addEventListener('pointerup', () => { dragging = false; });
renderer.domElement.addEventListener('pointermove', (event) => {
  if (!dragging || !exploring || renderer.xr.isPresenting) return;
  yaw -= (event.clientX - lastX) * 0.003;
  pitch = THREE.MathUtils.clamp(pitch - (event.clientY - lastY) * 0.003, -1.3, 1.3);
  camera.rotation.order = 'YXZ';
  camera.rotation.set(pitch, yaw, 0);
  lastX = event.clientX;
  lastY = event.clientY;
});

const vrButton = VRButton.createButton(renderer);
vrButton.textContent = 'VR betreten';
vrButton.removeAttribute('style');
document.querySelector('#vr-slot').appendChild(vrButton);
renderer.xr.addEventListener('sessionstart', () => {
  begin();
  workspaceMessage('VR aktiv · Griffknopf greift, Trigger klickt');
});
renderer.xr.addEventListener('sessionend', () => workspaceMessage('Im Raum · Esc für Menü'));

function editableTargets() {
  const targets = liveProgram?.document.getEditableObjects() || [];
  for (const block of liveBlocks.values()) {
    if (block.document?.getEditableObjects) targets.push(...block.document.getEditableObjects());
  }
  return targets;
}

function actionTargets() {
  const targets = [];
  for (const block of liveBlocks.values()) {
    if (block.getActionTargets) targets.push(...block.getActionTargets());
  }
  return targets;
}

function activateActionTarget(object) {
  let current = object;
  while (current && current !== scene) {
    if (typeof current.userData.holodeckAction === 'string') {
      return runAction(current.userData.holodeckAction);
    }
    current = current.parent;
  }
  throw new Error('Dieses Bedienelement hat keine Aktion.');
}

function programIdForEntity(object) {
  let current = object;
  while (current && current !== scene) {
    const programId = current.userData.holodeckProgramId;
    if (programId) return programId;
    const blockId = current.userData.holodeckBlockId;
    if (blockId) return liveBlocks.get(blockId)?.document?.id || activeProgram?.id || DEFAULT_PROGRAM_ID;
    current = current.parent;
  }
  return activeProgram?.id || DEFAULT_PROGRAM_ID;
}

const vectorSchema = {
  type: 'array',
  items: { type: 'number' },
  minItems: 3,
  maxItems: 3,
};

async function registerSiteTools() {
  if (typeof document.modelContext?.registerTool !== 'function') {
    document.documentElement.dataset.siteTools = 'unavailable';
    return;
  }

  const tools = [
    {
      name: 'list_holodeck_programs',
      description: 'List available Holodeck programs and identify the active program in this browser session.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async () => ({ activeProgram: activeProgram?.id || null, programs: availablePrograms.map(({ id, name }) => ({ id, name })) }),
    },
    {
      name: 'switch_holodeck_program',
      description: 'Switch the active Holodeck program in this browser session without ending WebXR. Refuses to discard unsaved changes.',
      inputSchema: {
        type: 'object',
        properties: { programId: { type: 'string', description: 'Identifier from list_holodeck_programs.' } },
        required: ['programId'],
        additionalProperties: false,
      },
      execute: async ({ programId }) => switchProgram(programId),
    },
    {
      name: 'get_holodeck_state',
      description: 'Read the active Holodeck program, loaded blocks, entities, revisions, and unsaved-change status.',
      inputSchema: {
        type: 'object',
        properties: { programId: { type: 'string', description: 'Optional program identifier.' } },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async ({ programId } = {}) => getHolodeckState(programId || null),
    },
    {
      name: 'create_holodeck_primitive',
      description: 'Create an editable box or sphere in a running Holodeck program. This changes the unsaved working scene.',
      inputSchema: {
        type: 'object',
        properties: {
          programId: { type: 'string' },
          id: { type: 'string', pattern: '^[a-z0-9-]+$' },
          type: { type: 'string', enum: ['box', 'sphere'] },
          position: vectorSchema,
          size: vectorSchema,
          color: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        },
        additionalProperties: false,
      },
      execute: async (input) => createPrimitive(input),
    },
    {
      name: 'set_holodeck_transform',
      description: 'Change an entity position, rotation, or scale in the running Holodeck scene. This changes the unsaved working scene.',
      inputSchema: {
        type: 'object',
        properties: {
          programId: { type: 'string' },
          entityId: { type: 'string' },
          position: vectorSchema,
          rotation: vectorSchema,
          scale: vectorSchema,
        },
        required: ['entityId'],
        additionalProperties: false,
      },
      execute: async (input) => setEntityTransform(input),
    },
    {
      name: 'remove_holodeck_entity',
      description: 'Remove an editable entity from the running Holodeck scene. This changes the unsaved working scene.',
      inputSchema: {
        type: 'object',
        properties: { programId: { type: 'string' }, entityId: { type: 'string' } },
        required: ['entityId'],
        additionalProperties: false,
      },
      execute: async (input) => removeEntity(input),
    },
    {
      name: 'save_holodeck_program',
      description: 'Persist the current working scene as a new local Holodeck program revision.',
      inputSchema: {
        type: 'object',
        properties: { programId: { type: 'string' } },
        additionalProperties: false,
      },
      execute: async ({ programId } = {}) => saveProgram(programId || activeProgram?.id || DEFAULT_PROGRAM_ID),
    },
    {
      name: 'reset_holodeck_program',
      description: 'Delete the saved working scene and restore the program default. This discards unsaved and locally saved scene changes.',
      inputSchema: {
        type: 'object',
        properties: { programId: { type: 'string' } },
        additionalProperties: false,
      },
      execute: async ({ programId } = {}) => resetProgram(programId || activeProgram?.id || DEFAULT_PROGRAM_ID),
    },
    {
      name: 'export_holodeck_program',
      description: 'Read a portable snapshot of the current Holodeck program scene without changing it.',
      inputSchema: {
        type: 'object',
        properties: { programId: { type: 'string' } },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async ({ programId } = {}) => exportProgram(programId || activeProgram?.id || DEFAULT_PROGRAM_ID),
    },
  ];

  for (const tool of tools) await document.modelContext.registerTool(tool);
  document.documentElement.dataset.siteTools = 'ready';
}

const movement = new THREE.Vector3();
let previousFrameTime = performance.now();
renderer.setAnimationLoop((frameTime) => {
  const now = Number.isFinite(frameTime) ? frameTime : performance.now();
  const deltaTime = Math.min(Math.max((now - previousFrameTime) / 1000, 0), 0.05);
  previousFrameTime = now;
  if (exploring && !renderer.xr.isPresenting) {
    movement.set(
      Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')),
      0,
      Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')),
    );
    if (movement.lengthSq()) {
      movement.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).multiplyScalar(deltaTime * 4);
      camera.position.add(movement);
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -28, 28);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -28, 28);
    }
  }

  if (now - lastLiveCheck > 3000) {
    lastLiveCheck = now;
    refreshLiveBlocks();
  }
  beacon.rotation.y += deltaTime * 0.9;
  beacon.position.y = 1.75 + Math.sin(now * 0.002) * 0.05;
  try {
    liveProgram?.update?.(deltaTime, now * 0.001);
  } catch (error) {
    console.warn(`Live program animation failed: ${liveProgram.id}`, error);
    liveProgram.update = null;
  }
  for (const [id, block] of liveBlocks) {
    try {
      block.update?.(deltaTime, now * 0.001);
    } catch (error) {
      console.warn(`Live block animation failed: ${id}`, error);
      block.update = null;
    }
  }
  renderer.render(scene, camera);
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

await refreshLiveBlocks();
await registerSiteTools();

window.holodeckRuntime = Object.freeze({
  getActiveProgramId: () => activeProgram?.id || selectedProgramId || null,
  getEntity: (id) => liveProgram?.document?.listEntities().find((entity) => entity.id === id) || null,
  createPrimitive: (input) => createPrimitive(input).entity,
  setEntityTransform: (input) => setEntityTransform(input).entity,
});
window.dispatchEvent(new Event('holodeck-ready'));
