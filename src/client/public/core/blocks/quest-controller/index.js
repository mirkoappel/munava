import { XRControllerModelFactory } from './vendor/webxr/XRControllerModelFactory.js';

const RAY_LENGTH = 8;
const MOVE_SPEED = 2.5;
const ELEVATE_SPEED = 1.2;
const HELD_DISTANCE_SPEED = 2;
const TURN_ANGLE = Math.PI / 6;
const SMOOTH_TURN_SPEED = Math.PI / 4;
const SEATED_EYE_HEIGHT = 1.2;
const STANDING_EYE_HEIGHT = 1.65;

function axis(value) {
  return Math.abs(value || 0) < 0.18 ? 0 : value;
}

function stick(inputSource) {
  const axes = inputSource?.gamepad?.axes;
  if (!axes || axes.length < 4) return { x: 0, y: 0 };
  return { x: axis(axes[2]), y: axis(axes[3]) };
}

function editableEntityFrom(object) {
  let current = object;
  while (current) {
    if (current.userData.holodeck?.editable) return current;
    current = current.parent;
  }
  return null;
}

export function mount({ THREE, scene, camera, rig, renderer, controls }) {
  if (!controls?.getEditableTargets || !controls?.getActionTargets || !controls?.activateActionTarget) {
    throw new Error('Controller block requires the Holodeck controls interface');
  }

  const owner = Symbol('quest-controller');
  const attachments = [];
  const fallbackByGrip = new Map();
  const factory = new XRControllerModelFactory(null, (assetScene) => {
    const fallback = fallbackByGrip.get(assetScene.parent?.parent);
    if (fallback) fallback.visible = false;
  });
  const raycaster = new THREE.Raycaster();
  const rayRotation = new THREE.Matrix4();
  const headBeforeTurn = new THREE.Vector3();
  const headAfterTurn = new THREE.Vector3();
  const eyePosition = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const movement = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  let turnReady = true;
  let leftStickWasPressed = false;
  let rightStickWasPressed = false;
  let leftMenuWasPressed = false;
  let leftXWasPressed = false;
  let reportedLeftSource = null;
  let lastHeightPreset = null;
  let smoothTurning = false;

  function updateRay(controller) {
    controller.updateMatrixWorld(true);
    rayRotation.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(rayRotation);
  }

  function rotateView(angle) {
    camera.getWorldPosition(headBeforeTurn);
    rig.rotation.y -= angle;
    rig.updateMatrixWorld(true);
    camera.getWorldPosition(headAfterTurn);
    rig.position.add(headBeforeTurn.sub(headAfterTurn));
  }

  function release(entry) {
    const grabbed = entry.grabbed;
    if (!grabbed) return;
    grabbed.parent.attach(grabbed.entity);
    grabbed.entity.updateMatrixWorld(true);
    controls.markProgramChanged(grabbed.programId, {
      type: 'entity-transformed',
      entityId: grabbed.entity.userData.holodeck.id,
    });
    controls.message(`${grabbed.entity.userData.holodeck.id} abgelegt · noch nicht gespeichert`);
    entry.grabbed = null;
    entry.ray.scale.z = RAY_LENGTH;
  }

  function onSelectStart(entry) {
    if (entry.controller.userData.holodeckControlOwner !== owner) return;
    updateRay(entry.controller);
    const uiHit = raycaster.intersectObjects(controls.getActionTargets(), true)[0];
    if (uiHit) {
      Promise.resolve(controls.activateActionTarget(uiHit.object)).catch((error) => {
        console.error(error);
        controls.message(`Fehler: ${error.message}`);
      });
      return;
    }

    const objectHit = raycaster.intersectObjects(controls.getEditableTargets(), true)[0];
    const entity = objectHit ? editableEntityFrom(objectHit.object) : null;
    if (entity) {
      const programId = controls.getProgramIdForEntity(entity);
      window.dispatchEvent(new CustomEvent('holodeck-select', {
        detail: { programId, entityId: entity.userData.holodeck.id },
      }));
      controls.message(`${entity.userData.holodeck.id} ausgewählt`);
      return;
    }

    const floorHit = raycaster.intersectObject(controls.floor, false)[0];
    if (floorHit) {
      const cameraPosition = camera.getWorldPosition(new THREE.Vector3());
      rig.position.x += floorHit.point.x - cameraPosition.x;
      rig.position.z += floorHit.point.z - cameraPosition.z;
    }
  }

  function onSqueezeStart(entry) {
    if (entry.controller.userData.holodeckControlOwner !== owner || entry.grabbed) return;
    updateRay(entry.controller);
    const objectHit = raycaster.intersectObjects(controls.getEditableTargets(), true)[0];
    const entity = objectHit ? editableEntityFrom(objectHit.object) : null;
    if (!entity) return;
    entry.grabbed = {
      entity,
      parent: entity.parent,
      programId: controls.getProgramIdForEntity(entity),
    };
    entry.controller.attach(entity);
    entry.ray.scale.z = objectHit.distance;
    controls.message(`${entity.userData.holodeck.id} gegriffen`);
  }

  function dispose() {
    window.removeEventListener('holodeck-before-program-switch', releaseAll);
    window.removeEventListener('holodeck-before-world-replace', releaseAll);
    for (const entry of attachments) {
      release(entry);
      const { controller, grip, ray, model, fallback, listeners } = entry;
      controller.removeEventListener('selectstart', listeners.selectStart);
      controller.removeEventListener('squeezestart', listeners.squeezeStart);
      controller.removeEventListener('squeezeend', listeners.squeezeEnd);
      controller.removeEventListener('disconnected', listeners.disconnected);
      grip.removeEventListener('connected', listeners.gripConnected);
      grip.removeEventListener('disconnected', listeners.gripDisconnected);
      model.dispose();
      grip.remove(model);
      grip.remove(fallback);
      controller.remove(ray);
      ray.geometry.dispose();
      ray.material.dispose();
      fallback.geometry.dispose();
      fallback.material.dispose();
      if (controller.userData.holodeckControlOwner === owner) {
        delete controller.userData.holodeckControlOwner;
        rig.remove(controller);
      }
      if (grip.userData.holodeckControlOwner === owner) {
        delete grip.userData.holodeckControlOwner;
        delete grip.userData.holodeckInputSource;
        rig.remove(grip);
      }
    }
    fallbackByGrip.clear();
  }

  function releaseAll() {
    for (const entry of attachments) release(entry);
  }

  window.addEventListener('holodeck-before-program-switch', releaseAll);
  window.addEventListener('holodeck-before-world-replace', releaseAll);

  try {
    for (let index = 0; index < 2; index += 1) {
      const controller = renderer.xr.getController(index);
      const grip = renderer.xr.getControllerGrip(index);
      const previousSource = grip.userData.holodeckInputSource || null;
      const ray = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]),
        new THREE.LineBasicMaterial({ color: index === 0 ? 0x76f4f0 : 0xc989ff }),
      );
      ray.name = 'controller-ray';
      ray.scale.z = RAY_LENGTH;
      controller.add(ray);

      const fallback = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.08, 0.14),
        new THREE.MeshStandardMaterial({ color: 0x203c52, emissive: index === 0 ? 0x164b4b : 0x3c2452 }),
      );
      fallback.name = 'controller-model-fallback';
      fallback.position.z = 0.04;
      grip.add(fallback);
      fallbackByGrip.set(grip, fallback);
      const model = factory.createControllerModel(grip);
      grip.add(model);

      const entry = { controller, grip, ray, model, fallback, inputSource: previousSource, grabbed: null };
      const listeners = {
        selectStart: () => onSelectStart(entry),
        squeezeStart: () => onSqueezeStart(entry),
        squeezeEnd: () => release(entry),
        disconnected: () => release(entry),
        gripConnected: (event) => {
          entry.inputSource = event.data;
          grip.userData.holodeckInputSource = event.data;
        },
        gripDisconnected: () => {
          entry.inputSource = null;
          if (grip.userData.holodeckControlOwner === owner) delete grip.userData.holodeckInputSource;
        },
      };
      entry.listeners = listeners;
      controller.addEventListener('selectstart', listeners.selectStart);
      controller.addEventListener('squeezestart', listeners.squeezeStart);
      controller.addEventListener('squeezeend', listeners.squeezeEnd);
      controller.addEventListener('disconnected', listeners.disconnected);
      grip.addEventListener('connected', listeners.gripConnected);
      grip.addEventListener('disconnected', listeners.gripDisconnected);
      controller.userData.holodeckControlOwner = owner;
      grip.userData.holodeckControlOwner = owner;
      rig.add(controller, grip);
      attachments.push(entry);

      if (previousSource) model.connect(previousSource);
    }
  } catch (error) {
    dispose();
    throw error;
  }

  return {
    update(deltaTime) {
      if (!renderer.xr.isPresenting) return;
      const left = attachments.find((entry) => entry.inputSource?.handedness === 'left');
      const rightController = attachments.find((entry) => entry.inputSource?.handedness === 'right');
      const leftStickPressed = left?.inputSource?.gamepad?.buttons?.[3]?.pressed === true;
      const rightStickPressed = rightController?.inputSource?.gamepad?.buttons?.[3]?.pressed === true;
      const leftButtons = left?.inputSource?.gamepad?.buttons;
      if (left?.inputSource && reportedLeftSource !== left.inputSource) {
        reportedLeftSource = left.inputSource;
        controls.message(leftButtons?.[7]
          ? 'Linke Menütaste erkannt · Y als Ersatz möglich'
          : 'Linke Menütaste nicht verfügbar · Y als Ersatz');
      }
      const leftMenuPressed = leftButtons?.[7]?.pressed === true || leftButtons?.[5]?.pressed === true;
      const leftXPressed = leftButtons?.[4]?.pressed === true;
      if (leftMenuPressed && !leftMenuWasPressed) {
        window.dispatchEvent(new Event('holodeck-toggle-program-explorer'));
      }
      if (leftXPressed && !leftXWasPressed) {
        window.dispatchEvent(new Event('holodeck-toggle-object-palette'));
      }
      leftMenuWasPressed = leftMenuPressed;
      leftXWasPressed = leftXPressed;
      const held = attachments.find((entry) => entry.grabbed);
      if (leftStickPressed && !leftStickWasPressed) {
        camera.getWorldPosition(eyePosition);
        const nextPreset = lastHeightPreset === null
          ? (eyePosition.y < (SEATED_EYE_HEIGHT + STANDING_EYE_HEIGHT) / 2 ? 'standing' : 'seated')
          : (lastHeightPreset === 'seated' ? 'standing' : 'seated');
        const targetHeight = nextPreset === 'seated' ? SEATED_EYE_HEIGHT : STANDING_EYE_HEIGHT;
        rig.position.y += targetHeight - eyePosition.y;
        lastHeightPreset = nextPreset;
        controls.message(`${nextPreset === 'seated' ? 'Sitzhöhe' : 'Stehhöhe'} aktiviert`);
      }
      leftStickWasPressed = leftStickPressed;
      if (rightStickPressed && !rightStickWasPressed) {
        smoothTurning = !smoothTurning;
        controls.message(smoothTurning ? 'Weiches Drehen aktiviert' : 'Rasterdrehung aktiviert');
      }
      rightStickWasPressed = rightStickPressed;

      const move = stick(left?.inputSource);
      if (move.x || move.y) {
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        right.crossVectors(forward, up);
        movement.copy(forward).multiplyScalar(-move.y).addScaledVector(right, move.x);
        if (movement.lengthSq() > 1) movement.normalize();
        rig.position.addScaledVector(movement, MOVE_SPEED * deltaTime);
        rig.position.x = THREE.MathUtils.clamp(rig.position.x, -28, 28);
        rig.position.z = THREE.MathUtils.clamp(rig.position.z, -28, 28);
      }

      const rightStick = stick(rightController?.inputSource);
      if (held && rightStick.y) {
        const distance = THREE.MathUtils.clamp(-held.grabbed.entity.position.z - rightStick.y * HELD_DISTANCE_SPEED * deltaTime, 0.35, 12);
        held.grabbed.entity.position.z = -distance;
      } else if (!held) {
        rig.position.y -= rightStick.y * ELEVATE_SPEED * deltaTime;
      }
      const turn = rightStick.x;
      if (smoothTurning) {
        if (turn) rotateView(turn * Math.abs(turn) * SMOOTH_TURN_SPEED * deltaTime);
      } else {
        if (Math.abs(turn) < 0.25) turnReady = true;
        if (turnReady && Math.abs(turn) > 0.7) {
          rotateView(Math.sign(turn) * TURN_ANGLE);
          turnReady = false;
        }
      }
    },
    dispose,
  };
}
