import { useState, useCallback, useRef, useEffect } from 'react';

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // 加载语音列表
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    synthRef.current = window.speechSynthesis;
    
    const loadVoices = () => {
      const v = synthRef.current?.getVoices() || [];
      setVoices(v);
      console.log('可用语音:', v.map(v => `${v.name} (${v.lang})`));
    };
    
    loadVoices();
    synthRef.current?.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      synthRef.current?.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // 找最佳匹配语音
  const findVoice = useCallback((lang: string): SpeechSynthesisVoice | null => {
    if (voices.length === 0) return null;
    
    // 精确匹配
    let voice = voices.find(v => v.lang === lang);
    if (voice) return voice;
    
    // 语言前缀匹配 (lo-LA -> lo)
    const langPrefix = lang.split('-')[0];
    voice = voices.find(v => v.lang.startsWith(langPrefix));
    if (voice) return voice;
    
    // 泰语作为近似（老挝语和泰语很接近）
    if (langPrefix === 'lo') {
      voice = voices.find(v => v.lang.startsWith('th'));
      if (voice) return voice;
    }
    
    // 中文兜底
    voice = voices.find(v => v.lang.startsWith('zh'));
    if (voice) return voice;
    
    // 任何可用语音
    return voices[0] || null;
  }, [voices]);

  // 朗读文本
  const speak = useCallback((text: string, lang: string, rate: number = 0.8) => {
    if (!synthRef.current) {
      console.error('浏览器不支持语音合成');
      return;
    }
    
    // 取消之前的朗读
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    const voice = findVoice(lang);
    if (voice) {
      utterance.voice = voice;
      console.log('使用语音:', voice.name, voice.lang);
    } else {
      console.warn('未找到匹配语音，使用默认');
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error('语音播放错误:', e);
      setIsSpeaking(false);
    };
    
    synthRef.current.speak(utterance);
  }, [findVoice]);

  // 朗读老挝语
  const speakLao = useCallback((text: string, rate: number = 0.8) => {
    speak(text, 'lo-LA', rate);
  }, [speak]);

  // 朗读中文
  const speakChinese = useCallback((text: string, rate: number = 1) => {
    speak(text, 'zh-CN', rate);
  }, [speak]);

  // 慢速朗读
  const speakSlow = useCallback((text: string) => {
    speak(text, 'lo-LA', 0.5);
  }, [speak]);

  // 用泰语朗读（老挝语近似）
  const speakThai = useCallback((text: string, rate: number = 0.8) => {
    speak(text, 'th-TH', rate);
  }, [speak]);

  // 开始语音识别
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('浏览器不支持语音识别');
      alert('你的浏览器不支持语音识别，请使用 Chrome 浏览器');
      return false;
    }

    try {
      const recognition = new SpeechRecognition();
      // 尝试老挝语，如果不支持则用泰语或中文
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
        } else if (event.error === 'language-not-supported') {
          console.log('老挝语不支持，尝试泰语...');
          // 可以在这里fallback到泰语
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
      } catch (e) {
        console.error('停止识别失败:', e);
      }
    }
  }, []);

  // 计算相似度
  const compareText = useCallback((target: string, spoken: string): number => {
    const normalize = (s: string) => s.toLowerCase().replace(/[.,!?;:\s]/g, '').trim();
    const t = normalize(target);
    const s = normalize(spoken);
    
    if (t === s) return 100;
    if (s.length === 0) return 0;
    
    // 包含匹配
    if (t.includes(s) || s.includes(t)) return 80;
    
    // 字符匹配率
    let matches = 0;
    const tChars = t.split('');
    const sChars = s.split('');
    
    for (let i = 0; i < Math.min(tChars.length, sChars.length); i++) {
      if (tChars[i] === sChars[i]) matches++;
    }
    
    return Math.round((matches / Math.max(tChars.length, sChars.length)) * 100);
  }, []);

  // 检查支持情况
  const isSupported = {
    synthesis: typeof window !== 'undefined' && 'speechSynthesis' in window,
    recognition: typeof window !== 'undefined' && 
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
    laoVoice: voices.some(v => v.lang.startsWith('lo')),
    thaiVoice: voices.some(v => v.lang.startsWith('th')),
    chineseVoice: voices.some(v => v.lang.startsWith('zh')),
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
    startListening,
    stopListening,
    compareText,
  };
}
