# SaveFlow

React frontend and FastAPI/yt-dlp backend for analyzing public social video links, displaying available formats, and downloading media the user is authorized to save.

## Local development

Install `ffmpeg` on the backend machine. In `backend`, run `pip install -r requirements.txt` and `uvicorn main:app --reload`. In `frontend`, run `npm ci` and `npm run dev`. The frontend defaults to `http://localhost:8000` for the API.

## Deployment

### No-card single-service host

The root `Dockerfile` packages the React build and FastAPI API in one service, so the frontend calls its own origin. On [blitz.cloud](https://blitz.cloud/docs/deploy-from-github/), create a free account, choose **Host something new → My own code**, paste this public repository URL, select `main`, and choose the root `Dockerfile`. The app uses port `8080`; use the deployed address `https://savyour.blitz.cloud`. Its free plan currently needs no payment card, but account creation and email verification are required. Once live, test `/api/health` and the site at the same address. The GitHub Pages workflow uses this API address by default.

The GitHub Actions workflow deploys `frontend` to GitHub Pages from `main`. Its default API endpoint is `https://savyour.blitz.cloud`; set the repository variable `VITE_API_URL` only if the backend address changes. GitHub Pages cannot run Python or ffmpeg.

For the free backend option, [deploy the Render Blueprint](https://render.com/deploy?repo=https://github.com/Iqra0076r/Savyour) from this repository. The root `render.yaml` configures a Docker web service and its CORS origin. The frontend is preconfigured for `https://saveflow-savyour-api.onrender.com`. If Render assigns a different URL, set the GitHub Actions repository variable `VITE_API_URL` to the actual HTTPS service URL, then rerun the Pages workflow. The health check is `/api/health`. Render free web services spin down after inactivity; the first request after idle can be slow, and video transfers may exceed free tier time, memory or bandwidth limits.

The server accepts only HTTPS links on an allowlist of public platform hosts and does not handle logins or cookies. Private or restricted videos may fail. `yt-dlp` and ffmpeg should be kept updated. A production public service needs rate limits, download size and disk quotas, concurrency controls, and abuse monitoring before significant traffic. This starter limits yt-dlp files to 1 GB and individual jobs to 180 seconds, but hosting limits can be lower.
