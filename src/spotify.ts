import axios from 'axios';
import dotenv from 'dotenv';
import NodeCache from 'node-cache';
import { getUser, saveUser } from './storage';

dotenv.config();

const cache = new NodeCache({ stdTTL: 30 }); // Cache for 30 seconds

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_SECRET_ID;
const REDIRECT_URI = process.env.REDIRECT_URI || "https://spotify.beebombshell.com/callback";

export const getAuthUrl = (state: string, clientId: string) => {
  const scope = 'user-read-currently-playing user-read-playback-state user-read-private user-read-recently-played';
  return `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(
    scope
  )}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}`;
};

export const getTokens = async (code: string, clientId: string, clientSecret: string) => {
  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
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
        Authorization: `Basic ${Buffer.from(`${user.clientId}:${user.clientSecret}`).toString('base64')}`,
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
    clientId: user.clientId,
    clientSecret: user.clientSecret,
  });

  return access_token;
};

export const getNowPlaying = async (uid: string) => {
  const cachedData = cache.get(uid);
  if (cachedData) return cachedData;

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

    if (response.status === 204 || response.status > 400 || !response.data || !response.data.item) {
      // Nothing currently playing, fallback to lastPlayed from DB
      if (user.lastPlayed) {
        const fallbackData = {
          ...user.lastPlayed,
          is_playing: false,
          is_fallback: true
        };
        cache.set(uid, fallbackData);
        return fallbackData;
      }
      
      // If no lastPlayed in DB, try to fetch from Spotify recently-played (as extra fallback)
      try {
        const recentResponse = await axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        });
        if (recentResponse.data && recentResponse.data.items && recentResponse.data.items.length > 0) {
          const recentTrack = recentResponse.data.items[0].track;
          const fallbackData = {
            item: recentTrack,
            is_playing: false,
            is_fallback: true
          };
          
          // Save this as lastPlayed for future
          saveUser(uid, {
            ...user,
            lastPlayed: { item: recentTrack }
          } as any);

          cache.set(uid, fallbackData);
          return fallbackData;
        }
      } catch (e) {
        console.error('Error fetching recently played as fallback:', e);
      }

      cache.set(uid, null);
      return null;
    }

    const data = {
      ...response.data,
      is_fallback: false
    };

    // Update lastPlayed in DB whenever we get a fresh track
    saveUser(uid, {
      ...user,
      lastPlayed: { item: data.item }
    } as any);

    cache.set(uid, data);
    return data;
  } catch (error) {
    console.error('Error fetching now playing track:', error);
    // Even on error, try fallback
    if (user.lastPlayed) {
      return { ...user.lastPlayed, is_playing: false, is_fallback: true };
    }
    return null;
  }
};
export const getImageBase64 = async (url: string) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const mimeType = response.headers['content-type'];
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error('Error fetching image for base64 conversion:', error);
    return null;
  }
};
