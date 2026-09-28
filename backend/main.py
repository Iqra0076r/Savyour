import asyncio
import ipaddress
import os
import re
import shutil
import socket
import tempfile
import time
import uuid
from pathlib import Path
from urllib.parse import urlparse

import yt_dlp
import imageio_ffmpeg
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.background import BackgroundTask

app = FastAPI(title='SaveFlow API')
jobs = {}
job_tasks = set()
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

def is_youtube_url(url):
    host = (urlparse(url).hostname or '').lower().rstrip('.')
    return host in ('youtu.be', 'youtube.com') or host.endswith('.youtube.com')

def format_expression(url, fid):
    if is_youtube_url(url):
        return ('bestvideo[height<=480]+bestaudio/best[height<=480]' if fid == 'best'
                else f'{fid}[height<=480][acodec=none]+bestaudio/{fid}[height<=480]')
    return 'bestvideo+bestaudio/best' if fid == 'best' else f'{fid}[acodec=none]+bestaudio/{fid}'

def options(**extra):
    settings = dict(quiet=True, no_warnings=True, noplaylist=True, skip_download=True, socket_timeout=15, retries=1, extractor_retries=1, fragment_retries=2, js_runtimes={'node': {}}, ffmpeg_location=imageio_ffmpeg.get_ffmpeg_exe())
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
        info = await asyncio.wait_for(asyncio.to_thread(extract,url),int(os.getenv('ANALYZE_TIMEOUT','180')))
        formats = []
        seen = set()
        for f in info.get('formats') or []:
            fid = str(f.get('format_id') or '')
            if not fid or fid in seen or f.get('vcodec') == 'none' or not f.get('url'):
                continue
            if is_youtube_url(url) and (not isinstance(f.get('height'), (int, float)) or f['height'] > 480):
                continue
            seen.add(fid)
            formats.append(dict(id=fid, height=f.get('height'), ext=f.get('ext') or 'video', size=f.get('filesize') or f.get('filesize_approx'), has_audio=f.get('acodec') != 'none', fps=f.get('fps')))
        formats.sort(key=lambda f:(f['height'] or 0,f['has_audio'],f['fps'] or 0),reverse=True)
        return dict(title=info.get('title') or 'Untitled video', thumbnail=info.get('thumbnail'), duration=info.get('duration'), creator=info.get('uploader'), platform=info.get('extractor_key') or info.get('extractor'), formats=formats[:40], max_quality=480 if is_youtube_url(url) else None)
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
        return produce_file(url, fid, folder)
    try:
        file = await asyncio.wait_for(asyncio.to_thread(produce),int(os.getenv('DOWNLOAD_TIMEOUT','180')))
        return FileResponse(file, filename=file.name, media_type='application/octet-stream', background=BackgroundTask(lambda: shutil.rmtree(folder,ignore_errors=True)))
    except (asyncio.TimeoutError,yt_dlp.utils.DownloadError,ValueError) as e:
        shutil.rmtree(folder,ignore_errors=True)
        raise HTTPException(422,f'Download unavailable: {str(e)[:220]}')

def produce_file(url, fid, folder, progress=None):
    def report(d, phase):
        if progress:
            progress(d, phase)
    fmt = format_expression(url, fid)
    with yt_dlp.YoutubeDL(options(skip_download=False, format=fmt, merge_output_format='mp4', outtmpl=str(folder/'%(title).120s-%(id)s.%(ext)s'), max_filesize=int(os.getenv('MAX_DOWNLOAD_BYTES','1000000000')), progress_hooks=[lambda d: report(d, 'download')], postprocessor_hooks=[lambda d: report(d, 'postprocess')])) as ydl:
        ydl.download([url])
    files = [p for p in folder.iterdir() if p.is_file() and not p.name.endswith('.part')]
    if not files:
        raise ValueError('No downloadable file was produced.')
    return max(files,key=lambda p:p.stat().st_size)

def prune_jobs():
    now = time.monotonic()
    for key, job in list(jobs.items()):
        if job['status'] in ('ready', 'error') and now - job['updated'] > 3600:
            shutil.rmtree(job['folder'], ignore_errors=True)
            jobs.pop(key, None)

@app.post('/api/download/start')
async def start_download(link: Download):
    url = checked_url(link.url)
    fid = link.format_id
    if fid != 'best' and not re.fullmatch(r'[\w.+-]{1,80}', fid):
        raise HTTPException(400, 'Invalid format selection.')
    prune_jobs()
    if sum(j['status'] not in ('ready', 'error') for j in jobs.values()) >= 2:
        raise HTTPException(429, 'Two downloads are already in progress. Try again shortly.')
    key = uuid.uuid4().hex
    folder = Path(tempfile.mkdtemp(prefix='saveflow-'))
    job = {'status':'starting', 'detail':'Connecting to source', 'percent':None, 'bytes':None, 'folder':folder, 'updated':time.monotonic(), 'completed_streams':set()}
    jobs[key] = job
    def progress(d, phase):
        state = d.get('status')
        if phase == 'postprocess':
            job.update(status='processing', detail='Combining video and audio', percent=None)
        elif state == 'downloading':
            received = d.get('downloaded_bytes') or 0
            total = d.get('total_bytes') or d.get('total_bytes_estimate')
            stream = len(job['completed_streams']) + 1
            job.update(status='downloading', detail=f'Downloading media stream {stream}', bytes=received, percent=round(min(100, 100*received/total), 1) if total else None)
        elif state == 'finished':
            job['completed_streams'].add(d.get('filename') or len(job['completed_streams']))
            job.update(status='processing', detail='Preparing next stream or combining files', percent=None)
    async def run():
        try:
            file = await asyncio.to_thread(produce_file, url, fid, folder, progress)
            job.update(status='ready', detail='Ready to save', file=file, percent=100)
        except Exception as exc:
            job.update(status='error', detail=f'Download unavailable: {str(exc)[:400]}')
            shutil.rmtree(folder, ignore_errors=True)
        finally:
            job['updated'] = time.monotonic()
    task = asyncio.create_task(run())
    job_tasks.add(task)
    task.add_done_callback(job_tasks.discard)
    return {'id':key}

@app.get('/api/download/{key}')
def download_status(key: str):
    job = jobs.get(key)
    if not job:
        raise HTTPException(404, 'Download job expired or not found.')
    return {k:job.get(k) for k in ('status','detail','percent','bytes')}

@app.get('/api/download/{key}/file')
def download_file(key: str):
    job = jobs.get(key)
    if not job or job['status'] != 'ready' or not job['file'].is_file():
        raise HTTPException(404, 'Download is not ready.')
    return FileResponse(job['file'], filename=job['file'].name, media_type='application/octet-stream')

static_dir = Path(os.getenv('STATIC_DIR', '/app/frontend/dist'))
if static_dir.is_dir():
    app.mount('/', StaticFiles(directory=static_dir, html=True), name='site')
