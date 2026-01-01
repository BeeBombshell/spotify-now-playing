# 🎵 Spotify Now Playing Widget

A minimalist, high-performance service to display your live Spotify activity on your GitHub profile, personal website, or blog.

![Preview Example](https://img.shields.io/badge/Status-Live-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Firebase](https://img.shields.io/badge/Storage-Firestore-orange)

## ✨ Features

- **Real-time Updates**: Reflects what you are currently listening to on Spotify.
- **Dynamic Styling**: Beautifully designed SVG-like HTML templates that look great in any theme.
- **Easy Integration**: Simple Markdown or HTML snippets for embedding.
- **Secure Auth**: Uses Spotify OAuth 2.0 with Firestore for persistent credential storage and automatic token refreshing.
- **Multi-user Support**: Generates unique UIDs for multiple users on the same instance.

## 🚀 How It Works

1.  **Authentication**: Users visit the root URL and click "Connect Spotify".
2.  **Authorization**: The service handles the OAuth callback, fetches access/refresh tokens, and generates a unique UID.
3.  **Storage**: Tokens are stored securely in **Google Cloud Firestore**.
4.  **Retrieval**: When someone views your widget, the service fetches your current playing track from the Spotify API.
5.  **Auto-Refresh**: If the access token is expired, the service automatically uses the refresh token to get a new one before fetching playback data.
6.  **Rendering**: The service returns a responsive HTML/CSS template representing your "Now Playing" status.

## 🛠️ Setup Instructions

### 1. Spotify Developer Setup
- Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
- Create a new App.
- Add `http://localhost:3000/callback` (or your production URL) to the **Redirect URIs**.
- Note down your **Client ID** and **Client Secret**.

### 2. Firebase Setup
- Create a project in the [Firebase Console](https://console.firebase.google.com/).
- Enable **Firestore Database**.
- Go to **Project Settings** > **Service Accounts**.
- Generate a new private key (JSON).
- Copy the content of the JSON file (or base64 encode it) for the environment variables.

### 3. Local Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd now-playing

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your Spotify and Firebase credentials
```

### 4. Environment Variables

| Variable | Description |
| :--- | :--- |
| `SPOTIFY_CLIENT_ID` | Your Spotify App Client ID |
| `SPOTIFY_SECRET_ID` | Your Spotify App Client Secret |
| `REDIRECT_URI` | Must match Spotify App settings |
| `PORT` | Port to run the server (default 3000) |
| `FIREBASE_PROJECT_ID` | Your Firebase Project ID |
| `FIREBASE_SERVICE_ACCOUNT` | Raw JSON or Base64 encoded Service Account key |

### 5. Running the App

```bash
# Development mode (with nodemon)
npm run dev

# Build and Start
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
Created with ❤️ by [BeeBombshell](https://github.com/BeeBombshell)
