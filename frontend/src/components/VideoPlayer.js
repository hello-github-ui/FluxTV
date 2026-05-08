/**
 * 视频播放器组件
 * 作者: 19920728
 * 创建日期: 2026-05-08 19:00:00
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import Hls from 'hls.js';
import 'video.js/dist/video-js.css';
import { Alert, Spin } from 'antd';

function VideoPlayer({ channel, onError }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);
  const isMountedRef = useRef(true);
  const initDoneRef = useRef(false); // 标记是否已初始化
  const videoElementRef = useRef(null);

  // 安全设置状态
  const safeSetState = useCallback((setter, value) => {
    if (isMountedRef.current) {
      setter(value);
    }
  }, []);

  // 初始化播放器
  const initPlayer = useCallback((container, videoElement, url) => {
    let player = null;
    let hls = null;

    try {
      player = videojs(videoElement, {
        controls: true,
        autoplay: false,
        preload: 'metadata',
        fluid: true,
        aspectRatio: '16:9',
        controlBar: {
          volumePanel: { inline: false }
        },
        html5: {
          vhs: {
            overrideNative: true
          }
        },
        bigPlayButton: true
      });
    } catch (e) {
      console.error('Failed to create player:', e);
      safeSetState(setError, '播放器创建失败');
      safeSetState(setLoading, false);
      safeSetState(setShowPlayOverlay, true);
      
      // 清理
      if (videoElement && videoElement.parentNode) {
        videoElement.parentNode.removeChild(videoElement);
      }
      return { player: null, hls: null };
    }

    // HLS播放逻辑
    const setupHLS = () => {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          debug: false
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          safeSetState(setLoading, false);
          // 自动播放，如果失败则显示播放按钮
          videoElement.play().catch(() => {
            safeSetState(setShowPlayOverlay, true);
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS Error:', data);
          safeSetState(setLoading, false);
          safeSetState(setShowPlayOverlay, true);
          
          let errorMsg = '直播源加载失败';
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                errorMsg = data.details === 'manifestLoadError' 
                  ? '无法加载直播源，可能是跨域限制或链接失效'
                  : '网络错误';
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                errorMsg = '媒体格式错误';
                break;
              default:
                errorMsg = '播放出错';
            }
            safeSetState(setError, errorMsg);
            onError && onError(errorMsg);
          }
        });

        try {
          hls.loadSource(url);
          hls.attachMedia(videoElement);
        } catch (e) {
          console.error('HLS load error:', e);
          safeSetState(setError, '加载直播源失败');
          safeSetState(setLoading, false);
          safeSetState(setShowPlayOverlay, true);
        }
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = url;
        videoElement.addEventListener('loadedmetadata', () => {
          safeSetState(setLoading, false);
          videoElement.play().catch(() => {
            safeSetState(setShowPlayOverlay, true);
          });
        });
        videoElement.addEventListener('error', () => {
          safeSetState(setLoading, false);
          safeSetState(setError, '播放失败');
          safeSetState(setShowPlayOverlay, true);
        });
      } else {
        safeSetState(setLoading, false);
        safeSetState(setError, '您的浏览器不支持HLS播放');
        safeSetState(setShowPlayOverlay, true);
      }
    };

    // 根据URL类型设置播放
    if (url.includes('.m3u8') || url.includes('hls')) {
      setupHLS();
    } else if (url.startsWith('rtmp://')) {
      safeSetState(setLoading, false);
      safeSetState(setError, 'RTMP协议需要Flash支持，现代浏览器已不支持');
      safeSetState(setShowPlayOverlay, true);
    } else {
      try {
        player.src({
          src: url,
          type: 'video/mp4'
        });
        
        player.on('loadedmetadata', () => {
          safeSetState(setLoading, false);
          videoElement.play().catch(() => {
            safeSetState(setShowPlayOverlay, true);
          });
        });
      } catch (e) {
        console.error('Set source error:', e);
        safeSetState(setError, '设置播放源失败');
        safeSetState(setLoading, false);
        safeSetState(setShowPlayOverlay, true);
      }
    }

    // 播放器错误处理
    player.on('error', () => {
      try {
        const playerError = player.error();
        console.error('Player Error:', playerError);
        safeSetState(setLoading, false);
        safeSetState(setShowPlayOverlay, true);
        
        let errorMsg = '播放出错';
        if (playerError) {
          switch (playerError.code) {
            case 2: errorMsg = '网络错误'; break;
            case 3: errorMsg = '视频解码错误'; break;
            case 4: errorMsg = '不支持的格式'; break;
          }
        }
        safeSetState(setError, errorMsg);
        onError && onError(errorMsg);
      } catch (e) {
        console.error('Error handler error:', e);
      }
    });

    // 播放开始时隐藏覆盖层
    player.on('play', () => {
      safeSetState(setShowPlayOverlay, false);
    });

    // 暂停时显示覆盖层
    player.on('pause', () => {
      if (!player.ended()) {
        safeSetState(setShowPlayOverlay, true);
      }
    });

    return { player, hls };
  }, [safeSetState, onError]);

  // 手动播放
  const handlePlay = () => {
    if (videoElementRef.current) {
      videoElementRef.current.play().catch(err => {
        console.error('Play failed:', err);
      });
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    initDoneRef.current = false;
    
    // 重置状态
    safeSetState(setLoading, true);
    safeSetState(setError, null);
    safeSetState(setShowPlayOverlay, false);

    // 如果没有频道信息，直接返回
    if (!channel || !channel.url) {
      safeSetState(setError, '无效的频道信息');
      safeSetState(setLoading, false);
      safeSetState(setShowPlayOverlay, true);
      
      return () => {
        isMountedRef.current = false;
      };
    }

    // 使用后端代理访问直播源，解决CORS问题
    // 使用完整的后端地址，避免React开发服务器代理路径重写问题
    const backendHost = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
    const proxyUrl = `${backendHost}/api/proxy/stream?url=${encodeURIComponent(channel.url)}`;
    let player = null;
    let hls = null;
    let videoElement = null;

    // 使用 setTimeout 延迟初始化，确保容器已挂载
    const initTimeout = setTimeout(() => {
      const container = containerRef.current;
      if (!container) {
        safeSetState(setError, '容器元素不存在');
        safeSetState(setLoading, false);
        safeSetState(setShowPlayOverlay, true);
        return;
      }

      // 创建独立的video元素，不使用React ref
      videoElement = document.createElement('video');
      videoElementRef.current = videoElement;
      videoElement.className = 'video-js vjs-big-play-centered';
      videoElement.playsInline = true;
      videoElement.style.borderRadius = '8px';
      
      // 添加到容器
      container.appendChild(videoElement);

      // 初始化播放器
      const result = initPlayer(container, videoElement, proxyUrl);
      player = result.player;
      hls = result.hls;
      initDoneRef.current = true;
    }, 0); // 在下一个事件循环中执行

    // 清理函数
    const cleanup = () => {
      isMountedRef.current = false;
      
      // 清除初始化定时器
      clearTimeout(initTimeout);
      
      // 使用微任务延迟清理
      Promise.resolve().then(() => {
        // 销毁HLS实例
        if (hls) {
          try {
            hls.destroy();
            hls = null;
          } catch (e) {
            console.warn('HLS destroy error:', e);
          }
        }
        
        // 销毁播放器
        if (player) {
          try {
            player.pause();
            player.dispose();
            player = null;
          } catch (e) {
            console.warn('Player dispose error:', e);
          }
        }
        
        // 移除video元素
        if (videoElement && videoElement.parentNode) {
          try {
            videoElement.parentNode.removeChild(videoElement);
            videoElement = null;
            videoElementRef.current = null;
          } catch (e) {
            console.warn('Remove video element error:', e);
          }
        }
      });
    };

    return cleanup;
  }, [channel, safeSetState, initPlayer]);

  // 显示错误信息
  if (error) {
    return (
      <div style={{ 
        width: '100%', 
        aspectRatio: '16/9',
        background: '#1b2838',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px'
      }}>
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ maxWidth: '80%' }}
        />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#1b2838',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <Spin size="large" />
            <p style={{ color: '#8b949e', marginTop: '16px' }}>正在连接直播源...</p>
          </div>
        </div>
      )}
      
      {/* 播放覆盖层 */}
      {showPlayOverlay && !loading && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(27, 40, 56, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          onClick={handlePlay}
        >
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(99, 102, 241, 0.9)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          >
            <svg 
              width="40" 
              height="40" 
              viewBox="0 0 24 24" 
              fill="#fff"
              style={{ marginLeft: '4px' }}
            >
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          aspectRatio: '16/9',
          background: '#1b2838',
          borderRadius: '8px',
          overflow: 'hidden'
        }} 
      />
    </div>
  );
}

export default VideoPlayer;