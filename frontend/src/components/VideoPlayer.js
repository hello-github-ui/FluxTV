/**
 * 视频播放器组件
 * 作者: 19920728
 * 创建日期: 2026-05-07 17:30:00
 */

import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import Hls from 'hls.js';
import 'video.js/dist/video-js.css';

function VideoPlayer({ channel, onError }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    // 销毁旧播放器
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    if (!channel || !channel.url) return;

    // 创建播放器
    const videoElement = videoRef.current;
    playerRef.current = videojs(videoElement, {
      controls: true,
      autoplay: true,
      preload: 'auto',
      fluid: true,
      aspectRatio: '16:9',
      controlBar: {
        volumePanel: { inline: false }
      },
      poster: 'https://via.placeholder.com/1280x720?text=Loading...'
    });

    // 处理不同协议
    const url = channel.url;
    
    if (url.includes('.m3u8') || url.includes('hls')) {
      // HLS协议
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        
        hls.loadSource(url);
        hls.attachMedia(videoElement);
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS Error:', data);
          if (data.fatal) {
            onError && onError('无法加载直播源');
          }
        });
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari原生HLS支持
        videoElement.src = url;
      }
    } else {
      // 其他协议（RTMP等）
      playerRef.current.src({
        src: url,
        type: 'rtmp/mp4'
      });
    }

    // 播放器错误处理
    playerRef.current.on('error', () => {
      console.error('Player Error:', playerRef.current.error());
      onError && onError('播放出错');
    });

    // 清理函数
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [channel]);

  return (
    <div style={{ width: '100%' }}>
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered"
        playsInline
      />
    </div>
  );
}

export default VideoPlayer;