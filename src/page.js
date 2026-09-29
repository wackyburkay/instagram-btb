// Runs in Instagram's own page context (world: MAIN), so requests carry the
// session cookies and look exactly like the ones the web app makes itself.
// Talks to bridge.js over window.postMessage; has no access to extension APIs.
(() => {
  if (window.__igbtb) return;
  window.__igbtb = true;

  const FROM_BRIDGE = "igbtb-bridge";
  const FROM_PAGE = "igbtb-page";

  const APP_ID = "936619743392459";
  const BLOCK_FRIENDLY_NAME = "usePolarisBlockManyMutation";
  const DEFAULT_BLOCK_DOC_ID = "9575321849242740";
  const DOC_ID_KEY = "igbtb:blockDocId";

  // Request parameters Instagram attaches to every GraphQL call. We copy them
  // from the page's own traffic, which is fresher than anything scraped from HTML.
  const SNIFF_KEYS = [
    "av", "__s", "__hsi", "__rev", "__spin_r", "__spin_b", "__spin_t",
    "__comet_req", "__ccg", "__crn", "dpr", "fb_dtsg", "jazoest", "lsd",
  ];
  const sniffed = {};

  const nativeFetch = window.fetch.bind(window);

  // ---------------------------------------------------------------------------
  // Traffic sniffing

  function isGraphqlUrl(url) {
    return /\/(graphql\/query|api\/graphql)\/?(\?|$)/.test(String(url || ""));
  }

  function sniff(url, body) {
    if (!isGraphqlUrl(url)) return;
    let params;
    if (typeof body === "string") params = new URLSearchParams(body);
    else if (body instanceof URLSearchParams) params = body;
    else return;

    for (const key of SNIFF_KEYS) {
      if (params.has(key)) sniffed[key] = params.get(key);
    }
    // Instagram rotates doc_ids; remember the current one whenever the web app
    // performs a normal block itself.
    if (params.get("fb_api_req_friendly_name") === BLOCK_FRIENDLY_NAME && params.get("doc_id")) {
      try { localStorage.setItem(DOC_ID_KEY, params.get("doc_id")); } catch {}
    }
  }

  window.fetch = function (input, init) {
    try {
      const url = typeof input === "string" ? input : input && input.url;
      sniff(url, init && init.body);
    } catch {}
    return nativeFetch(input, init);
  };

  const nativeOpen = XMLHttpRequest.prototype.open;
  const nativeSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__igbtbUrl = url;
    return nativeOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    try { sniff(this.__igbtbUrl, body); } catch {}
    return nativeSend.apply(this, arguments);
  };

  // ---------------------------------------------------------------------------
  // Token discovery

  function getCookie(name) {
    const match = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function scrapeScripts() {
    const text = Array.from(document.scripts, (s) => s.textContent).join("\n");
    const find = (...patterns) => {
      for (const re of patterns) {
        const m = text.match(re);
        if (m) return m[1];
      }
      return null;
    };
    return {
      fb_dtsg: find(/"DTSGInitialData",\[\],\{"token":"([^"]+)"/, /"dtsg":\{"token":"([^"]+)"/),
      lsd: find(/"LSD",\[\],\{"token":"([^"]+)"/),
      __hsi: find(/"hsi":"(\d+)"/),
      __spin_r: find(/"__spin_r":(\d+)/),
      __spin_b: find(/"__spin_b":"([^"]+)"/),
      __spin_t: find(/"__spin_t":(\d+)/),
      __rev: find(/"server_revision":(\d+)/, /"__spin_r":(\d+)/),
    };
  }

  function fromRequire(moduleName) {
    try {
      const mod = typeof window.require === "function" && window.require(moduleName);
      return (mod && mod.token) || null;
    } catch {
      return null;
    }
  }

  // Instagram's anti-CSRF checksum: "2" followed by the sum of fb_dtsg's char codes.
  function computeJazoest(dtsg) {
    let sum = 0;
    for (let i = 0; i < dtsg.length; i++) sum += dtsg.charCodeAt(i);
    return "2" + sum;
  }

  function collectTokens() {
    const scraped = scrapeScripts();
    const pick = (key, ...fallbacks) => sniffed[key] || fallbacks.find(Boolean) || null;

    const viewerId = getCookie("ds_user_id");
    const fb_dtsg = pick("fb_dtsg", fromRequire("DTSGInitialData"), scraped.fb_dtsg);
    const lsd = pick("lsd", fromRequire("LSD"), scraped.lsd);

    let docId = null;
    try { docId = localStorage.getItem(DOC_ID_KEY); } catch {}

    return {
      csrftoken: getCookie("csrftoken"),
      viewerId,
      av: pick("av", viewerId),
      fb_dtsg,
      lsd,
      jazoest: pick("jazoest", fb_dtsg && computeJazoest(fb_dtsg)),
      __s: pick("__s"),
      __hsi: pick("__hsi", scraped.__hsi),
      __rev: pick("__rev", scraped.__rev),
      __spin_r: pick("__spin_r", scraped.__spin_r),
      __spin_b: pick("__spin_b", scraped.__spin_b, "trunk"),
      __spin_t: pick("__spin_t", scraped.__spin_t, String(Math.floor(Date.now() / 1000))),
      __comet_req: pick("__comet_req", "7"),
      __ccg: pick("__ccg", "EXCELLENT"),
      dpr: pick("dpr", String(window.devicePixelRatio || 1)),
      docId: docId || DEFAULT_BLOCK_DOC_ID,
      docIdSource: docId ? "captured" : "default",
    };
  }

  // ---------------------------------------------------------------------------
  // Actions

  function status() {
    const t = collectTokens();
    const required = ["csrftoken", "viewerId", "fb_dtsg", "lsd"];
    return {
      loggedIn: Boolean(t.viewerId),
      missing: required.filter((k) => !t[k]),
      sniffedCount: Object.keys(sniffed).length,
      docId: t.docId,
      docIdSource: t.docIdSource,
    };
  }

  async function igGetJson(url) {
    const res = await nativeFetch(url, {
      credentials: "include",
      headers: {
        "x-ig-app-id": APP_ID,
        "x-requested-with": "XMLHttpRequest",
        "x-csrftoken": getCookie("csrftoken") || "",
      },
      redirect: "manual", // a redirect here means "log in first"
    });
    if (res.type === "opaqueredirect") throw new Error("redirected to login");
    if (res.status === 429) throw new Error("HTTP 429 (rate limited or hidden)");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("non-JSON response");
    }
  }

  function profileLookup(query) {
    return async () => {
      const j = await igGetJson("/api/v1/users/web_profile_info/?username=" + encodeURIComponent(query));
      const u = j && j.data && j.data.user;
      if (!u || !u.id) return null;
      return { id: String(u.id), username: u.username, fullName: u.full_name, picUrl: u.profile_pic_url };
    };
  }

  function searchLookup(query) {
    return async () => {
      const j = await igGetJson("/web/search/topsearch/?context=blended&include_reel=false&query=" + encodeURIComponent(query));
      const hit = ((j && j.users) || [])
        .map((entry) => entry.user)
        .find((u) => u && String(u.username).toLowerCase() === query.toLowerCase());
      const id = hit && (hit.pk || hit.pk_id || hit.id);
      if (!id) return null;
      return { id: String(id), username: hit.username, fullName: hit.full_name, picUrl: hit.profile_pic_url };
    };
  }

  // Loads the profile page the way a private window does: no cookies, so the
  // block on your account doesn't apply. The logged-out page embeds the profile
  // query result, e.g. "xig_user_by_username":{"pk":"25025320","username":"instagram",...}.
  // Accept: text/html matters; without it Instagram leaves that result out.
  function loggedOutPageLookup(query) {
    return async () => {
      const res = await nativeFetch("/" + encodeURIComponent(query) + "/", {
        credentials: "omit",
        headers: { accept: "text/html,application/xhtml+xml" },
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const html = await res.text();
      if (html.includes("PolarisErrorRoot")) throw new Error("no such account (or Instagram served an error page)");

      const m = html.match(/"xig_user_by_username":\{"pk":"(\d+)","username":"([^"]+)"/);
      if (!m) {
        // Only the route ID is available; it isn't tied to the username in the page.
        const route = html.match(/"profile_id":"(\d+)"/);
        return route ? { id: route[1], username: query, verified: false } : null;
      }
      if (m[2].toLowerCase() !== query.toLowerCase()) throw new Error("page is for @" + m[2]);

      // Pull the picture from the same object; the page escapes "/" as "\/".
      const rest = html.slice(m.index, m.index + 2000);
      const pic = rest.match(/"profile_pic_url":"((?:[^"\\]|\\.)*)"/);
      let picUrl = null;
      try { picUrl = pic && JSON.parse('"' + pic[1] + '"'); } catch {}
      return { id: m[1], username: m[2], picUrl, verified: true };
    };
  }

  // Returns { user, attempts }. `user` is { id, username, fullName, picUrl,
  // source, blockedYou } or null; `attempts` records what each method returned
  // so failures can be diagnosed from the popup.
  async function resolveUser(rawInput) {
    const query = String(rawInput || "").trim().replace(/^@/, "");
    if (!query) throw new Error("Enter a username or numeric user ID.");
    if (/^\d+$/.test(query)) {
      return { user: { id: query, username: null, source: "manual-id" }, attempts: [] };
    }
    if (!/^[A-Za-z0-9._]{1,30}$/.test(query)) throw new Error("That doesn't look like an Instagram username.");

    const methods = [
      ["profile", profileLookup(query)],
      ["search", searchLookup(query)],
      ["logged-out-page", loggedOutPageLookup(query)],
    ];

    const attempts = [];
    for (const [name, run] of methods) {
      try {
        const user = await run();
        attempts.push({ method: name, outcome: user ? "found" : "not found" });
        if (user) {
          // Visible logged out but not to you: that's what being blocked looks like.
          user.blockedYou = name === "logged-out-page";
          user.source = name;
          return { user, attempts };
        }
      } catch (err) {
        attempts.push({ method: name, outcome: (err && err.message) || "failed" });
      }
    }
    return { user: null, attempts };
  }

  async function block(targetId) {
    targetId = String(targetId || "").trim();
    if (!/^\d+$/.test(targetId)) throw new Error("Target user ID must be numeric.");

    const t = collectTokens();
    const missing = ["csrftoken", "viewerId", "fb_dtsg", "lsd"].filter((k) => !t[k]);
    if (missing.length) {
      throw new Error("Missing session values: " + missing.join(", ") + ". Reload Instagram and try again.");
    }
    if (targetId === t.viewerId) throw new Error("That is your own user ID.");

    const body = new URLSearchParams({
      av: t.av,
      __d: "www",
      __user: t.viewerId,
      __a: "1",
      __req: "1",
      dpr: t.dpr,
      __ccg: t.__ccg,
      __comet_req: t.__comet_req,
      fb_dtsg: t.fb_dtsg,
      jazoest: t.jazoest,
      lsd: t.lsd,
      __spin_b: t.__spin_b,
      __spin_t: t.__spin_t,
      __crn: "comet.igweb.PolarisProfilePostsTabRoute",
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: BLOCK_FRIENDLY_NAME,
      variables: JSON.stringify({ target_user_ids: [targetId] }),
      server_timestamps: "true",
      doc_id: t.docId,
    });
    for (const key of ["__s", "__hsi", "__rev", "__spin_r"]) {
      if (t[key]) body.set(key, t[key]);
    }

    const res = await nativeFetch("/graphql/query/", {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-csrftoken": t.csrftoken,
        "x-fb-lsd": t.lsd,
        "x-ig-app-id": APP_ID,
        "x-fb-friendly-name": BLOCK_FRIENDLY_NAME,
        "x-root-field-name": "xdt_block_many",
      },
      body: body.toString(),
    });

    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text.replace(/^for \(;;\);/, "")); } catch {}

    if (!res.ok) throw new Error("Instagram returned HTTP " + res.status + ".");
    if (!json) throw new Error("Unexpected response from Instagram (not JSON).");
    if (json.errors && json.errors.length) {
      throw new Error(json.errors.map((e) => e.message || e.summary || "Unknown error").join("; "));
    }
    if (!json.data || !("xdt_block_many" in json.data)) {
      throw new Error("Instagram did not confirm the block. The API may have changed (doc_id " + t.docId + ").");
    }
    return { targetId, docIdSource: t.docIdSource, response: json.data.xdt_block_many };
  }

  const handlers = { status, resolveUser, block };

  window.addEventListener("message", async (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    const msg = event.data;
    if (!msg || msg.source !== FROM_BRIDGE || !handlers[msg.type]) return;

    const reply = { source: FROM_PAGE, id: msg.id };
    try {
      reply.ok = true;
      reply.result = await handlers[msg.type](msg.payload);
    } catch (err) {
      reply.ok = false;
      reply.error = (err && err.message) || String(err);
    }
    window.postMessage(reply, location.origin);
  });
})();
