# Savyour

React frontend and FastAPI/yt-dlp backend for analyzing public social video links, displaying available formats, and downloading media the user is authorized to save.

## Website pages and SEO

The frontend builds 15 standalone URLs: `/`, `/supported-sites/`, `/how-it-works/`, `/faq/`, `/about/`, eight `/platforms/{name}/` pages, and two `/guides/` articles. The homepage guides visitors to a platform page; preview and download controls live on the individual platform pages, which validate the pasted link against the selected site. Each platform page has its own guidance, common failure case, title, meta description, canonical URL, Open Graph and social card tags, accessible navigation, visible page content, and structured data. The build also creates `robots.txt`, `sitemap.xml`, a social preview image, and Savyour icons. A branded loading view prevents the crawlable initial HTML from flashing unstyled before React renders.

Set `VITE_SITE_URL` to the actual public HTTPS origin during the frontend build so canonical URLs, social cards, and the sitemap point to the live domain. The Windows public launcher discovers its Tailscale Funnel URL and sets this automatically. Set the GitHub Actions repository variable `VITE_SITE_URL` when moving the GitHub Pages copy to the same canonical domain; set the Docker build argument with the same name for a hosted deployment. Do not set either to localhost for a public build.

To verify ownership in Google Search Console, add the exact HTML tag token provided by Google as `GOOGLE_SITE_VERIFICATION` during the build (GitHub Actions repository variable or Docker build argument), redeploy, and use the URL Inspection tool for the homepage and platform pages. Then submit `https://<canonical-domain>/sitemap.xml` under the verified property. Only an owner of that domain can complete verification. Review indexing, actual search queries and Core Web Vitals in Search Console after enough data accumulates; a sitemap and metadata do not guarantee ranking. Google Pages is a duplicate frontend copy whose canonical tags point to the public single-service domain.

## Local development

### Windows one-click test

1. Install [Python 3](https://www.python.org/downloads/windows/) and [Node.js 22 or newer](https://nodejs.org/en/download). Make sure both are on `PATH`; reopen the terminal after installation. The launcher installs a bundled FFmpeg binary to merge the best video and audio streams.
2. Download this repository as a ZIP using **Code → Download ZIP** on GitHub and extract it, or clone it.
3. Double-click `start-local-windows.bat`. The first run installs dependencies and builds the React frontend. Leave the command window open.
4. Open <http://127.0.0.1:8000/> on that same PC, choose a platform, then paste a public video link on its page. The site fetches its thumbnail and qualities, then downloads the selected video to your browser's chosen location. Test the sample link <https://youtu.be/1gviYs7eF0c?si=hiW4O5dKcVO8LR4O> on `/platforms/youtube/`.

The download view reports connection, live progress for each media stream, merging, and saving. YouTube quality is capped at 480p in both the menu and backend; other platforms retain their best available quality. If a YouTube download remains on **Connecting to source**, send the exact status and the final lines of the command window. YouTube may allow metadata while refusing media streams, so a thumbnail alone does not prove that its streams can be saved.

The launcher binds only to `127.0.0.1`; it does not expose your PC to the internet. It allows up to 5 GB and 30 minutes per download for this local test. Success depends on the platform allowing playback from your connection and on the video being available. Some sites require authentication or block automated requests; a local run cannot guarantee every link.

For development with hot reload, run `pip install -r backend/requirements.txt` and `uvicorn backend.main:app --reload` from the repository root, and run `npm ci && npm run dev` in `frontend`. The Vite frontend proxies `/api` to `http://localhost:8000`.

## Host temporarily on your Windows computer

1. Install Python 3, Node.js 22 or newer, and [Tailscale for Windows](https://tailscale.com/download/windows). Sign in to Tailscale with a personal account. Tailscale Funnel requires enabling the feature for your tailnet; the command may open an approval page on first use. Its Personal plan is intended for noncommercial use and Funnel has bandwidth limits.
2. Download and extract the complete repository ZIP. Double-click `start-public-windows.bat` inside the extracted folder. Approve Funnel if prompted. The first run installs dependencies and builds the site; keep the command window open.
3. The launcher prints your public `https://…ts.net` address and saves it in `SAVYOUR-PUBLIC-URL.txt`. Open that URL from a phone on mobile data. Test `/api/health`, then test a public video link from its platform page. Share this Funnel URL as the working site address.
4. Set Windows **Settings → System → Power** so the computer does not sleep while plugged in. Keep the PC, internet connection, Tailscale, and launcher running. Start the launcher again after a reboot or whenever the command window closes. To stop public access, run `tailscale funnel reset` in a terminal; closing the app alone leaves Funnel configured, although no backend will answer while the server is off.

Funnel terminates HTTPS and forwards to the app bound to `127.0.0.1:8000`; there is no router port forwarding. The public site serves React and `/api` on the same address, which avoids cross-origin fetch errors. Public mode allows one active download, up to 1 GB per file, 15 minutes processing time, and global request limits (30 analyses and 8 downloads per five minutes). Completed downloads are deleted after they are sent or expire after 30 minutes. Watch free disk space and internet upload usage. Platform restrictions, upstream changes and home connectivity can still prevent individual downloads. Do not use this temporary setup as a guarantee of uptime or unlimited traffic.

The GitHub Pages frontend continues to point at the former Blitz backend until its `VITE_API_URL` repository variable is set to the new Funnel URL and the Pages workflow is rerun. The Funnel URL works immediately without GitHub Pages. Once you know the URL, update both `VITE_API_URL` and `VITE_SITE_URL` in GitHub **Settings → Secrets and variables → Actions → Variables**, then rerun the Pages workflow if you want the Pages copy to work too. If the Funnel domain changes, update those variables again. A paid VPS later replaces the PC and Funnel while keeping the same single-service app.

## Deployment

### No-card single-service host

The root `Dockerfile` packages the React build and FastAPI API in one service, so the frontend calls its own origin. On [blitz.cloud](https://blitz.cloud/docs/deploy-from-github/), create a free account, choose **Host something new → My own code**, paste this public repository URL, select `main`, and choose the root `Dockerfile`. The app uses port `8080`; use the deployed address `https://savyour.blitz.cloud`. Its free plan currently needs no payment card, but account creation and email verification are required. Once live, test `/api/health` and the site at the same address. The GitHub Pages workflow uses this API address by default.

The GitHub Actions workflow deploys `frontend` to GitHub Pages from `main`. Its default API endpoint is `https://savyour.blitz.cloud`; set the repository variable `VITE_API_URL` only if the backend address changes. GitHub Pages cannot run Python or ffmpeg.

For the free backend option, [deploy the Render Blueprint](https://render.com/deploy?repo=https://github.com/Iqra0076r/Savyour) from this repository. The root `render.yaml` configures a Docker web service and its CORS origin. The frontend is preconfigured for `https://saveflow-savyour-api.onrender.com`. If Render assigns a different URL, set the GitHub Actions repository variable `VITE_API_URL` to the actual HTTPS service URL, then rerun the Pages workflow. The health check is `/api/health`. Render free web services spin down after inactivity; the first request after idle can be slow, and video transfers may exceed free tier time, memory or bandwidth limits.

The server accepts only HTTPS links on an allowlist of public platform hosts and does not handle logins or cookies. Private or restricted videos may fail. `yt-dlp` and ffmpeg should be kept updated. A production public service needs rate limits, download size and disk quotas, concurrency controls, and abuse monitoring before significant traffic. Hosted defaults limit yt-dlp files to 1 GB and downloads to 180 seconds; the local launcher overrides these defaults, but disk space and platform restrictions still apply.
