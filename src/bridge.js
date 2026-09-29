// Isolated-world content script: relays messages between the popup
// (extension runtime) and page.js (Instagram's page context).
(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  const FROM_BRIDGE = "igbtb-bridge";
  const FROM_PAGE = "igbtb-page";
  const TIMEOUT_MS = 20000;

  let nextId = 1;
  const pending = new Map();

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    const msg = event.data;
    if (!msg || msg.source !== FROM_PAGE || !pending.has(msg.id)) return;
    const { resolve, timer } = pending.get(msg.id);
    clearTimeout(timer);
    pending.delete(msg.id);
    resolve(msg.ok ? { ok: true, result: msg.result } : { ok: false, error: msg.error });
  });

  function callPage(type, payload) {
    return new Promise((resolve) => {
      const id = nextId++;
      const timer = setTimeout(() => {
        pending.delete(id);
        resolve({ ok: false, error: "The Instagram tab did not respond. Reload it and try again." });
      }, TIMEOUT_MS);
      pending.set(id, { resolve, timer });
      window.postMessage({ source: FROM_BRIDGE, id, type, payload }, location.origin);
    });
  }

  api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || msg.target !== "igbtb") return;
    callPage(msg.type, msg.payload).then(sendResponse);
    return true; // keep sendResponse alive for the async reply
  });
})();
