const api = globalThis.browser ?? globalThis.chrome;

const $ = (id) => document.getElementById(id);
const els = {
  session: $("session"),
  app: $("app"),
  form: $("lookup-form"),
  query: $("query"),
  lookupBtn: $("lookup-btn"),
  manual: $("manual"),
  confirm: $("confirm"),
  pic: $("target-pic"),
  initial: $("target-initial"),
  blockedBadge: $("blocked-badge"),
  attempts: $("attempts"),
  attemptList: $("attempt-list"),
  name: $("target-name"),
  id: $("target-id"),
  blockBtn: $("block-btn"),
  message: $("message"),
  diag: $("diag"),
  idHelp: $("id-help"),
  helpUrl: $("help-url"),
};

let tabId = null;
let target = null;

function setMessage(text, kind = "") {
  els.message.textContent = text || "";
  els.message.className = kind;
}

async function send(type, payload) {
  try {
    const res = await api.tabs.sendMessage(tabId, { target: "igbtb", type, payload });
    if (!res) return { ok: false, error: "No response from the Instagram tab. Reload it and try again." };
    return res;
  } catch {
    return { ok: false, error: "Can't reach the Instagram tab. Reload it (the extension may have been installed after it opened)." };
  }
}

async function init() {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  if (!tab || !/^https:\/\/www\.instagram\.com\//.test(tab.url || "")) {
    els.session.textContent = "Open instagram.com in this tab, log in, then click the extension again.";
    return;
  }
  tabId = tab.id;

  const res = await send("status");
  if (!res.ok) {
    els.session.textContent = res.error;
    return;
  }
  const s = res.result;
  if (!s.loggedIn) {
    els.session.textContent = "You don't seem to be logged in to Instagram in this tab.";
    return;
  }

  els.session.textContent = s.missing.length
    ? "Logged in, but some session values are missing (" + s.missing.join(", ") + "). Scroll or click around Instagram for a moment, then reopen this popup."
    : "Connected to your Instagram session.";
  els.diag.textContent =
    "doc_id " + s.docId + " (" + s.docIdSource + ") · " + s.sniffedCount + " values captured from page traffic";
  els.app.hidden = false;
  els.query.focus();
}

function showInitial() {
  els.pic.hidden = true;
  els.pic.removeAttribute("src");
  els.initial.hidden = false;
}

els.pic.addEventListener("error", showInitial);

let avatarObjectUrl = null;

// Instagram's CDN refuses to serve avatars to other origins, so an <img> pointing
// at picUrl breaks. The extension's own fetch is allowed through by the CDN host
// permissions; we show the result as a blob URL.
async function loadAvatar(user) {
  if (!user.picUrl) return;
  try {
    const res = await fetch(user.picUrl, { credentials: "omit", referrerPolicy: "no-referrer" });
    if (!res.ok) return;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/") || target !== user) return;
    if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
    avatarObjectUrl = URL.createObjectURL(blob);
    els.pic.src = avatarObjectUrl;
    els.pic.hidden = false;
    els.initial.hidden = true;
  } catch {
    // Keep the initial; the avatar is only cosmetic.
  }
}

function showTarget(user) {
  target = user;
  els.name.textContent = user.username ? "@" + user.username + (user.fullName ? " · " + user.fullName : "") : "User ID only";
  els.id.textContent = "ID " + user.id + " · found via " + user.source;
  if (user.verified === false) {
    els.blockedBadge.textContent = "Likely blocked you. ID read from the profile page without a username match, so double-check Blocked accounts afterwards.";
    els.blockedBadge.className = "badge warn";
  } else {
    els.blockedBadge.textContent = "Hidden from your account: likely blocked you";
    els.blockedBadge.className = "badge";
  }
  els.blockedBadge.hidden = !user.blockedYou;
  els.initial.textContent = (user.username || "?").charAt(0);
  showInitial();
  loadAvatar(user);
  els.confirm.hidden = false;
  els.blockBtn.disabled = false;
}

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMessage("");
  els.confirm.hidden = true;
  els.manual.hidden = true;
  target = null;

  els.lookupBtn.disabled = true;
  const res = await send("resolveUser", els.query.value);
  els.lookupBtn.disabled = false;

  if (!res.ok) return setMessage(res.error, "error");
  showAttempts(res.result.attempts);
  if (!res.result.user) {
    // Fill the help steps with the username that wasn't found and open them.
    const username = els.query.value.trim().replace(/^@/, "");
    els.helpUrl.textContent = "instagram.com/" + username + "/";
    els.idHelp.open = true;
    els.manual.hidden = false;
    els.query.select();
    return;
  }
  showTarget(res.result.user);
});

function showAttempts(attempts) {
  els.attemptList.replaceChildren(
    ...attempts.map((a) => {
      const li = document.createElement("li");
      li.textContent = a.method + ": " + a.outcome;
      return li;
    })
  );
  els.attempts.hidden = attempts.length === 0;
}

els.query.addEventListener("input", () => {
  els.confirm.hidden = true;
  target = null;
});

els.blockBtn.addEventListener("click", async () => {
  if (!target) return;
  els.blockBtn.disabled = true;
  setMessage("Blocking…");

  const res = await send("block", target.id);
  if (!res.ok) {
    els.blockBtn.disabled = false;
    return setMessage(res.error, "error");
  }
  setMessage("Done. Check Settings → Blocked accounts on Instagram to confirm.", "ok");
});

init();
