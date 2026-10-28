#!/usr/bin/env python3
"""Local hub launcher. Diary data is served only by the existing diary app."""
import argparse
import functools
import http.server
from pathlib import Path
import socket
import subprocess
import sys
import threading
import time
import webbrowser

ROOT = Path(__file__).resolve().parent

def listening(port):
    try:
        with socket.create_connection(('127.0.0.1', port), timeout=0.3):
            return True
    except OSError:
        return False

def main():
    parser = argparse.ArgumentParser(description='교실 서랍 로컬 실행')
    parser.add_argument('--no-browser', action='store_true')
    parser.add_argument('--no-diary', action='store_true')
    parser.add_argument('--port', type=int, default=8780)
    args = parser.parse_args()
    diary_process = None
    diary_root = ROOT.parent.parent / '로컬 서버 일기장'
    if not args.no_diary and (diary_root / 'server.py').is_file():
        if not listening(8765):
            diary_process = subprocess.Popen([sys.executable, 'server.py'], cwd=diary_root)
            for _ in range(30):
                if listening(8765) or diary_process.poll() is not None:
                    break
                time.sleep(0.1)
            if diary_process.poll() is not None:
                print('일기장이 시작되지 않았습니다. 일기장 폴더의 시작.command를 확인하세요.', flush=True)
        print('일기장: http://127.0.0.1:8765 (이 컴퓨터 전용)', flush=True)
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT / 'dist'))
    try:
        server = http.server.ThreadingHTTPServer(('127.0.0.1', args.port), handler)
    except OSError as exc:
        if diary_process is not None:
            diary_process.terminate()
            diary_process.wait()
        print(f'허브를 시작하지 못했습니다: {exc}\n이미 실행 중이면 http://127.0.0.1:{args.port} 를 여세요.', flush=True)
        return 1
    url = f'http://127.0.0.1:{args.port}'
    print(f'교실 서랍: {url}\n종료하려면 Ctrl+C를 누르세요.', flush=True)
    if not args.no_browser:
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        if diary_process is not None:
            diary_process.terminate()
            diary_process.wait()
    return 0

if __name__ == '__main__':
    sys.exit(main())
