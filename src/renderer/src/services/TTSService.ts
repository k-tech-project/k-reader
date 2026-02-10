/**
 * TTS (Text-to-Speech) 服务
 * 使用 Web Speech API 实现语音合成
 */
import { logger } from '@shared/utils/Logger';

export interface TTSVoice {
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

export interface TTSConfig {
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
}

export class TTSService {
  private synth: SpeechSynthesis | null = null;
  private voices: TTSVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private onEndCallback: (() => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
    }
  }

  /**
   * 加载可用语音
   */
  loadVoices(): void {
    if (!this.synth) return;

    try {
      const voices = this.synth.getVoices();
      this.voices = voices.map((voice) => ({
        name: voice.name,
        lang: voice.lang,
        localService: voice.localService,
        default: voice.default,
      }));
      logger.info(`Loaded ${this.voices.length} TTS voices`);
    } catch (error) {
      logger.error('Failed to load TTS voices', 'TTSService', error as Error);
    }
  }

  /**
   * 获取可用语音列表
   */
  getVoices(): TTSVoice[] {
    return this.voices;
  }

  /**
   * 根据语言筛选语音
   */
  getVoicesByLanguage(lang: string): TTSVoice[] {
    return this.voices.filter((voice) => voice.lang.startsWith(lang));
  }

  /**
   * 朗读文本
   */
  speak(text: string, config: TTSConfig): void {
    if (!this.synth) {
      throw new Error('Speech synthesis not supported');
    }

    // 取消当前朗读
    this.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.voices.find((v) => v.name === config.voice) || null;
    utterance.rate = config.rate;
    utterance.pitch = config.pitch;
    utterance.volume = config.volume;

    utterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
      logger.info('TTS started');
    };

    utterance.onend = () => {
      this.isPlaying = false;
      this.isPaused = false;
      this.currentUtterance = null;
      logger.info('TTS ended');
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };

    utterance.onerror = (event) => {
      this.isPlaying = false;
      this.isPaused = false;
      this.currentUtterance = null;
      const error = new Error(event.error || 'Unknown TTS error');
      logger.error('TTS error', 'TTSService', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  /**
   * 暂停
   */
  pause(): void {
    if (this.synth && this.isPlaying && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
      logger.info('TTS paused');
    }
  }

  /**
   * 恢复
   */
  resume(): void {
    if (this.synth && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      logger.info('TTS resumed');
    }
  }

  /**
   * 取消朗读
   */
  cancel(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isPlaying = false;
      this.isPaused = false;
      this.currentUtterance = null;
      logger.info('TTS cancelled');
    }
  }

  /**
   * 检查是否正在播放
   */
  getPlayingState(): { isPlaying: boolean; isPaused: boolean } {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
    };
  }

  /**
   * 设置播放结束回调
   */
  onEnd(callback: () => void): void {
    this.onEndCallback = callback;
  }

  /**
   * 设置错误回调
   */
  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.cancel();
    this.synth = null;
  }
}

// 单例实例
let ttsServiceInstance: TTSService | null = null;

export function getTTSService(): TTSService {
  if (!ttsServiceInstance) {
    ttsServiceInstance = new TTSService();
  }
  return ttsServiceInstance;
}
