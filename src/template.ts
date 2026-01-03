const truncate = (str: string, n: number) => {
  return str.length > n ? str.slice(0, n - 1) + '...' : str;
};

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const FONT_STACK = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const getSVGTemplate = (data: any, albumArtBase64?: string | null) => {
  const width = 350;
  const height = 114;

  if (!data || !data.item) {
    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" rx="16" fill="#121212" />
        <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="15.5" stroke="white" stroke-opacity="0.1" />
        <text fill="#A7A7A7" font-family="${FONT_STACK}" font-size="14" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">Not playing anything</text>
      </svg>
    `;
  }

  const { item, is_playing, is_fallback } = data;
  const trackName = escapeHtml(truncate(item.name, 35));
  const artistName = escapeHtml(truncate(item.artists.map((a: any) => a.name).join(', '), 45));
  const albumArt = albumArtBase64 || item.album.images[0].url;
  const statusLabel = is_fallback ? 'Recently Played' : (is_playing ? 'Currently Playing' : 'Paused');
  const statusColor = is_fallback ? '#A7A7A7' : '#1DB954';

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600&amp;display=swap');
        .track-name { font: 600 16px ${FONT_STACK}; fill: white; }
        .artist-name { font: 400 14px ${FONT_STACK}; fill: #b3b3b3; }
        .status-text { font: 600 11px ${FONT_STACK}; fill: ${statusColor}; text-transform: uppercase; letter-spacing: 0.1em; }
        
        .bars-container { display: ${is_playing ? 'block' : 'none'}; }
        .bar { 
          fill: #1DB954; 
          animation: equalize 1s infinite; 
          transform-origin: bottom;
          transform-box: fill-box;
        }
        .bar:nth-child(1) { animation-delay: 0.1s; }
        .bar:nth-child(2) { animation-delay: 0.3s; }
        .bar:nth-child(3) { animation-delay: 0.5s; }
        .bar:nth-child(4) { animation-delay: 0.2s; }

        @keyframes equalize {
          0% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
          100% { transform: scaleY(0.3); }
        }

        .fade-in { animation: fadeIn 0.8s ease-out forwards; opacity: 0; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .pulse { animation: pulse 2s infinite; display: ${!is_playing ? 'block' : 'none'}; }
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
      </style>
      
      <g class="fade-in">
        <rect width="${width}" height="${height}" rx="16" fill="#121212" />
        <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="15.5" stroke="white" stroke-opacity="0.1" />
        
        <clipPath id="albumArtClip">
          <rect x="16" y="17" width="80" height="80" rx="12" />
        </clipPath>
        
        <image href="${albumArt}" x="16" y="17" width="80" height="80" clip-path="url(#albumArtClip)" preserveAspectRatio="xMidYMid slice" />
        
        <g transform="translate(112, 35)">
          <text class="track-name" x="0" y="0">${trackName}</text>
          <text class="artist-name" x="0" y="22">${artistName}</text>
          
          <g transform="translate(0, 40)">
            ${is_playing ? `
              <g class="bars-container" transform="translate(0, 1)">
                <rect class="bar" x="0" y="0" width="3" height="12" rx="1.5" />
                <rect class="bar" x="5" y="0" width="3" height="12" rx="1.5" />
                <rect class="bar" x="10" y="0" width="3" height="12" rx="1.5" />
                <rect class="bar" x="15" y="0" width="3" height="12" rx="1.5" />
              </g>
            ` : `
              <circle class="pulse" cx="4" cy="7" r="4" fill="${statusColor}" style="transform-origin: 4px 7px;" />
            `}
            <text class="status-text" x="${is_playing ? 24 : 16}" y="11">${statusLabel}</text>
          </g>
        </g>
      </g>
    </svg>
  `;
};

export const getTemplate = (data: any) => {
  if (!data || !data.item) {
    return `
      <div id="spotify-widget" style="font-family: ${FONT_STACK}; background: #121212; color: #fff; padding: 20px; border-radius: 12px; width: 300px; display: flex; align-items: center; justify-content: center; border: 1px solid #333;">
        <p style="margin: 0; font-size: 14px; color: #b3b3b3;">Not playing anything</p>
      </div>
    `;
  }

  const { item, is_playing, is_fallback } = data;
  const trackName = item.name;
  const artistName = item.artists.map((a: any) => a.name).join(', ');
  const albumImageUrl = item.album.images[0].url;
  const trackUrl = item.external_urls.spotify;
  const statusLabel = is_fallback ? 'Recently Played' : (is_playing ? 'Currently Playing' : 'Paused');
  const statusColor = is_fallback ? '#A7A7A7' : '#1DB954';

  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600&display=swap');
      #spotify-widget {
        font-family: ${FONT_STACK};
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
        animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      #spotify-widget:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(0,0,0,0.6);
        border-color: ${statusColor};
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
        background: ${statusColor};
        border-radius: 50%;
        box-shadow: 0 0 12px ${statusColor}66;
        animation: pulse 2s infinite;
      }
      .status-text {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: ${statusColor};
        font-weight: 600;
      }
      .audio-bars {
        display: ${is_playing ? 'flex' : 'none'};
        align-items: flex-end;
        gap: 2px;
        height: 12px;
      }
      .audio-bars div {
        width: 3px;
        background: #1DB954;
        animation: equalize 1s infinite;
        border-radius: 1px;
      }
      @keyframes equalize {
        0% { height: 4px; }
        50% { height: 12px; }
        100% { height: 4px; }
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
          ${is_playing ? `
            <div class="audio-bars">
              <div style="animation-delay: 0.1s"></div>
              <div style="animation-delay: 0.3s"></div>
              <div style="animation-delay: 0.5s"></div>
              <div style="animation-delay: 0.2s"></div>
            </div>
          ` : `
            <div class="status-dot"></div>
          `}
          <span class="status-text">${statusLabel}</span>
        </div>
      </div>
    </a>
  `;
};

