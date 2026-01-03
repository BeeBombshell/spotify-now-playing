# 🎵 Spotify Now Playing Widget

<div align="center">
  <p align="center">
    <strong>A minimalist, high-performance service to display your live Spotify activity.</strong>
  </p>
  
  <p align="center">
    <img src="https://img.shields.io/badge/Spotify-1DB954?style=flat-square&logo=spotify&logoColor=white" alt="Spotify" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black" alt="Firebase" />
    <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  </p>

  <p align="center">
    <a href="https://spotify.beebombshell.com/now-playing?uid=a55e8495c5">
      <img src="https://spotify.beebombshell.com/now-playing?uid=a55e8495c5" alt="Spotify Now Playing" />
    </a>
  </p>
</div>

## ✨ Features

- **Real-time Updates**: Reflects what you are currently listening to on Spotify.
- **Server-Side Caching**: Uses in-memory caching (30s TTL) to reduce API calls and protect rate limits.
- **SVG Rendering**: Returns a crisp, lightweight SVG image that renders perfectly in GitHub Readmes.
- **Dynamic Styling**: Beautifully designed templates that look great in any theme.
- **Easy Integration**: Simple Markdown or HTML snippets for embedding.
- **Secure Auth**: Uses Spotify OAuth 2.0 with state verification to prevent CSRF.
- **Deduplication**: Automatically maps repeat logins to the same UID based on Spotify ID.
- **Secure Sessions**: Uses signed, `httpOnly` cookies to protect user dashboards.
- **Multi-user Support**: Generates unique UIDs for multiple users on the same instance.

## 🚀 How It Works

1.  **Authentication**: Users visit the root URL and click "Connect Spotify". The service uses a `state` parameter to prevent CSRF attacks.
2.  **Authorization**: The service handles the OAuth callback, fetches your Spotify profile, and checks if you already have an account.
3.  **Storage**: Tokens and your display name are stored securely in **Google Cloud Firestore**, keyed by a unique UID.
4.  **Retrieval**: When someone views your widget, the service fetches your current playing track from the Spotify API.
5.  **Auto-Refresh**: If the access token is expired, the service automatically uses the refresh token to get a new one before fetching playback data.
6.  **Rendering**: The service returns a responsive HTML/CSS template representing your "Now Playing" status.

## 🛠️ Setup Instructions

This service allows users to provide their own Spotify Client ID and Secret, bypassing Spotify's developmental 25-user limit.

### 📋 Individual User Setup
To use this widget on your profile:
1.  Visit the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2.  Click **Create app** and give it a name (e.g., "My Profile Widget").
3.  In **Settings**, add the following **Redirect URI**:
    `https://spotify.beebombshell.com/callback` (or your instance URL).
4.  Copy your **Client ID** and **Client Secret**.
5.  Enter them on the [Home Page](https://spotify.beebombshell.com) to connect your account.

---

### ⚙️ Server Instance Setup (Self-Hosting)

If you want to host your own instance of this service:

#### 1. Firebase Setup
- Create a project in the [Firebase Console](https://console.firebase.google.com/).
- Enable **Firestore Database**.
- Go to **Project Settings** > **Service Accounts** and generate a new private key (JSON).

#### 2. Local Installation
```bash
git clone https://github.com/BeeBombshell/spotify-now-playing.git
cd now-playing
npm install
```

#### 3. Environment Variables
Create a `.env` file from `.env.example`:

| Variable | Description |
| :--- | :--- |
| `SESSION_SECRET` | A secure random string for signing cookies. |
| `REDIRECT_URI` | The callback URL (e.g., `https://your-domain.com/callback`). |
| `FIREBASE_PROJECT_ID` | Your Firebase Project ID. |
| `FIREBASE_SERVICE_ACCOUNT` | Raw JSON or Base64 encoded Service Account key. |
| `PORT` | Port to run the server (default 3000). |

#### 4. Running the App
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## 📖 Usage

Once the app is running:
1. Navigate to your app URL (e.g., `http://localhost:3000`).
2. Click **Connect Spotify** and authorize the app.
3. You will be redirected to a **Dashboard** containing your unique embed links.

### Embed in GitHub README
Add this to your `README.md`:

```markdown
[![Spotify Now Playing](https://your-service-url/now-playing?uid=YOUR_UID)](https://your-service-url/now-playing?uid=YOUR_UID)
```

## 🎨 Customization

The widget template is located in `src/template.ts`. You can easily modify the CSS and HTML structure to match your personal brand.

---
Created with ❤️ by [BeeBombshell](https://beebombshell.com)
