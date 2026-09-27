import asyncio
import ipaddress
import os
import re
import shutil
import socket
import tempfile
from pathlib import Path
from urllib.parse import urlparse

import yt_dlp
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from starlette.background import BackgroundTask

app = FastAPI(title='SaveFlow API')
origins = [s.strip() for s in os.getenv('FRONTEND_ORIGINS', 'http://localhost:5173').split(',') if s.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=['GET', 'POST'], allow_headers=['Content-Type'], expose_headers=['Content-Disposition'])
DOMAINS = ('youtube.com','youtu.be','tiktok.com','instagram.com','facebook.com','fb.watch','x.com','twitter.com','vimeo.com','pinterest.com','pin.it','reddit.com')

class Link(BaseModel):
    url: str

class Download(Link):
    format_id: str = 'best'

def checked_url(raw):
    url = raw.strip()
    parsed = urlparse(url)
    host = (parsed.hostname or '').lower().rstrip('.')
    if len(url) > 2048 or parsed.scheme != 'https' or parsed.username or parsed.password or parsed.port not in (None,443) or not any(host == d or host.endswith('.'+d) for d in DOMAINS):
        raise HTTPException(400, 'Paste a public HTTPS video link from a supported platform.')
    try:
        if any(not ipaddress.ip_address(a[4][0]).is_global for a in socket.getaddrinfo(host,443,type=socket.SOCK_STREAM)):
            raise ValueError()
    except (socket.gaierror, ValueError):
        raise HTTPException(400, 'The link host is unavailable.')
    return url

def options(**extra):
    settings = dict(quiet=True, no_warnings=True, noplaylist=True, skip_download=True, socket_timeout=15, retries=1, extractor_retries=1)
    settings.update(extra)
    return settings

def extract(url):
    with yt_dlp.YoutubeDL(options()) as ydl:
        info = ydl.extract_info(url, download=False)
    if not info or info.get('_type') == 'playlist':
        raise ValueError('Only individual public videos are supported.')
    return info

@app.get('/api/health')
def health():
    return {'ok': True}

@app.post('/api/analyze')
async def analyze(link: Link):
    url = checked_url(link.url)
    try:
        info = await asyncio.wait_for(asyncio.to_thread(extract,url),180)
        formats = []
        seen = set()
        for f in info.get('formats') or []:
            fid = str(f.get('format_id') or '')
            if not fid or fid in seen or f.get('vcodec') == 'none' or not f.get('url'):
                continue
            seen.add(fid)
            formats.append(dict(id=fid, height=f.get('height'), ext=f.get('ext') or 'video', size=f.get('filesize') or f.get('filesize_approx'), has_audio=f.get('acodec') != 'none', fps=f.get('fps')))
        formats.sort(key=lambda f:(f['height'] or 0,f['has_audio'],f['fps'] or 0),reverse=True)
        return dict(title=info.get('title') or 'Untitled video', thumbnail=info.get('thumbnail'), duration=info.get('duration'), creator=info.get('uploader'), platform=info.get('extractor_key') or info.get('extractor'), formats=formats[:40])
    except (asyncio.TimeoutError, yt_dlp.utils.DownloadError, ValueError) as e:
        raise HTTPException(422, f'Could not analyze this public video: {str(e)[:220]}')

@app.post('/api/download')
async def download(link: Download):
    url = checked_url(link.url)
    fid = link.format_id
    if fid != 'best' and not re.fullmatch(r'[\w.+-]{1,80}',fid):
        raise HTTPException(400,'Invalid format selection.')
    folder = Path(tempfile.mkdtemp(prefix='saveflow-'))
    def produce():
        with yt_dlp.YoutubeDL(options(skip_download=False, format=('bestvideo*+bestaudio/best' if fid == 'best' else f'{fid}+bestaudio/{fid}'), merge_output_format='mp4', outtmpl=str(folder/'%(title).120s-%(id)s.%(ext)s'), max_filesize=1_000_000_000)) as ydl:
            ydl.download([url])
        files = [p for p in folder.iterdir() if p.is_file() and not p.name.endswith('.part')]
        if not files:
            raise ValueError('No downloadable file was produced.')
        return max(files,key=lambda p:p.stat().st_size)
    try:
        file = await asyncio.wait_for(asyncio.to_thread(produce),180)
        return FileResponse(file, filename=file.name, media_type='application/octet-stream', background=BackgroundTask(lambda: shutil.rmtree(folder,ignore_errors=True)))
    except (asyncio.TimeoutError,yt_dlp.utils.DownloadError,ValueError) as e:
        shutil.rmtree(folder,ignore_errors=True)
        raise HTTPException(422,f'Download unavailable: {str(e)[:220]}')
