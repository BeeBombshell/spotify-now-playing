export const getSVGTemplate = (data: any, albumArtBase64?: string | null) => {
  const width = 350;
  const height = 114;

  if (!data || !data.item) {
    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" rx="16" fill="#121212" />
        <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="15.5" stroke="white" stroke-opacity="0.1" />
        <text fill="#A7A7A7" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">Not playing anything</text>
      </svg>
    `;
  }

  const { item, is_playing } = data;
  const trackName = item.name.replace(/&/g, '&amp;');
  const artistName = item.artists.map((a: any) => a.name).join(', ').replace(/&/g, '&amp;');
  const albumArt = albumArtBase64 || item.album.images[0].url;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        .track-name { font: 600 16px 'Outfit', 'Inter', sans-serif; fill: white; }
        .artist-name { font: 400 14px 'Outfit', 'Inter', sans-serif; fill: #b3b3b3; }
        .status-text { font: 600 11px 'Outfit', 'Inter', sans-serif; fill: #1DB954; text-transform: uppercase; letter-spacing: 0.1em; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
      </style>
      
      <rect width="${width}" height="${height}" rx="16" fill="#121212" />
      <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="15.5" stroke="white" stroke-opacity="0.1" />
      
      <clipPath id="albumArtClip">
        <rect x="16" y="17" width="80" height="80" rx="12" />
      </clipPath>
      
      <image href="${albumArt}" x="16" y="17" width="80" height="80" clip-path="url(#albumArtClip)" preserveAspectRatio="xMidYMid slice" />
      
      <g transform="translate(112, 35)">
        <text class="track-name" x="0" y="0">${trackName}</text>
        <text class="artist-name" x="0" y="22">${artistName}</text>
        
        <g transform="translate(0, 48)">
          <circle class="pulse" cx="4" cy="4" r="4" fill="#1DB954" style="transform-origin: 4px 4px;" />
          <text class="status-text" x="16" y="7.5">${is_playing ? 'Currently Playing' : 'Paused'}</text>
        </g>
      </g>
    </svg>
  `;
};

export const getTemplate = (data: any) => {
  if (!data || !data.item) {
    return `
      <div id="spotify-widget" style="font-family: 'Inter', sans-serif; background: #121212; color: #fff; padding: 20px; border-radius: 12px; width: 300px; display: flex; align-items: center; justify-content: center; border: 1px solid #333;">
        <p style="margin: 0; font-size: 14px; color: #b3b3b3;">Not playing anything</p>
      </div>
    `;
  }

  const { item, is_playing } = data;
  const trackName = item.name;
  const artistName = item.artists.map((a: any) => a.name).join(', ');
  const albumImageUrl = item.album.images[0].url;
  const trackUrl = item.external_urls.spotify;

  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600&display=swap');
      #spotify-widget {
        font-family: 'Outfit', sans-serif;
        background: rgba(18, 18, 18, 0.8);
        backdrop-filter: blur(10px);
        color: #fff;
        padding: 16px;
        border-radius: 16px;
        width: 350px;
        display: flex;
        align-items: center;
        gap: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        text-decoration: none;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      }
      #spotify-widget:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(0,0,0,0.6);
        border-color: #1DB954;
        background: rgba(24, 24, 24, 0.9);
      }
      .album-art {
        width: 80px;
        height: 80px;
        border-radius: 12px;
        object-fit: cover;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      }
      .track-info {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        flex: 1;
      }
      .track-name {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #fff;
        letter-spacing: -0.01em;
      }
      .artist-name {
        font-size: 14px;
        color: #b3b3b3;
        margin: 4px 0 0 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .status {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
      }
      .status-dot {
        width: 8px;
        height: 8px;
        background: #1DB954;
        border-radius: 50%;
        box-shadow: 0 0 12px rgba(29, 185, 84, 0.6);
        animation: pulse 2s infinite;
      }
      .status-text {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #1DB954;
        font-weight: 600;
      }
      @keyframes pulse {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.1); }
        100% { opacity: 1; transform: scale(1); }
      }
    </style>
    <a id="spotify-widget" href="${trackUrl}" target="_blank">
      <img src="${albumImageUrl}" class="album-art" alt="Album Art">
      <div class="track-info">
        <p class="track-name">${trackName}</p>
        <p class="artist-name">${artistName}</p>
        <div class="status">
          <div class="status-dot"></div>
          <span class="status-text">${is_playing ? 'Currently Playing' : 'Paused'}</span>
        </div>
      </div>
    </a>
  `;
};
