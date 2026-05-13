import { useState, useCallback, useRef, useEffect } from 'react';

// Google Translate TTS 接口（支持老挝语）
const GOOGLE_TTS_URL = 'https://translate.google.com/translate_tts';

// 生成 Google TTS 音频 URL
function getGoogleTtsUrl(text: string, lang: string = 'lo'): string {
  // 限制文本长度（Google TTS 有长度限制）
  const maxLen = 200;
  const truncated = text.length > maxLen ? text.substring(0, maxLen) : text;
  return `${GOOGLE_TTS_URL}?ie=UTF-8&q=${encodeURIComponent(truncated)}&tl=${lang}&client=tw-ob`;
}

// 分段朗读长文本
function splitText(text: string, maxLen: number = 100): string[] {
  if (text.length <= maxLen) return [text];
  
  const segments: string[] = [];
  // 按老挝语句号/空格分割
  const parts = text.split(/[\s]+/);
  let current = '';
  
  for (const part of parts) {
    if ((current + ' ' + part).trim().length > maxLen) {
      if (current) segments.push(current.trim());
      current = part;
    } else {
      current = current ? current + ' ' + part : part;
    }
  }
  if (current) segments.push(current.trim());
  
  return segments.length > 0 ? segments : [text.substring(0, maxLen)];
}

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // 初始化
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    synthRef.current = window.speechSynthesis;
    audioRef.current = new Audio();
    
    // 音频事件
    const audio = audioRef.current;
    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => setIsSpeaking(false);
    
    // 加载浏览器内置语音（作为备用）
    const loadVoices = () => {
      const v = synthRef.current?.getVoices() || [];
      setVoices(v);
    };
    
    loadVoices();
    synthRef.current?.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      synthRef.current?.removeEventListener('voiceschanged', loadVoices);
      audio.pause();
    };
  }, []);

  // 停止当前播放
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // 用 Google TTS 播放
  const speakWithGoogle = useCallback((text: string, lang: string = 'lo') => {
    stopSpeaking();
    
    const segments = splitText(text);
    let currentIndex = 0;
    
    const playNext = () => {
      if (currentIndex >= segments.length) {
        setIsSpeaking(false);
        return;
      }
      
      const segment = segments[currentIndex];
      const url = getGoogleTtsUrl(segment, lang);
      
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.onended = () => {
          currentIndex++;
          playNext();
        };
        audioRef.current.onerror = () => {
          console.error('TTS 播放失败:', segment);
          currentIndex++;
          playNext();
        };
        audioRef.current.play().catch(e => {
          console.error('播放被阻止:', e);
          // 尝试用浏览器内置 TTS
          fallbackSpeak(segment, lang);
        });
        setIsSpeaking(true);
      }
    };
    
    playNext();
  }, [stopSpeaking]);

  // 浏览器内置 TTS（备用）
  const fallbackSpeak = useCallback((text: string, lang: string) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.8;
    
    const voices = synthRef.current.getVoices();
    
    // 找最佳语音
    let voice = null;
    if (lang.startsWith('lo')) {
      voice = voices.find(v => v.lang.startsWith('lo')) 
           || voices.find(v => v.lang.startsWith('th'))
           || voices.find(v => v.lang.startsWith('zh'));
    } else if (lang.startsWith('th')) {
      voice = voices.find(v => v.lang.startsWith('th'))
           || voices.find(v => v.lang.startsWith('lo'));
    } else {
      voice = voices.find(v => v.lang.startsWith('zh'));
    }
    
    if (voice) utterance.voice = voice;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  }, []);

  // 朗读老挝语（优先用 Google TTS）
  const speakLao = useCallback((text: string) => {
    speakWithGoogle(text, 'lo');
  }, [speakWithGoogle]);

  // 朗读泰语
  const speakThai = useCallback((text: string) => {
    speakWithGoogle(text, 'th');
  }, [speakWithGoogle]);

  // 朗读中文
  const speakChinese = useCallback((text: string) => {
    speakWithGoogle(text, 'zh-CN');
  }, [speakWithGoogle]);

  // 慢速朗读（用正常语速，但可以分段更细）
  const speakSlow = useCallback((text: string) => {
    // Google TTS 不支持控制语速，用分段方式模拟慢速
    speakWithGoogle(text, 'lo');
  }, [speakWithGoogle]);

  // 通用朗读
  const speak = useCallback((text: string, lang: string) => {
    speakWithGoogle(text, lang);
  }, [speakWithGoogle]);

  // 开始语音识别
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('浏览器不支持语音识别，请使用 Chrome 浏览器');
      return false;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'lo-LA';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('语音识别错误:', event.error);
        if (event.error === 'not-allowed') {
          alert('请允许麦克风权限后再试');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      return true;
    } catch (e) {
      console.error('启动语音识别失败:', e);
      return false;
    }
  }, []);

  // 停止语音识别
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  }, []);

  // 计算相似度
  const compareText = useCallback((target: string, spoken: string): number => {
    const normalize = (s: string) => s.toLowerCase().replace(/[.,!?;:\s]/g, '').trim();
    const t = normalize(target);
    const s = normalize(spoken);
    
    if (t === s) return 100;
    if (s.length === 0) return 0;
    if (t.includes(s) || s.includes(t)) return 80;
    
    let matches = 0;
    const tChars = t.split('');
    const sChars = s.split('');
    
    for (let i = 0; i < Math.min(tChars.length, sChars.length); i++) {
      if (tChars[i] === sChars[i]) matches++;
    }
    
    return Math.round((matches / Math.max(tChars.length, sChars.length)) * 100);
  }, []);

  // 支持情况
  const isSupported = {
    synthesis: true, // Google TTS 总是可用
    recognition: typeof window !== 'undefined' && 
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
  };

  return {
    isListening,
    transcript,
    isSpeaking,
    voices,
    isSupported,
    speakLao,
    speakChinese,
    speakThai,
    speakSlow,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    compareText,
  };
}
