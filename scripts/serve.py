#!/usr/bin/env python3
"""Serve the website locally while you work on it.

Usage: python scripts/serve.py [port]        (default 8000, then open http://127.0.0.1:8000/)

Why not `python -m http.server`? Its connection queue holds five requests. A browser loading the
site's modules in parallel can overflow that, and on Windows the extra connections get refused,
so pieces of the site silently fail to load. This one is threaded, has a deep queue, refuses to
share its port with another server, and tells the browser not to cache, so a reload always gets the
files you just edited.
"""
from __future__ import annotations

import functools
import http.server
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent / "site"


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      ".js": "text/javascript", ".mjs": "text/javascript", ".webmanifest": "application/manifest+json"}

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):  # keep the terminal quiet; errors still surface
        if args and str(args[1] if len(args) > 1 else "").startswith(("4", "5")):
            super().log_message(fmt, *args)


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128
    daemon_threads = True
    allow_reuse_address = False  # on Windows, reuse would let two servers fight over one port


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = functools.partial(Handler, directory=str(SITE))
    try:
        httpd = Server(("127.0.0.1", port), handler)
    except OSError as e:
        sys.exit(f"Port {port} is already in use ({e}). Stop the other server or pick another port.")
    print(f"Serving {SITE} at http://127.0.0.1:{port}/  (Ctrl+C to stop)")
    with httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
