function triple(value, fallback) {
  return Array.isArray(value) && value.length === 3 && value.every(Number.isFinite) ? value : fallback;
}

function entitySummary(object) {
  const metadata = object.userData.holodeck;
  return {
    id: metadata.id,
    type: metadata.type,
    origin: metadata.origin,
    behaviors: Array.isArray(metadata.behaviors) ? [...metadata.behaviors] : [],
    position: object.position.toArray(),
    rotation: object.rotation.toArray().slice(0, 3),
    scale: object.scale.toArray(),
  };
}

export function editableEntity(object, id, type) {
  object.name = id;
  object.userData.holodeck = { id, type, editable: true, origin: 'default', behaviors: [] };
  return object;
}

export async function createProgramDocument({ THREE, scene, snapshot, markChanged, programId, buildDefault }) {
  let root = buildDefault();
  root.userData.holodeckDocument = { id: programId, formatVersion: 1 };
  if (snapshot) {
    const restored = await new THREE.ObjectLoader().parseAsync(snapshot);
    const sourceId = restored.userData.holodeckDocument?.id;
    const isCurrentFormat = sourceId === programId;
    const removedDefaults = isCurrentFormat
      ? restored.userData.holodeckDocument.removedDefaultIds || [] : [];
    const savedEntities = [];
    restored.traverse((object) => {
      const metadata = object.userData.holodeck;
      const legacyStarter = (sourceId === 'hello-world' && metadata?.id === 'kugel-1')
        || (sourceId === 'testfeld' && metadata?.id === 'marker-1');
      if (metadata?.editable && !legacyStarter
        && (!isCurrentFormat || metadata.origin !== 'default' || metadata.modified)) {
        savedEntities.push(object);
      }
    });
    for (const object of savedEntities) {
      let existing = null;
      root.traverse((candidate) => {
        if (candidate.userData.holodeck?.id === object.userData.holodeck.id) existing = candidate;
      });
      existing?.removeFromParent();
      root.add(object);
    }
    for (const id of removedDefaults) {
      let existing = null;
      root.traverse((candidate) => {
        if (candidate.userData.holodeck?.id === id) existing = candidate;
      });
      existing?.removeFromParent();
    }
    root.userData.holodeckDocument.removedDefaultIds = removedDefaults;
  }
  root.name = `${programId}-document`;
  root.userData.holodeckDocument ||= { id: programId, formatVersion: 1 };
  scene.add(root);

  function editableObjects() {
    const objects = [];
    root.traverse((object) => {
      if (object.userData.holodeck?.editable === true) objects.push(object);
    });
    return objects;
  }
  function getEntity(id) {
    return editableObjects().find((object) => object.userData.holodeck.id === id) || null;
  }
  function createPrimitive(input = {}) {
    const type = input.type === 'sphere' ? 'sphere' : 'box';
    const prefix = type === 'sphere' ? 'kugel' : 'quader';
    let id = input.id;
    if (!id) {
      let n = 1;
      while (getEntity(`${prefix}-${n}`)) n += 1;
      id = `${prefix}-${n}`;
    }
    if (typeof id !== 'string' || !/^[a-z0-9-]+$/.test(id) || getEntity(id)) {
      throw new Error(`Ungültige oder belegte Objektkennung: ${id}`);
    }
    const size = triple(input.size, [1, 1, 1]).map((value) => Math.max(0.05, value));
    const color = typeof input.color === 'string' && /^#[0-9a-f]{6}$/i.test(input.color)
      ? input.color : 0x7ab9ac;
    const geometry = type === 'sphere'
      ? new THREE.SphereGeometry(size[0] / 2, 24, 16)
      : new THREE.BoxGeometry(...size);
    const object = editableEntity(new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color, roughness: 0.65 }),
    ), id, type);
    object.userData.holodeck.origin = 'user';
    object.position.fromArray(triple(input.position, [0, 0.5, -3]));
    root.add(object);
    markChanged?.({ type: 'entity-created', entityId: id });
    return entitySummary(object);
  }
  function setTransform(id, transform = {}) {
    const object = getEntity(id);
    if (!object) throw new Error(`Unbekanntes Objekt: ${id}`);
    if (transform.position) object.position.fromArray(triple(transform.position, object.position.toArray()));
    if (transform.rotation) object.rotation.fromArray([...triple(transform.rotation, object.rotation.toArray().slice(0, 3)), object.rotation.order]);
    if (transform.scale) object.scale.fromArray(triple(transform.scale, object.scale.toArray()).map((value) => Math.max(0.01, value)));
    object.userData.holodeck.modified = true;
    object.updateMatrixWorld(true);
    markChanged?.({ type: 'entity-transformed', entityId: id });
    return entitySummary(object);
  }
  function removeEntity(id) {
    const object = getEntity(id);
    if (!object) throw new Error(`Unbekanntes Objekt: ${id}`);
    if (object.userData.holodeck.origin === 'default') {
      root.userData.holodeckDocument.removedDefaultIds ||= [];
      root.userData.holodeckDocument.removedDefaultIds.push(id);
    }
    object.removeFromParent();
    object.geometry?.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) material?.dispose();
    markChanged?.({ type: 'entity-removed', entityId: id });
    return { id, removed: true };
  }
  return {
    id: programId, root,
    listEntities: () => editableObjects().map(entitySummary),
    getEditableObjects: editableObjects, getEntity, createPrimitive, setTransform, removeEntity,
    serialize: () => { root.updateMatrixWorld(true); return root.toJSON(); },
  };
}
