# One time helper. Extracts the design source out of the bundled HTML files
# so the templates and logic can be read as normal text.
#
#   python tools/unpack_designs.py CareerTrack-WebApp.html design/web
#   python tools/unpack_designs.py CareerTrack-MobileApp.html design/mobile
#
# The bundles themselves stay out of git. Fonts land next to the rest of the
# output; copy the woff2 files to public/fonts and the illustration SVGs to
# public/illustrations when they change.

import base64
import gzip
import json
import os
import re
import sys


def unpack(bundle_path, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    raw = open(bundle_path, encoding="utf-8").read()

    def block(kind):
        pattern = r'<script type="__bundler/%s">\n(.*?)\n\s*</script>' % kind
        found = re.search(pattern, raw, re.S)
        return found.group(1) if found else None

    manifest = json.loads(block("manifest"))
    ext_resources = json.loads(block("ext_resources"))
    template = json.loads(block("template"))

    open(os.path.join(out_dir, "template.html"), "w", encoding="utf-8").write(template)

    names = {item["uuid"]: item["id"] for item in ext_resources}

    for uuid, entry in manifest.items():
        data = base64.b64decode(entry["data"])
        if entry.get("compressed"):
            data = gzip.decompress(data)

        name = names.get(uuid, uuid)
        safe = re.sub(r"[^A-Za-z0-9._-]", "_", name)[:80] or uuid
        mime = entry["mime"]
        is_text = mime.startswith(("text/", "application/javascript"))

        if is_text or name.endswith((".html", ".js", ".css")):
            open(os.path.join(out_dir, safe), "wb").write(data)
        elif mime.startswith("image/"):
            open(os.path.join(out_dir, safe), "wb").write(data)
        elif mime.startswith(("font/", "application/font")):
            open(os.path.join(out_dir, safe), "wb").write(data)


if __name__ == "__main__":
    unpack(sys.argv[1], sys.argv[2])
