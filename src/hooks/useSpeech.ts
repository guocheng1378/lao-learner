import { useState, useCallback, useRef, useEffect } from 'react';

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ready, setReady] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // 初始化
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    synthRef.current = window.speechSynthesis;
    
    const loadVoices = () => {
      const v = synthRef.current?.getVoices() || [];
      voicesRef.current = v;
      if (v.length > 0) setReady(true);
    };
    
    // Chrome 需要等 voiceschanged 事件
    loadVoices();
    synthRef.current?.addEventListener('voiceschanged', loadVoices);
    
    // 强制触发加载
    if (synthRef.current) {
      const u = new SpeechSynthesisUtterance('');
      synthRef.current.speak(u);
      synthRef.current.cancel();
    }
    
    return () => {
      synthRef.current?.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // 找最佳语音
  const findBestVoice = useCallback((targetLang: string): SpeechSynthesisVoice | null => {
    const voices = voicesRef.current;
    if (voices.length === 0) return null;
    
    // 优先级：精确匹配 > 前缀匹配 > 近似语言
    const langPrefix = targetLang.split('-')[0];
    
    // 精确匹配
    let v = voices.find(x => x.lang === targetLang);
    if (v) return v;
    
    // 前缀匹配
    v = voices.find(x => x.lang.startsWith(langPrefix));
    if (v) return v;
    
    // 老挝语 -> 泰语（语言近似）
    if (langPrefix === 'lo') {
      v = voices.find(x => x.lang.startsWith('th'));
      if (v) return v;
    }
    
    // 中文
    v = voices.find(x => x.lang.startsWith('zh'));
    if (v) return v;
    
    // 英语兜底
    v = voices.find(x => x.lang.startsWith('en'));
    return v || voices[0] || null;
  }, []);

  // 朗读
  const speakText = useCallback((text: string, lang: string) => {
    const synth = synthRef.current;
    if (!synth) {
      alert('浏览器不支持语音合成');
      return;
    }
    
    // 停止之前的
    synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // 设置语言
    if (lang === 'lo') {
      utterance.lang = 'lo-LA';
    } else if (lang === 'th') {
      utterance.lang = 'th-TH';
    } else if (lang === 'zh') {
      utterance.lang = 'zh-CN';
    } else {
      utterance.lang = lang;
    }
    
    utterance.rate = lang === 'lo' ? 0.7 : 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // 找语音
    const voice = findBestVoice(utterance.lang);
    if (voice) {
      utterance.voice = voice;
      console.log('使用语音:', voice.name, voice.lang);
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error('朗读错误:', e.error);
      setIsSpeaking(false);
    };
    
    synth.speak(utterance);
  }, [findBestVoice]);

  // 老挝语
  const speakLao = useCallback((text: string) => {
    speakText(text, 'lo');
  }, [speakText]);

  // 泰语
  const speakThai = useCallback((text: string) => {
    speakText(text, 'th');
  }, [speakText]);

  // 中文
  const speakChinese = useCallback((text: string) => {
    speakText(text, 'zh');
  }, [speakText]);

  // 慢速
  const speakSlow = useCallback((text: string) => {
    const synth = synthRef.current;
    if (!synth) return;
    
    synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'lo-LA';
    utterance.rate = 0.4; // 很慢
    utterance.pitch = 1;
    
    const voice = findBestVoice('lo-LA');
    if (voice) utterance.voice = voice;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synth.speak(utterance);
  }, [findBestVoice]);

  // 通用
  const speak = useCallback((text: string, lang: string) => {
    speakText(text, lang);
  }, [speakText]);

  // 停止
  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  // 语音识别
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('浏览器不支持语音识别，请使用 Chrome');
      return false;
    }

    try {
      const recognition = new SR();
      recognition.lang = 'lo-LA';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        let finalT = '', interimT = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalT += event.results[i][0].transcript;
          } else {
            interimT += event.results[i][0].transcript;
          }
        }
        setTranscript(finalT || interimT);
      };

      recognition.onerror = (event: any) => {
        console.error('识别错误:', event.error);
        if (event.error === 'not-allowed') alert('请允许麦克风权限');
        setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
      return true;
    } catch (e) {
      console.error('启动失败:', e);
      return false;
    }
  }, []);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
  }, []);

  const compareText = useCallback((target: string, spoken: string): number => {
    const n = (s: string) => s.toLowerCase().replace(/[.,!?;:\s]/g, '').trim();
    const t = n(target), s = n(spoken);
    if (t === s) return 100;
    if (!s) return 0;
    if (t.includes(s) || s.includes(t)) return 80;
    let m = 0;
    for (let i = 0; i < Math.min(t.length, s.length); i++) {
      if (t[i] === s[i]) m++;
    }
    return Math.round((m / Math.max(t.length, s.length)) * 100);
  }, []);

  return {
    isListening, transcript, isSpeaking, ready,
    speakLao, speakChinese, speakThai, speakSlow, speak,
    stopSpeaking, startListening, stopListening, compareText,
  };
}
