# SaveFlow

React frontend and FastAPI/yt-dlp backend for analyzing public social video links, displaying available formats, and downloading media the user is authorized to save.

## Local development

### Windows one-click test

1. Install [Python 3](https://www.python.org/downloads/windows/), [Node.js 22 or newer](https://nodejs.org/en/download), and [FFmpeg](https://ffmpeg.org/download.html). Make sure all three are on `PATH`; reopen the terminal after installation. FFmpeg merges the best video and audio streams.
2. Download this repository as a ZIP using **Code → Download ZIP** on GitHub and extract it, or clone it.
3. Double-click `start-local-windows.bat`. The first run installs dependencies and builds the React frontend. Leave the command window open.
4. Open <http://127.0.0.1:8000/> on that same PC. Paste a public video link; the site fetches its thumbnail and qualities, then downloads the selected video to your browser's chosen location. Test the sample link <https://youtu.be/1gviYs7eF0c?si=hiW4O5dKcVO8LR4O> here.

The launcher binds only to `127.0.0.1`; it does not expose your PC to the internet. It allows up to 5 GB and 30 minutes per download for this local test. Success depends on the platform allowing playback from your connection and on the video being available. Some sites require authentication or block automated requests; a local run cannot guarantee every link.

For development with hot reload, install `ffmpeg`, run `pip install -r backend/requirements.txt` and `uvicorn backend.main:app --reload` from the repository root, and run `npm ci && npm run dev` in `frontend`. The Vite frontend proxies `/api` to `http://localhost:8000`.

## Deployment

### No-card single-service host

The root `Dockerfile` packages the React build and FastAPI API in one service, so the frontend calls its own origin. On [blitz.cloud](https://blitz.cloud/docs/deploy-from-github/), create a free account, choose **Host something new → My own code**, paste this public repository URL, select `main`, and choose the root `Dockerfile`. The app uses port `8080`; use the deployed address `https://savyour.blitz.cloud`. Its free plan currently needs no payment card, but account creation and email verification are required. Once live, test `/api/health` and the site at the same address. The GitHub Pages workflow uses this API address by default.

The GitHub Actions workflow deploys `frontend` to GitHub Pages from `main`. Its default API endpoint is `https://savyour.blitz.cloud`; set the repository variable `VITE_API_URL` only if the backend address changes. GitHub Pages cannot run Python or ffmpeg.

For the free backend option, [deploy the Render Blueprint](https://render.com/deploy?repo=https://github.com/Iqra0076r/Savyour) from this repository. The root `render.yaml` configures a Docker web service and its CORS origin. The frontend is preconfigured for `https://saveflow-savyour-api.onrender.com`. If Render assigns a different URL, set the GitHub Actions repository variable `VITE_API_URL` to the actual HTTPS service URL, then rerun the Pages workflow. The health check is `/api/health`. Render free web services spin down after inactivity; the first request after idle can be slow, and video transfers may exceed free tier time, memory or bandwidth limits.

The server accepts only HTTPS links on an allowlist of public platform hosts and does not handle logins or cookies. Private or restricted videos may fail. `yt-dlp` and ffmpeg should be kept updated. A production public service needs rate limits, download size and disk quotas, concurrency controls, and abuse monitoring before significant traffic. Hosted defaults limit yt-dlp files to 1 GB and downloads to 180 seconds; the local launcher overrides these defaults, but disk space and platform restrictions still apply.
