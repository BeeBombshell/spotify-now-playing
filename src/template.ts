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
