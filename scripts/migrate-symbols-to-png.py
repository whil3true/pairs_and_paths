from pathlib import Path
import cairosvg
from PIL import Image

SOURCE = Path("public/assets/symbols")
names = sorted(p.stem for p in SOURCE.glob("*.svg"))
if len(names) != 30:
    raise SystemExit(f"expected 30 SVG symbols, found {len(names)}")

for name in names:
    svg = SOURCE / f"{name}.svg"
    png = SOURCE / f"{name}.png"
    cairosvg.svg2png(url=str(svg), write_to=str(png), output_width=256, output_height=256)
    with Image.open(png) as image:
        rgba = image.convert("RGBA")
        if rgba.size != (256, 256):
            raise SystemExit(f"{name}: unexpected size {rgba.size}")
        if rgba.getchannel("A").getextrema()[0] == 255:
            raise SystemExit(f"{name}: PNG has no transparent pixels")
        rgba.save(png, format="PNG", optimize=True, compress_level=9)

print(f"generated {len(names)} PNG symbols")
