function createLabel(THREE, label, width, height, options = {}) {
  const { action = null, selected = false, enabled = true, heading = false } = options;
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 144;
  const context = canvas.getContext('2d');
  context.fillStyle = heading ? '#102d3b' : selected ? '#22546a' : enabled ? '#17374a' : '#172934';
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (!heading) {
    context.strokeStyle = enabled ? '#66e8df' : '#5b7480';
    context.lineWidth = 7;
    context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  }
  context.fillStyle = enabled ? '#f0ffff' : '#8da8b2';
  context.font = `${heading ? 700 : 600} ${heading ? 51 : 46}px system-ui`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, canvas.width / 2, canvas.height / 2, canvas.width - 36);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide }),
  );
  if (action && enabled) mesh.userData.holodeckAction = action;
  return mesh;
}

export function mount({ THREE, scene, camera, renderer, controls }) {
  if (!controls?.listPrograms || !controls?.getActiveProgram) {
    throw new Error('Program explorer requires the program list and current program');
  }

  const explorer = new THREE.Group();
  explorer.name = 'holodeck-program-explorer';
  explorer.position.set(0, 1.55, -2.2);
  scene.add(explorer);
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(3.35, 2.75),
    new THREE.MeshBasicMaterial({ color: 0x0c202c, transparent: true, opacity: 0.94, side: THREE.DoubleSide }),
  );
  backdrop.position.z = -0.02;
  explorer.add(backdrop);

  const labels = [];
  const buttons = [];
  let signature = null;

  function addLabel(label, x, y, width, height, options = {}) {
    const mesh = createLabel(THREE, label, width, height, options);
    mesh.position.set(x, y, 0);
    explorer.add(mesh);
    labels.push(mesh);
    if (mesh.userData.holodeckAction) buttons.push(mesh);
  }

  function syncButtons() {
    const programs = controls.listPrograms();
    const active = controls.getActiveProgram();
    const nextSignature = JSON.stringify({ programs, activeId: active?.id || null });
    if (nextSignature === signature) return;
    for (const mesh of labels) {
      explorer.remove(mesh);
      mesh.material.map.dispose();
      mesh.material.dispose();
      mesh.geometry.dispose();
    }
    labels.length = 0;
    buttons.length = 0;
    addLabel('PROGRAMM-EXPLORER', 0, 1.18, 3.0, 0.3, { heading: true });
    addLabel(`Aktiv: ${active?.name || 'kein Programm'}`, 0, 0.84, 3.0, 0.25, { heading: true });
    programs.forEach(({ id, name }, index) => {
      addLabel(name, 0, 0.46 - index * 0.38, 2.85, 0.31, {
        action: `program:${id}`, selected: active?.id === id,
      });
    });
    const hasProgram = Boolean(active);
    addLabel('Stand speichern', -0.77, -0.84, 1.37, 0.29, { action: 'save', enabled: hasProgram });
    addLabel('Neu beginnen', 0.77, -0.84, 1.37, 0.29, { action: 'reset', enabled: hasProgram });
    addLabel('Programm beenden', 0, -1.19, 2.9, 0.28, {
      action: 'exit-program', enabled: hasProgram && active.id !== 'holodeck',
    });
    signature = nextSignature;
  }

  function placeInFrontOfViewer() {
    const eye = camera.getWorldPosition(new THREE.Vector3());
    const forward = camera.getWorldDirection(new THREE.Vector3());
    forward.y = 0;
    if (forward.lengthSq() < 0.001) forward.set(0, 0, -1);
    forward.normalize();
    explorer.position.copy(eye).addScaledVector(forward, 1.9);
    explorer.lookAt(eye);
  }

  function toggle() {
    if (!explorer.visible) placeInFrontOfViewer();
    explorer.visible = !explorer.visible;
    controls.message(explorer.visible ? 'Programm-Explorer geöffnet' : 'Programm-Explorer geschlossen');
  }

  function onSessionStart() { explorer.visible = false; }
  function onSessionEnd() { explorer.visible = true; }
  function onProgramSwitch() { if (renderer.xr.isPresenting) explorer.visible = false; }
  window.addEventListener('holodeck-toggle-program-explorer', toggle);
  window.addEventListener('holodeck-program-switch', onProgramSwitch);
  renderer.xr.addEventListener('sessionstart', onSessionStart);
  renderer.xr.addEventListener('sessionend', onSessionEnd);
  explorer.visible = !renderer.xr.isPresenting;
  syncButtons();
  return {
    getActionTargets: () => explorer.visible ? buttons : [],
    update: syncButtons,
    dispose() {
      window.removeEventListener('holodeck-toggle-program-explorer', toggle);
      window.removeEventListener('holodeck-program-switch', onProgramSwitch);
      renderer.xr.removeEventListener('sessionstart', onSessionStart);
      renderer.xr.removeEventListener('sessionend', onSessionEnd);
      for (const mesh of labels) mesh.material.map.dispose();
    },
  };
}
