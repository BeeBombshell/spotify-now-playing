import axios from 'axios';
import dotenv from 'dotenv';
import { getUser, saveUser } from './storage';

dotenv.config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_SECRET_ID;
const REDIRECT_URI = process.env.REDIRECT_URI || "https://spotify.beebombshell.com/callback";

export const getAuthUrl = () => {
  const scope = 'user-read-currently-playing user-read-playback-state user-read-private';
  return `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(
    scope
  )}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
};

export const getTokens = async (code: string) => {
  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  return response.data;
};

export const getSpotifyProfile = async (accessToken: string) => {
  const response = await axios.get('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

export const refreshAccessToken = async (uid: string) => {
  const user = await getUser(uid);
  if (!user) throw new Error('User not found');

  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: user.refreshToken,
    }),
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  const { access_token, expires_in, refresh_token } = response.data;
  await saveUser(uid, {
    spotifyId: user.spotifyId,
    displayName: user.displayName,
    accessToken: access_token,
    refreshToken: refresh_token || user.refreshToken,
    expiresAt: Date.now() + expires_in * 1000,
  });

  return access_token;
};

export const getNowPlaying = async (uid: string) => {
  let user = await getUser(uid);
  if (!user) return null;

  if (Date.now() > user.expiresAt) {
    const newAccessToken = await refreshAccessToken(uid);
    user.accessToken = newAccessToken;
  }

  try {
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
      },
    });

    if (response.status === 204 || response.status > 400 || !response.data) {
      return null;
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching now playing track:', error);
    return null;
  }
};
