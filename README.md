# SaveFlow

React frontend and FastAPI/yt-dlp backend for analyzing public social video links, displaying available formats, and downloading media the user is authorized to save.

## Local development

Install `ffmpeg` on the backend machine. In `backend`, run `pip install -r requirements.txt` and `uvicorn main:app --reload`. In `frontend`, run `npm ci` and `npm run dev`. The frontend defaults to `http://localhost:8000` for the API.

## Deployment

The GitHub Actions workflow deploys `frontend` to GitHub Pages from `main`. Set repository variable `VITE_API_URL` to the HTTPS URL of your deployed backend (without a trailing slash). GitHub Pages cannot run Python or ffmpeg.

Deploy `backend` as a Docker web service on a host that supports persistent processes and outbound traffic, e.g. a free tier if offered. Use `backend/Dockerfile` as the Dockerfile, set `FRONTEND_ORIGINS=https://iqra0076r.github.io`, and bind the platform's `PORT` (the image does this). The health check is `/api/health`. Redeploy the frontend after setting `VITE_API_URL`. Hosting free tier availability and outbound access vary; video transfers can exceed free tier time, memory and bandwidth limits.

The server accepts only HTTPS links on an allowlist of public platform hosts and does not handle logins or cookies. Private or restricted videos may fail. `yt-dlp` and ffmpeg should be kept updated. A production public service needs rate limits, download size and disk quotas, concurrency controls, and abuse monitoring before significant traffic. This starter limits yt-dlp files to 1 GB and individual jobs to 180 seconds, but hosting limits can be lower.
