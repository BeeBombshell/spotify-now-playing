import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { getAuthUrl, getTokens, getNowPlaying, getSpotifyProfile, getImageBase64 } from './spotify';
import { saveUser, getUser, getUserBySpotifyId, deleteUser } from './storage';
import { getTemplate, getSVGTemplate } from './template';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.set('trust proxy', true);
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  const { uid } = req.signedCookies;
  if (uid) {
    return res.redirect(`/dashboard?uid=${uid}`);
  }

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
            --input-bg: #1A1A1A;
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
            padding: 40px; 
            border-radius: 32px; 
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 24px 64px rgba(0,0,0,0.6);
            max-width: 440px;
            width: 90%;
          }
          .icon-container {
            margin-bottom: 24px;
          }
          .spotify-icon {
            width: 48px;
            height: 48px;
            fill: var(--spotify-green);
          }
          h1 { margin: 0 0 12px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
          p { margin: 0 0 32px 0; color: var(--text-dim); line-height: 1.6; font-size: 15px; }
          .form-group {
            text-align: left;
            margin-bottom: 20px;
          }
          label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--text-dim);
          }
          input {
            width: 100%;
            padding: 12px 16px;
            background: var(--input-bg);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: white;
            font-family: inherit;
            font-size: 14px;
            box-sizing: border-box;
            transition: border-color 0.2s;
          }
          input:focus {
            outline: none;
            border-color: var(--spotify-green);
          }
          .btn { 
            width: 100%;
            background: var(--spotify-green); 
            color: #000; 
            padding: 14px; 
            border-radius: 100px; 
            border: none;
            font-family: inherit;
            font-weight: 700; 
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 12px;
          }
          .btn:hover { 
            background: #1ed760; 
            transform: translateY(-2px);
          }
          .info-box {
            background: rgba(29, 185, 84, 0.1);
            border: 1px solid rgba(29, 185, 84, 0.2);
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 24px;
            font-size: 13px;
            text-align: left;
            color: #1ed760;
          }
          .setup-guide {
            text-align: left;
            margin-top: 32px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .setup-guide summary {
            padding: 16px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            color: var(--text-dim);
            list-style: none;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background 0.2s;
          }
          .setup-guide summary:hover {
            background: rgba(255, 255, 255, 0.05);
            color: var(--text-main);
          }
          .setup-content {
            padding: 0 16px 16px 16px;
            font-size: 13px;
            color: var(--text-dim);
            line-height: 1.6;
          }
          .setup-content ol {
            padding-left: 20px;
            margin: 12px 0;
          }
          .setup-content li {
            margin-bottom: 8px;
          }
          .setup-content strong {
            color: var(--spotify-green);
          }
          .setup-guide summary::before {
            content: '→';
            display: inline-block;
            transition: transform 0.2s;
          }
          .setup-guide[open] summary::before {
            transform: rotate(90deg);
          }
          footer {
            margin-top: 40px;
            font-size: 14px;
            color: var(--text-dim);
          }
        </style>
      </head>
      <body>
        <div class="background-glow"></div>
        <div class="container">
          <div class="icon-container">
            <svg class="spotify-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.508 17.303c-.216.354-.675.466-1.03.25-2.853-1.743-6.444-2.138-10.673-1.172-.406.092-.813-.16-.904-.565-.092-.406.161-.813.566-.905 4.633-1.06 8.583-.615 11.79 1.344.355.216.467.675.251 1.03zm1.48-3.26c-.272.443-.848.583-1.291.31-3.262-2.004-8.23-2.585-12.086-1.414-.498.151-1.025-.13-1.176-.628-.151-.498.13-1.025.628-1.176 4.417-1.34 9.878-.68 13.616 1.616.442.272.583.848.31 1.291zm.128-3.4c-3.912-2.323-10.363-2.537-14.126-1.396-.6.182-1.234-.162-1.416-.763-.182-.6.162-1.233.763-1.415 4.316-1.31 11.439-1.062 15.968 1.625.539.319.718 1.018.399 1.556-.32.538-1.019.718-1.557.399z"/></svg>
          </div>
          <h1>Spotify Now Playing</h1>
          <p>Create a stunning, live Spotify widget for your GitHub profile. Use your own Spotify App credentials for full control and unlimited access.</p>
          
          <div class="info-box">
            Add <strong>https://spotify.beebombshell.com/callback</strong> as a Redirect URI in your Spotify App.
          </div>

          <form action="/login" method="POST">
            <div class="form-group">
              <label for="clientId">Spotify Client ID</label>
              <input type="text" id="clientId" name="clientId" placeholder="Enter your Client ID" required>
            </div>
            <div class="form-group">
              <label for="clientSecret">Spotify Client Secret</label>
              <input type="password" id="clientSecret" name="clientSecret" placeholder="Enter your Client Secret" required>
            </div>
            <button type="submit" class="btn">Connect Dashboard</button>
          </form>

          <div style="margin-top: 24px; font-size: 12px; color: var(--text-dim); line-height: 1.5;">
            <p>🔒 <strong>Privacy Note:</strong> Your credentials are stored securely and used only to fetch your music activity. You can revoke access at any time from your dashboard, which will permanently delete your data.</p>
          </div>

          <details class="setup-guide">
            <summary>How to set up your Spotify App</summary>
            <div class="setup-content">
              <ol>
                <li>Visit the <a href="https://developer.spotify.com/dashboard" target="_blank" style="color: var(--spotify-green);">Spotify Developer Dashboard</a>.</li>
                <li>Click <strong>Create app</strong> and give it a name and description.</li>
                <li>Go to <strong>Settings</strong> and add the Redirect URI: <br>
                <code style="background: #000; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 4px; border: 1px solid #333;">https://spotify.beebombshell.com/callback</code></li>
                <li>Click <strong>Save</strong> at the bottom.</li>
                <li>Copy your <strong>Client ID</strong> and <strong>Client Secret</strong> into the form above.</li>
              </ol>
            </div>
          </details>
        </div>
        <footer>
          By <a href="https://beebombshell.com" target="_blank" style="color: white; text-decoration: none; font-weight: 600;">BeeBombshell</a> | <a href="https://github.com/BeeBombshell/spotify-now-playing" target="_blank" style="color: var(--text-dim); text-decoration: none;">Source Code</a>
        </footer>
      </body>
    </html>
  `);
});

app.post('/login', (req, res) => {
  const { clientId, clientSecret } = req.body;
  if (!clientId || !clientSecret) {
    return res.status(400).send('Client ID and Client Secret are required');
  }

  const state = crypto.randomBytes(16).toString('hex');
  
  // Store credentials in signed cookies temporarily
  const cookieOptions = { 
    maxAge: 15 * 60 * 1000, 
    httpOnly: true, 
    signed: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res.cookie('oauth_state', state, cookieOptions);
  res.cookie('temp_client_id', clientId, cookieOptions);
  res.cookie('temp_client_secret', clientSecret, cookieOptions);

  res.redirect(getAuthUrl(state, clientId));
});

app.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  const { oauth_state, temp_client_id: clientId, temp_client_secret: clientSecret } = req.signedCookies;

  if (!code) return res.status(400).send('No code provided');
  if (!state || state !== oauth_state) {
    return res.status(403).send('Invalid state parameter');
  }

  if (!clientId || !clientSecret) {
    return res.status(400).send('Credentials missing. Please try again from the home page.');
  }

  res.clearCookie('oauth_state');
  res.clearCookie('temp_client_id');
  res.clearCookie('temp_client_secret');

  try {
    const tokens = await getTokens(code as string, clientId, clientSecret);
    const profile = await getSpotifyProfile(tokens.access_token);
    const spotifyId = profile.id;
    const displayName = profile.display_name || profile.id;

    // Check if user exists
    let user = await getUserBySpotifyId(spotifyId);
    let uid: string;

    const userData = {
      spotifyId,
      displayName,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || (user ? user.refreshToken : ''),
      expiresAt: Date.now() + tokens.expires_in * 1000,
      clientId,
      clientSecret,
    };

    if (user) {
      uid = user.uid;
      await saveUser(uid, userData);
    } else {
      uid = crypto.randomBytes(5).toString('hex');
      await saveUser(uid, userData);
    }

    // Set cookie for session persistence (30 days)
    res.cookie('uid', uid, { 
      maxAge: 30 * 24 * 60 * 60 * 1000, 
      httpOnly: true, 
      signed: true,
      secure: process.env.NODE_ENV === 'production'
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
  const user = await getUser(uid as string);
  const widgetHtml = getTemplate(nowPlaying);
  
  // Robust protocol detection
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const baseUrl = `${protocol}://${req.get('host')}`;
  const widgetUrl = `${baseUrl}/now-playing?uid=${uid}`;

  const maskedClientId = user?.clientId ? `${user.clientId.substring(0, 4)}...${user.clientId.substring(user.clientId.length - 4)}` : 'Unknown';

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
          .credentials-info {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;
            color: var(--text-dim);
            background: rgba(255, 255, 255, 0.05);
            padding: 12px 16px;
            border-radius: 12px;
            margin-top: 12px;
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
          .btn-outline {
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-dim);
          }
          .btn-outline:hover {
            border-color: var(--text-main);
            color: var(--text-main);
          }
          .btn-danger {
            background: transparent;
            border: 1px solid rgba(255, 68, 68, 0.3);
            color: #ff4444;
          }
          .btn-danger:hover {
            background: rgba(255, 68, 68, 0.1);
            border-color: #ff4444;
          }
          .management-actions {
            display: flex;
            gap: 12px;
            margin-top: 24px;
          }
          .btn-small {
            padding: 10px 20px;
            font-size: 13px;
            border-radius: 8px;
            text-decoration: none;
            display: inline-block;
            cursor: pointer;
            font-family: inherit;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <a href="/" class="logo">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.508 17.303c-.216.354-.675.466-1.03.25-2.853-1.743-6.444-2.138-10.673-1.172-.406.092-.813-.16-.904-.565-.092-.406.161-.813.566-.905 4.633-1.06 8.583-.615 11.79 1.344.355.216.467.675.251 1.03zm1.48-3.26c-.272.443-.848.583-1.291.31-3.262-2.004-8.23-2.585-12.086-1.414-.498.151-1.025-.13-1.176-.628-.151-.498.13-1.025.628-1.176 4.417-1.34 9.878-.68 13.616 1.616.442.272.583.848.31 1.291zm.128-3.4c-3.912-2.323-10.363-2.537-14.126-1.396-.6.182-1.234-.162-1.416-.763-.182-.6.162-1.233.763-1.415 4.316-1.31 11.439-1.062 15.968 1.625.539.319.718 1.018.399 1.556-.32.538-1.019.718-1.557.399z"/></svg>
              <span>Dashboard</span>
            </a>
            <a href="/logout" class="btn-small btn-outline">Logout</a>
          </div>

          <div class="card">
            <h2>Your Live Preview</h2>
            <div class="preview-container">
              ${widgetHtml}
            </div>
            <p style="font-size: 14px; color: var(--text-dim); text-align: center;">Make sure you have music playing on Spotify to see the live data.</p>
            <p style="font-size: 12px; color: #fbbf24; text-align: center; margin-top: -10px;">Note: GitHub caches images for a few minutes. Updates may not be instantaneous on your profile.</p>
            
            <div class="credentials-info">
              <svg style="width: 18px; height: 18px; fill: var(--spotify-green);" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.5 1.1 2.5 2.5S13.4 12 12 12s-2.5-1.1-2.5-2.5S10.6 7 12 7zm0 10c-2.3 0-4.3-1.1-5.6-2.8.2-1.3 2.7-2.2 5.6-2.2s5.4.9 5.6 2.2C16.3 15.9 14.3 17 12 17z"/></svg>
              Using Spotify App: <strong>${maskedClientId}</strong>
            </div>
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

          <div class="card">
            <h2>Manage Access</h2>
            <p style="font-size: 14px; color: var(--text-dim); margin-bottom: 20px;">
              Your Spotify credentials (Client ID and Secret) are stored in our database only to facilitate this service. 
              Revoking access will permanently delete your credentials and tokens from our records.
            </p>
            <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); padding: 16px; border-radius: 12px; font-size: 13px; color: #fbbf24; margin-bottom: 24px; line-height: 1.5;">
              <strong>Note:</strong> If you are concerned about privacy, we encourage you to <a href="https://github.com/BeeBombshell/spotify-now-playing" target="_blank" style="color: #fbbf24; font-weight: 700;">clone the repository</a> and host your own instance!
            </div>
            <div class="management-actions">
              <form action="/revoke" method="POST" onsubmit="return confirm('Are you sure you want to revoke access? This will permanently delete your stored credentials and you will need to reconnect.')">
                <button type="submit" class="btn-small btn-danger">Revoke Access & Delete Data</button>
              </form>
            </div>
          </div>

          <div class="footer">
            By <a href="https://beebombshell.com" target="_blank">BeeBombshell</a>
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
  
  let albumArtBase64 = null;
  if (nowPlaying && nowPlaying.item) {
    albumArtBase64 = await getImageBase64(nowPlaying.item.album.images[0].url);
  }

  const svg = getSVGTemplate(nowPlaying, albumArtBase64);
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.send(svg);
});

app.get('/logout', (req, res) => {
  res.clearCookie('uid');
  res.redirect('/');
});

app.post('/revoke', async (req, res) => {
  const { uid } = req.signedCookies;
  if (uid) {
    await deleteUser(uid);
    res.clearCookie('uid');
  }
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
