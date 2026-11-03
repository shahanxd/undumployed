#!/usr/bin/env python3
"""Serves bake.html locally, and saves what it renders into plates/.

Usage: python scripts/scene/serve.py [port], then open for example
  http://127.0.0.1:8001/bake.html?bake=dusk&t=1&yaw=1&eve=.24&storm=0&shift=0&flash=0&p=0   (night: eve=.74, storm: eve=1&storm=1, mask: bake=mask&eve=.72)
Then python scripts/scene/post.py dusk night storm mask writes the finished pictures into site/assets/scene.
"""
from __future__ import annotations

import functools
import http.server
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PLATES = ROOT / "plates"


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, ".webp": "image/webp"}

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_POST(self):
        name = self.path.rsplit("/", 1)[-1]
        if not self.path.startswith("/save/") or not re.fullmatch(r"[\w.-]+\.webp", name):
            self.send_error(400)
            return
        PLATES.mkdir(exist_ok=True)
        (PLATES / name).write_bytes(self.rfile.read(int(self.headers["Content-Length"])))
        self.send_response(204)
        self.end_headers()

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    handler = functools.partial(Handler, directory=str(ROOT))
    http.server.ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()
