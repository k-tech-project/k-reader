/**
 * TTS 播放器控制组件
 */
import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX, X } from '../../utils/icons';
import { getTTSService, type TTSConfig, type TTSVoice } from '../../services/TTSService';

interface TTSPlayerProps {
  bookId?: string;
  text?: string;
  onTextChange?: (text: string) => void;
  onClose?: () => void;
  className?: string;
}

export function TTSPlayer({ bookId, text = '', onTextChange, onClose, className }: TTSPlayerProps) {
  const ttsService = getTTSService();

  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);

  // 加载语音列表
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = ttsService.getVoices();
      setVoices(availableVoices);

      // 选择默认语音或中文语音
      const defaultVoice = availableVoices.find((v) => v.default) ||
                          availableVoices.find((v) => v.lang.startsWith('zh')) ||
                          availableVoices.find((v) => v.lang.startsWith('en'));
      if (defaultVoice) {
        setSelectedVoice(defaultVoice.name);
      }
    };

    loadVoices();

    // 监听语音列表变化
    const handleVoicesChanged = () => {
      loadVoices();
    };

    if ('speechSynthesis' in window) {
      speechSynthesis.onvoiceschanged = handleVoicesChanged;
    }

    return () => {
      if ('speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // 监听播放状态
  useEffect(() => {
    const checkState = () => {
      const state = ttsService.getPlayingState();
      setIsPlaying(state.isPlaying);
      setIsPaused(state.isPaused);
    };

    const interval = setInterval(checkState, 100);
    return () => clearInterval(interval);
  }, []);

  // 配置对象
  const config: TTSConfig = {
    voice: selectedVoice,
    rate,
    pitch,
    volume,
  };

  // 播放
  const handlePlay = () => {
    if (!text.trim()) {
      return;
    }

    if (isPaused) {
      ttsService.resume();
      return;
    }

    ttsService.onEnd(() => {
      setIsPlaying(false);
    });

    ttsService.speak(text, config);
  };

  // 暂停
  const handlePause = () => {
    if (isPlaying && !isPaused) {
      ttsService.pause();
      setIsPaused(true);
    } else if (isPaused) {
      ttsService.resume();
      setIsPaused(false);
    }
  };

  // 停止
  const handleStop = () => {
    ttsService.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  // 调整语速
  const handleRateChange = (newRate: number) => {
    setRate(newRate);
  };

  // 调整音调
  const handlePitchChange = (newPitch: number) => {
    setPitch(newPitch);
  };

  // 调整音量
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className || ''}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">语音朗读</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 控制区域 */}
      <div className="p-4 space-y-4">
        {/* 文本显示 */}
        {text && (
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg max-h-32 overflow-y-auto">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-4">
              {text}
            </p>
          </div>
        )}

        {/* 播放控制 */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={handlePlay}
            disabled={!text.trim() || isPlaying}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title={isPaused ? '继续' : '播放'}
          >
            {isPaused ? (
              <Play className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>

          <button
            onClick={handlePause}
            disabled={!isPlaying}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="暂停"
          >
            <Pause className="h-4 w-4" />
          </button>

          <button
            onClick={handleStop}
            disabled={!isPlaying}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="停止"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 状态指示 */}
        {isPlaying && (
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isPaused ? '已暂停' : '正在播放...'}
            </p>
          </div>
        )}

        {/* 设置控制 */}
        <div className="space-y-3">
          {/* 语速控制 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">语速</label>
              <span className="text-xs text-gray-500 dark:text-gray-400">{rate.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => handleRateChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.5x</span>
              <span>1x</span>
              <span>2x</span>
            </div>
          </div>

          {/* 音调控制 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">音调</label>
              <span className="text-xs text-gray-500 dark:text-gray-400">{pitch.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>低</span>
              <span>正常</span>
              <span>高</span>
            </div>
          </div>

          {/* 音量控制 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">音量</label>
              <button
                onClick={() => setShowVolumeControl(!showVolumeControl)}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>

          {/* 语音选择 */}
          {voices.length > 0 && (
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                语音
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TTSPlayer;
