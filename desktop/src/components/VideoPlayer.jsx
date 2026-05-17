/**
 * FluxTV 视频播放器组件
 *
 * 功能：
 * - 支持 HLS (m3u8) 协议播放
 * - 支持直接 MP4/FLV 等流媒体播放
 * - 音量控制
 * - 播放/暂停控制
 * - 画中画模式
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Slider, Tooltip, message, Dropdown, Space } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SoundOutlined,
  MutedOutlined,
  ExpandOutlined,
  CompressOutlined,
  PictureOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import Hls from 'hls.js';

/**
 * 视频播放器组件
 * @param {Object} props
 * @param {string} props.src - 视频源地址
 * @param {string} props.title - 视频标题
 * @param {number} props.volume - 音量 (0-1)
 * @param {boolean} props.muted - 是否静音
 * @param {Function} props.onVolumeChange - 音量变化回调
 * @param {Function} props.onMuteChange - 静音状态变化回调
 */
function VideoPlayer({
  src,
  title = '未知频道',
  volume = 0.8,
  muted = false,
  onVolumeChange,
  onMuteChange,
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(volume);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimer = useRef(null);

  /**
   * 初始化 HLS.js
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setIsLoading(true);
    setError(null);
    setIsPlaying(false);

    /**
     * 清理函数
     */
    const cleanup = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };

    cleanup();

    /**
     * 检查是否为 HLS 流
     */
    if (src.includes('.m3u8') || src.includes('m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error('HLS Error:', data);
            setError(`播放错误: ${data.type}`);
            setIsLoading(false);
            message.error('直播源加载失败，请尝试其他频道');
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else {
        setError('您的浏览器不支持 HLS 播放');
      }
    } else {
      video.src = src;
      setIsLoading(false);
    }

    return cleanup;
  }, [src]);

  /**
   * 监听播放状态
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);
    const handleError = () => {
      setError('视频播放失败');
      setIsLoading(false);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('error', handleError);
    };
  }, []);

  /**
   * 更新音量
   */
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = currentVolume;
      video.muted = isMuted;
    }
  }, [currentVolume, isMuted]);

  /**
   * 处理播放/暂停
   */
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };

  /**
   * 处理音量调节
   */
  const handleVolumeChange = (value) => {
    const newVolume = value / 100;
    setCurrentVolume(newVolume);
    if (value === 0) {
      setIsMuted(true);
    } else if (isMuted && value > 0) {
      setIsMuted(false);
    }
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = (value === 0);
    }
    onVolumeChange?.(newVolume);
  };

  /**
   * 处理静音切换
   */
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
    onMuteChange?.(newMuted);
  };

  /**
   * 处理全屏切换
   */
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  /**
   * 监听全屏变化
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  /**
   * 处理画中画
   */
  const togglePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (error) {
      console.error('Picture-in-Picture error:', error);
    }
  };

  /**
   * 重新加载视频
   */
  const reload = () => {
    const video = videoRef.current;
    if (video) {
      video.load();
    }
  };

  return (
    <div
      ref={containerRef}
      className="video-container"
      style={{
        position: 'relative',
        backgroundColor: '#000',
        width: '100%',
        height: '100%',
      }}
    >
      {/* 视频元素 */}
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
        playsInline
      />

      {/* 加载状态 */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            fontSize: 24,
          }}
        >
          加载中...
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#ff4d4f',
            textAlign: 'center',
          }}
        >
          <p>{error}</p>
          <Button icon={<ReloadOutlined />} onClick={reload}>
            重试
          </Button>
        </div>
      )}

      {/* 控制栏 - 始终显示 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '24px 16px 16px',
          background: 'rgba(0,0,0,0.85)',
          zIndex: 100,
          borderTop: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* 播放/暂停按钮 */}
          <Tooltip title={isPlaying ? '暂停' : '播放'}>
            <Button
              type="text"
              size="large"
              icon={
                isPlaying ? (
                  <PauseCircleOutlined />
                ) : (
                  <PlayCircleOutlined />
                )
              }
              onClick={togglePlay}
              style={{ color: '#fff', fontSize: 28 }}
            />
          </Tooltip>

          {/* 频道名称 */}
          <span style={{ color: '#fff', fontSize: 14, flex: 1 }}>
            {title}
          </span>

          {/* 音量控制 */}
          <Space size={4}>
            <Tooltip title={isMuted ? '取消静音' : '静音'}>
              <Button
                type="text"
                icon={isMuted ? <MutedOutlined /> : <SoundOutlined />}
                onClick={toggleMute}
                style={{ color: '#fff' }}
              />
            </Tooltip>
            <Slider
              min={0}
              max={100}
              value={isMuted ? 0 : Math.round(currentVolume * 100)}
              onChange={handleVolumeChange}
              style={{ width: 120 }}
              tooltip={{ formatter: (v) => `${v}%` }}
            />
          </Space>

          {/* 画中画 */}
          <Tooltip title="画中画">
            <Button
              type="text"
              icon={<PictureOutlined />}
              onClick={togglePictureInPicture}
              style={{ color: '#fff' }}
            />
          </Tooltip>

          {/* 全屏 */}
          <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
            <Button
              type="text"
              icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
              onClick={toggleFullscreen}
              style={{ color: '#fff' }}
            />
          </Tooltip>
        </div>
      </div>

      {/* 点击播放/暂停 - 排除控制栏区域 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 70,
          cursor: 'pointer',
          zIndex: 5,
        }}
        onClick={togglePlay}
      />
    </div>
  );
}

export default VideoPlayer;
