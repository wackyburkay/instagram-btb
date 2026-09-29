// Safari only. Safari ignores "world": "MAIN" in the manifest, so page.js is
// loaded into Instagram's page context with a <script> tag instead. It has to
// run there to share the page's cookies and see its GraphQL traffic.
(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  const script = document.createElement("script");
  script.src = api.runtime.getURL("src/page.js");
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
})();
