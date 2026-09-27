import { Client } from "@colyseus/sdk";

const endpoint = "wss://colyseus.deckeins.de";
const instanceId = "main";

let activeRoom = null;
let connectRevision = 0;
let applyingRemote = false;

function setNetworkState(message, state) {
  const element = document.querySelector("#network-state");
  if (!element) return;
  element.textContent = message;
  element.dataset.state = state;
}

async function requestTicket(worldId) {
  const response = await fetch("/api/colyseus-ticket", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ worldId, instanceId }),
  });
  if (!response.ok) throw new Error(`Ticket request failed (${response.status})`);
  const data = await response.json();
  if (typeof data.ticket !== "string") throw new Error("Ticket response is invalid");
  return data.ticket;
}

function applyRoomState(room) {
  const runtime = window.holodeckRuntime;
  const entities = room.state?.entities;
  if (!runtime || !entities) return;

  applyingRemote = true;
  try {
    entities.forEach((entity, id) => {
      const position = [entity.x, entity.y, entity.z];
      if (runtime.getEntity(id)) runtime.setEntityTransform({ entityId: id, position });
      else runtime.createPrimitive({ id, type: entity.archetype === "sphere" ? "sphere" : "box", position });
    });
  } finally {
    applyingRemote = false;
  }
}

async function connect(worldId) {
  const revision = ++connectRevision;
  setNetworkState("Mehrspieler-Verbindung wird hergestellt", "connecting");
  if (activeRoom) {
    void activeRoom.leave();
    activeRoom = null;
  }

  try {
    const ticket = await requestTicket(worldId);
    const client = new Client(endpoint);
    client.auth.token = ticket;
    const room = await client.joinOrCreate("world", { worldId, instanceId });
    if (revision !== connectRevision) {
      void room.leave();
      return;
    }

    activeRoom = room;
    room.onStateChange(() => applyRoomState(room));
    room.onLeave(() => {
      if (activeRoom === room) setNetworkState("Mehrspieler-Verbindung beendet", "error");
    });
    room.onError(() => {
      if (activeRoom === room) setNetworkState("Mehrspieler-Verbindung gestört", "error");
    });
    applyRoomState(room);
    setNetworkState("Mehrspieler verbunden", "connected");
  } catch (error) {
    console.error("Holodeck multiplayer connection failed", error);
    if (revision === connectRevision) setNetworkState("Mehrspieler nicht erreichbar", "error");
  }
}

function connectCurrentProgram() {
  const worldId = window.holodeckRuntime?.getActiveProgramId();
  if (worldId) void connect(worldId);
}

function onLocalChange(event) {
  if (applyingRemote || !activeRoom) return;
  const { type, entityId } = event.detail ?? {};
  if (!entityId) return;
  const entity = window.holodeckRuntime?.getEntity(entityId);
  if (!entity || entity.origin !== "user") return;
  const [x, y, z] = entity.position;
  if (type === "entity-created") {
    activeRoom.send("entity.spawn", { id: entity.id, archetype: entity.type, x, y, z });
  } else if (type === "entity-transformed") {
    activeRoom.send("entity.move", { id: entity.id, x, y, z });
  }
}

window.addEventListener("holodeck-ready", connectCurrentProgram);
window.addEventListener("holodeck-program-switch", connectCurrentProgram);
window.addEventListener("holodeck-change", onLocalChange);
window.addEventListener("pagehide", () => {
  connectRevision += 1;
  if (activeRoom) void activeRoom.leave();
}, { once: true });

const runtimeScript = document.createElement("script");
runtimeScript.type = "module";
runtimeScript.src = "/core/app.js";
runtimeScript.dataset.holodeckRuntime = "true";
document.body.appendChild(runtimeScript);
