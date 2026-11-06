#!/usr/bin/env python3
"""Generate Android launcher resources from the repository's sunflower icon."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "icons" / "icon-512.png"
RES = ROOT / "android" / "app" / "src" / "main" / "res"

if not SOURCE.is_file():
    raise SystemExit(f"Icon source not found: {SOURCE}")

with Image.open(SOURCE) as opened:
    source = opened.convert("RGBA")

if source.size != (512, 512):
    source = source.resize((512, 512), Image.Resampling.LANCZOS)

# Android legacy launcher icon sizes and adaptive foreground canvas sizes.
densities = {
    "mdpi": (48, 108),
    "hdpi": (72, 162),
    "xhdpi": (96, 216),
    "xxhdpi": (144, 324),
    "xxxhdpi": (192, 432),
}

for density, (legacy_size, adaptive_size) in densities.items():
    folder = RES / f"mipmap-{density}"
    folder.mkdir(parents=True, exist_ok=True)

    legacy = source.resize((legacy_size, legacy_size), Image.Resampling.LANCZOS)
    legacy.save(folder / "ic_launcher.png", optimize=True)
    legacy.save(folder / "ic_launcher_round.png", optimize=True)

    # Keep the artwork inside Android's adaptive-icon safe area.
    artwork_size = round(adaptive_size * 2 / 3)
    artwork = source.resize((artwork_size, artwork_size), Image.Resampling.LANCZOS)
    foreground = Image.new("RGBA", (adaptive_size, adaptive_size), (0, 0, 0, 0))
    offset = ((adaptive_size - artwork_size) // 2, (adaptive_size - artwork_size) // 2)
    foreground.alpha_composite(artwork, offset)
    foreground.save(folder / "ic_launcher_foreground.png", optimize=True)

adaptive_dir = RES / "mipmap-anydpi-v26"
adaptive_dir.mkdir(parents=True, exist_ok=True)
adaptive_xml = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/odb_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
"""
(adaptive_dir / "ic_launcher.xml").write_text(adaptive_xml, encoding="utf-8")
(adaptive_dir / "ic_launcher_round.xml").write_text(adaptive_xml, encoding="utf-8")

values_dir = RES / "values"
values_dir.mkdir(parents=True, exist_ok=True)
(values_dir / "odb_launcher_background.xml").write_text(
    """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="odb_launcher_background">#10131c</color>
</resources>
""",
    encoding="utf-8",
)

print("Sunflower launcher icons generated for all Android densities.")
