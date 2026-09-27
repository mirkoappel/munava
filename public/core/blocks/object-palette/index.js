function createButton(THREE, label, action, x) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const context = canvas.getContext('2d');
  context.fillStyle = '#17374a';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#67e5df';
  context.lineWidth = 10;
  context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
  context.fillStyle = '#f0ffff';
  context.font = 'bold 68px system-ui';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const button = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.18),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide }),
  );
  button.position.set(x, 0, 0.012);
  button.userData.holodeckAction = action;
  return button;
}

export function mount({ THREE, camera, renderer, controls }) {
  const grips = [renderer.xr.getControllerGrip(0), renderer.xr.getControllerGrip(1)];
  const palette = new THREE.Group();
  palette.name = 'holodeck-object-palette';
  palette.position.set(0, 0.13, -0.27);
  palette.visible = false;
  const background = new THREE.Mesh(
    new THREE.PlaneGeometry(0.83, 0.34),
    new THREE.MeshBasicMaterial({ color: 0x0c202c, transparent: true, opacity: 0.96, side: THREE.DoubleSide }),
  );
  palette.add(background);
  const buttons = [
    createButton(THREE, 'Quader', 'add-box', -0.19),
    createButton(THREE, 'Kugel', 'add-sphere', 0.19),
  ];
  palette.add(...buttons);
  let attachedGrip = null;
  const worldRotation = new THREE.Quaternion();
  const gripRotation = new THREE.Quaternion();

  function findLeftGrip() {
    return grips.find((grip) => grip.userData.holodeckInputSource?.handedness === 'left') || null;
  }

  function toggle() {
    if (palette.visible) {
      palette.visible = false;
      controls.message('Objektpalette geschlossen');
      return;
    }
    const grip = findLeftGrip();
    if (!grip) {
      controls.message('Linker Controller noch nicht erkannt');
      return;
    }
    if (attachedGrip !== grip) {
      grip.add(palette);
      attachedGrip = grip;
    }
    palette.visible = true;
    controls.message('Objektpalette geöffnet · mit rechtem Laser wählen');
  }

  function hide() { palette.visible = false; }
  window.addEventListener('holodeck-toggle-object-palette', toggle);
  window.addEventListener('holodeck-program-switch', hide);
  renderer.xr.addEventListener('sessionend', hide);

  return {
    getActionTargets: () => palette.visible ? buttons : [],
    update() {
      if (!palette.visible || !attachedGrip) return;
      camera.getWorldQuaternion(worldRotation);
      attachedGrip.getWorldQuaternion(gripRotation);
      palette.quaternion.copy(gripRotation.invert().multiply(worldRotation));
    },
    dispose() {
      window.removeEventListener('holodeck-toggle-object-palette', toggle);
      window.removeEventListener('holodeck-program-switch', hide);
      renderer.xr.removeEventListener('sessionend', hide);
      palette.removeFromParent();
      palette.traverse((node) => {
        node.geometry?.dispose();
        node.material?.map?.dispose();
        node.material?.dispose();
      });
    },
  };
}
