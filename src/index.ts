import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { getAuthUrl, getTokens, getNowPlaying } from './spotify';
import { saveUser, getUser } from './storage';
import { getTemplate } from './template';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Spotify Now Playing</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
          :root {
            --spotify-green: #1DB954;
            --bg-dark: #090909;
            --surface: #121212;
            --text-main: #FFFFFF;
            --text-dim: #A7A7A7;
          }
          body { 
            font-family: 'Outfit', sans-serif; 
            background: var(--bg-dark); 
            color: var(--text-main); 
            display: flex; 
            flex-direction: column;
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0; 
            overflow: hidden;
          }
          .background-glow {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(29, 185, 84, 0.15) 0%, rgba(0, 0, 0, 0) 70%);
            z-index: -1;
            pointer-events: none;
          }
          .container { 
            text-align: center; 
            background: rgba(18, 18, 18, 0.7); 
            padding: 60px 40px; 
            border-radius: 32px; 
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 24px 64px rgba(0,0,0,0.6);
            max-width: 400px;
            width: 90%;
          }
          .icon-container {
            margin-bottom: 24px;
          }
          .spotify-icon {
            width: 64px;
            height: 64px;
            fill: var(--spotify-green);
            filter: drop-shadow(0 0 12px rgba(29, 185, 84, 0.4));
          }
          h1 { margin: 0 0 12px 0; font-size: 32px; font-weight: 700; letter-spacing: -0.02em; }
          p { margin: 0 0 40px 0; color: var(--text-dim); line-height: 1.6; font-size: 16px; }
          .btn { 
            background: var(--spotify-green); 
            color: #000; 
            padding: 16px 32px; 
            border-radius: 100px; 
            text-decoration: none; 
            font-weight: 700; 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: inline-block;
            box-shadow: 0 8px 16px rgba(29, 185, 84, 0.2);
          }
          .btn:hover { 
            background: #1ed760; 
            transform: scale(1.05);
            box-shadow: 0 12px 24px rgba(29, 185, 84, 0.3);
          }
          footer {
            margin-top: 40px;
            font-size: 14px;
            color: var(--text-dim);
          }
          footer a {
            color: var(--text-main);
            text-decoration: none;
            font-weight: 600;
            transition: color 0.2s;
          }
          footer a:hover {
            color: var(--spotify-green);
          }
        </style>
      </head>
      <body>
        <div class="background-glow"></div>
        <div class="container">
          <div class="icon-container">
            <svg class="spotify-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.508 17.303c-.216.354-.675.466-1.03.25-2.853-1.743-6.444-2.138-10.673-1.172-.406.092-.813-.16-.904-.565-.092-.406.161-.813.566-.905 4.633-1.06 8.583-.615 11.79 1.344.355.216.467.675.251 1.03zm1.48-3.26c-.272.443-.848.583-1.291.31-3.262-2.004-8.23-2.585-12.086-1.414-.498.151-1.025-.13-1.176-.628-.151-.498.13-1.025.628-1.176 4.417-1.34 9.878-.68 13.616 1.616.442.272.583.848.31 1.291zm.128-3.4c-3.912-2.323-10.363-2.537-14.126-1.396-.6.182-1.234-.162-1.416-.763-.182-.6.162-1.233.763-1.415 4.316-1.31 11.439-1.062 15.968 1.625.539.319.718 1.018.399 1.556-.32.538-1.019.718-1.557.399z"/></svg>
          </div>
          <h1>Now Playing</h1>
          <p>A minimalist Spotify widget for your profile, website, or GitHub Readme.</p>
          <a href="/login" class="btn">Connect Spotify</a>
        </div>
        <footer>
          By <a href="https://github.com/BeeBombshell" target="_blank">BeeBombshell</a>
        </footer>
      </body>
    </html>
  `);
});

app.get('/login', (req, res) => {
  res.redirect(getAuthUrl());
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code provided');

  try {
    const tokens = await getTokens(code as string);
    const uid = crypto.randomBytes(5).toString('hex');
    
    saveUser(uid, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    });

    res.redirect(`/dashboard?uid=${uid}`);
  } catch (error) {
    console.error('Error in callback:', error);
    res.status(500).send('Authentication failed');
  }
});

app.get('/dashboard', async (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.status(400).send('No UID provided');

  const nowPlaying = await getNowPlaying(uid as string);
  const widgetHtml = getTemplate(nowPlaying);
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const widgetUrl = `${baseUrl}/now-playing?uid=${uid}`;

  res.send(`
    <html>
      <head>
        <title>Dashboard | Spotify Now Playing</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
          :root {
            --spotify-green: #1DB954;
            --bg-dark: #090909;
            --surface: #121212;
            --text-main: #FFFFFF;
            --text-dim: #A7A7A7;
            --border: rgba(255, 255, 255, 0.1);
          }
          body { 
            font-family: 'Outfit', sans-serif; 
            background: var(--bg-dark); 
            color: var(--text-main); 
            display: flex; 
            flex-direction: column;
            align-items: center; 
            padding: 40px 20px;
            margin: 0; 
          }
          .container { 
            max-width: 800px; 
            width: 100%;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
          }
          .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 700;
            font-size: 24px;
            text-decoration: none;
            color: var(--text-main);
          }
          .logo svg {
            width: 32px;
            height: 32px;
            fill: var(--spotify-green);
          }
          .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 32px;
            margin-bottom: 24px;
          }
          h2 { margin-top: 0; font-size: 20px; color: var(--text-main); margin-bottom: 24px; }
          .preview-container {
            display: flex;
            justify-content: center;
            padding: 24px;
            background: #000;
            border-radius: 16px;
            border: 1px dashed var(--border);
            margin-bottom: 24px;
          }
          .snippet-group {
            margin-bottom: 24px;
          }
          .snippet-label {
            font-size: 14px;
            color: var(--text-dim);
            margin-bottom: 8px;
            display: block;
          }
          .snippet-box {
            background: #000;
            border: 1px solid var(--border);
            padding: 16px;
            padding-right: 100px;
            border-radius: 12px;
            font-family: monospace;
            font-size: 13px;
            color: var(--spotify-green);
            word-break: break-all;
            position: relative;
            cursor: pointer;
            transition: border-color 0.2s;
            overflow: hidden;
          }
          .snippet-box:hover {
            border-color: var(--spotify-green);
          }
          .snippet-content {
            transition: filter 0.3s ease, opacity 0.3s ease;
          }
          .snippet-box:hover .snippet-content {
            filter: blur(4px);
            opacity: 0.5;
          }
          .copy-hint {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 11px;
            background: var(--surface);
            color: var(--text-main);
            padding: 6px 10px;
            border-radius: 6px;
            opacity: 0;
            transition: all 0.2s ease;
            border: 1px solid var(--border);
            pointer-events: none;
            white-space: nowrap;
          }
          .snippet-box:hover .copy-hint {
            opacity: 1;
            right: 8px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            color: var(--text-dim);
            font-size: 14px;
          }
          .footer a { color: #fff; text-decoration: none; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <a href="/" class="logo">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.508 17.303c-.216.354-.675.466-1.03.25-2.853-1.743-6.444-2.138-10.673-1.172-.406.092-.813-.16-.904-.565-.092-.406.161-.813.566-.905 4.633-1.06 8.583-.615 11.79 1.344.355.216.467.675.251 1.03zm1.48-3.26c-.272.443-.848.583-1.291.31-3.262-2.004-8.23-2.585-12.086-1.414-.498.151-1.025-.13-1.176-.628-.151-.498.13-1.025.628-1.176 4.417-1.34 9.878-.68 13.616 1.616.442.272.583.848.31 1.291zm.128-3.4c-3.912-2.323-10.363-2.537-14.126-1.396-.6.182-1.234-.162-1.416-.763-.182-.6.162-1.233.763-1.415 4.316-1.31 11.439-1.062 15.968 1.625.539.319.718 1.018.399 1.556-.32.538-1.019.718-1.557.399z"/></svg>
              <span>Dashboard</span>
            </a>
          </div>

          <div class="card">
            <h2>Your Live Preview</h2>
            <div class="preview-container">
              ${widgetHtml}
            </div>
            <p style="font-size: 14px; color: var(--text-dim); text-align: center;">Make sure you have music playing on Spotify to see the live data.</p>
          </div>

          <div class="card">
            <h2>Embed Your Widget</h2>
            
            <div class="snippet-group">
              <span class="snippet-label">Markdown (for GitHub Profile Readme)</span>
              <div class="snippet-box" onclick="copyToClipboard(this)">
                <span class="snippet-content">[![Spotify Now Playing](${widgetUrl})](${widgetUrl})</span>
                <span class="copy-hint">Click to copy</span>
              </div>
            </div>

            <div class="snippet-group">
              <span class="snippet-label">HTML Embed</span>
              <div class="snippet-box" onclick="copyToClipboard(this)">
                <span class="snippet-content">
                  &lt;a href="${widgetUrl}" target="_blank"&gt;
                    &lt;img src="${widgetUrl}" alt="Spotify Now Playing" /&gt;
                  &lt;/a&gt;
                </span>
                <span class="copy-hint">Click to copy</span>
              </div>
            </div>

            <div class="snippet-group">
              <span class="snippet-label">Direct Link (Embed in pages)</span>
              <div class="snippet-box" onclick="copyToClipboard(this)">
                <span class="snippet-content">${widgetUrl}</span>
                <span class="copy-hint">Click to copy</span>
              </div>
            </div>
          </div>

          <div class="footer">
            By <a href="https://github.com/BeeBombshell" target="_blank">BeeBombshell</a>
          </div>
        </div>

        <script>
          function copyToClipboard(el) {
            const text = el.innerText.replace('Click to copy', '').trim();
            navigator.clipboard.writeText(text).then(() => {
              const hint = el.querySelector('.copy-hint');
              const originalText = hint.innerText;
              hint.innerText = 'Copied!';
              setTimeout(() => { hint.innerText = originalText; }, 2000);
            });
          }
        </script>
      </body>
    </html>
  `);
});

app.get('/now-playing', async (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.status(400).send('No UID provided');

  const nowPlaying = await getNowPlaying(uid as string);
  const html = getTemplate(nowPlaying);
  res.send(html);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
