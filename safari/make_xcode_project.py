#!/usr/bin/env python3
"""Turn the Safari build of the extension into an Xcode project, then open it.

Works both in the repository (converts dist/safari/) and in the extracted
release package (converts the extension/ folder next to this script).

Usage:
    python3 make_xcode_project.py [EXTENSION_DIR] [--output DIR]
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

APP_NAME = "Block the Blocker"
BUNDLE_ID = "com.wackyburkay.instagram-btb"
EXTENSION_ID = BUNDLE_ID + ".Extension"
HERE = Path(__file__).resolve().parent


def default_paths():
    """Return (extension dir, output dir) for the release package or the repo."""
    if (HERE / "extension" / "manifest.json").exists():
        return HERE / "extension", HERE / "xcode"
    repo_dist = HERE.parent / "dist"
    return repo_dist / "safari", repo_dist / "safari-xcode"


def fix_bundle_ids(output):
    """Give the app and the extension matching bundle IDs.

    The converter derives the app's ID from the app name, so the extension's ID
    doesn't start with the app's and Xcode refuses to embed it ("Embedded
    binary's bundle identifier is not prefixed with the parent app's bundle
    identifier"). Rewrite both: the app gets BUNDLE_ID, the extension gets
    BUNDLE_ID.Extension.
    """
    pbxproj = next(output.glob("**/*.xcodeproj/project.pbxproj"))
    text = pbxproj.read_text(encoding="utf-8")
    pattern = re.compile(r"PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);")
    found = sorted({m.group(1).strip('"') for m in pattern.finditer(text)})

    extension_ids = [v for v in found if v.split(".")[-1] == "Extension"]
    if len(found) != 2 or len(extension_ids) != 1:
        sys.exit(
            "Couldn't tell the app and extension bundle IDs apart (found: "
            + ", ".join(found)
            + "). In Xcode, set the app target's Bundle Identifier to "
            + BUNDLE_ID + " and the extension target's to " + EXTENSION_ID + "."
        )

    def replace(match):
        old = match.group(1).strip('"')
        return "PRODUCT_BUNDLE_IDENTIFIER = " + (EXTENSION_ID if old in extension_ids else BUNDLE_ID) + ";"

    pbxproj.write_text(pattern.sub(replace, text), encoding="utf-8")
    fix_app_code(output)
    return pbxproj.parent


def fix_app_code(output):
    """Point the app's Swift code at the renamed extension.

    The generated app calls SFSafariApplication.showPreferencesForExtension with a
    hard-coded extensionBundleIdentifier. If it doesn't match the extension's
    real ID, the app's "Quit and Open Safari Settings" button silently does nothing.
    """
    pattern = re.compile(r'(let extensionBundleIdentifier\s*=\s*)"([^"]*)"')
    fixed = False
    for swift in output.glob("**/*.swift"):
        text = swift.read_text(encoding="utf-8")
        match = pattern.search(text)
        if not match:
            continue
        print(f"{swift.name}: extensionBundleIdentifier {match.group(2)} -> {EXTENSION_ID}")
        swift.write_text(pattern.sub(lambda m: m.group(1) + '"' + EXTENSION_ID + '"', text), encoding="utf-8")
        fixed = True
    if not fixed:
        print(
            "Warning: no extensionBundleIdentifier found in the app's Swift code. If the app's "
            "Safari Settings button does nothing, set it to " + EXTENSION_ID + " in ViewController.swift."
        )


def set_app_icon(output, extension):
    """Replace the Mac app's icon with the square version of the icon.

    The converter fills the app's AppIcon from the extension's rounded icons, and
    macOS shrinks an icon with transparent rounded corners into a grey frame.
    macOS rounds app icons itself, so give every slot the full-bleed square
    (resized with sips, which ships with macOS).
    """
    square = extension / "icons" / "app-icon-1024.png"
    iconsets = list(output.glob("**/AppIcon.appiconset"))
    if not square.exists() or not iconsets:
        print("Warning: couldn't set the square app icon; the app keeps the converter's icon.")
        return
    for iconset in iconsets:
        contents = json.loads((iconset / "Contents.json").read_text(encoding="utf-8"))
        for image in contents.get("images", []):
            points = float(image.get("size", "1024x1024").split("x")[0])
            scale = float(image.get("scale", "1x").rstrip("x"))
            pixels = str(round(points * scale))
            # Fill empty slots too, so every size comes from the square icon.
            image.setdefault("filename", f"app-icon-{pixels}.png")
            subprocess.run(
                ["sips", "-z", pixels, pixels, str(square), "--out", str(iconset / image["filename"])],
                check=True,
                stdout=subprocess.DEVNULL,
            )
        (iconset / "Contents.json").write_text(json.dumps(contents, indent=2) + "\n", encoding="utf-8")
        print(f"App icon set from {square.name} ({len(contents.get('images', []))} sizes)")


def main():
    ext_default, out_default = default_paths()
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("extension", nargs="?", type=Path, default=ext_default, help="Safari extension folder")
    parser.add_argument("--output", type=Path, default=out_default, help="where to create the Xcode project")
    parser.add_argument("--no-open", action="store_true", help="don't open the project in Xcode")
    args = parser.parse_args()

    if sys.platform != "darwin":
        sys.exit("This needs macOS with Xcode installed.")
    if not (args.extension / "manifest.json").exists():
        sys.exit(f"No manifest.json in {args.extension}. Run scripts/build_safari.py first.")

    subprocess.run(
        [
            "xcrun", "safari-web-extension-converter", str(args.extension),
            "--project-location", str(args.output),
            "--app-name", APP_NAME,
            "--bundle-identifier", BUNDLE_ID,
            "--macos-only",
            "--copy-resources",
            "--no-open",
            "--no-prompt",
            "--force",
        ],
        check=True,
    )
    xcodeproj = fix_bundle_ids(args.output)
    set_app_icon(args.output, args.extension)
    print(f"Xcode project: {xcodeproj}")
    if not args.no_open:
        subprocess.run(["open", str(xcodeproj)], check=True)


if __name__ == "__main__":
    main()
