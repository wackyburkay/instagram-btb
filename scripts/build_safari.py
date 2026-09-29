#!/usr/bin/env python3
"""Build the Safari version of the extension.

Safari doesn't support "world": "MAIN" in manifest content scripts, so the
Safari build swaps that entry for safari/inject.js, which loads src/page.js into
the page with a <script> tag. Everything else is shared with the other browsers.

Usage:
    python3 scripts/build_safari.py            # writes dist/safari/
    python3 scripts/build_safari.py --xcode    # also creates the Xcode project (macOS)
"""

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "dist" / "safari"
XCODE_OUT = ROOT / "dist" / "safari-xcode"
INSTAGRAM = "https://www.instagram.com/*"


def safari_manifest(manifest):
    manifest = json.loads(json.dumps(manifest))  # deep copy
    manifest.pop("browser_specific_settings", None)

    scripts = [cs for cs in manifest["content_scripts"] if cs.get("world") != "MAIN"]
    if len(scripts) == len(manifest["content_scripts"]):
        sys.exit("manifest.json has no MAIN-world content script; build_safari.py needs updating")
    scripts.insert(0, {"matches": [INSTAGRAM], "js": ["src/inject.js"], "run_at": "document_start"})
    manifest["content_scripts"] = scripts

    # inject.js loads page.js by URL, so the page must be allowed to fetch it.
    manifest["web_accessible_resources"] = [{"resources": ["src/page.js"], "matches": [INSTAGRAM]}]
    # Lets the popup read the active tab's URL to check it's on Instagram.
    hosts = manifest.setdefault("host_permissions", [])
    if INSTAGRAM not in hosts:
        hosts.insert(0, INSTAGRAM)
    return manifest


def build():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(ROOT / "src", OUT / "src")
    shutil.copytree(ROOT / "popup", OUT / "popup")
    shutil.copy2(ROOT / "safari" / "inject.js", OUT / "src" / "inject.js")

    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    (OUT / "manifest.json").write_text(
        json.dumps(safari_manifest(manifest), indent=2) + "\n", encoding="utf-8"
    )
    print(f"Safari extension written to {OUT.relative_to(ROOT).as_posix()}/")


def xcode():
    if sys.platform != "darwin":
        sys.exit("--xcode needs macOS with Xcode installed")
    subprocess.run(
        [
            "xcrun", "safari-web-extension-converter", str(OUT),
            "--project-location", str(XCODE_OUT),
            "--app-name", "Block the Blocker",
            "--bundle-identifier", "com.wackyburkay.instagram-btb",
            "--macos-only",
            "--copy-resources",
            "--no-prompt",
            "--force",
        ],
        check=True,
    )
    print(f"Xcode project written to {XCODE_OUT.relative_to(ROOT).as_posix()}/")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--xcode", action="store_true", help="also create the Xcode project (macOS only)")
    args = parser.parse_args()
    build()
    if args.xcode:
        xcode()
