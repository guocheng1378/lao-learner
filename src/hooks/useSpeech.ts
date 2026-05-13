import { useState, useCallback, useRef, useEffect } from 'react';

// 扩展 Window 接口
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // 朗读老挝语
  const speakLao = useCallback((text: string, rate: number = 0.8) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'lo-LA';  // 老挝语
    utterance.rate = rate;
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    // 尝试找老挝语语音
    const voices = synthRef.current.getVoices();
    const laoVoice = voices.find(v => v.lang.startsWith('lo'));
    if (laoVoice) {
      utterance.voice = laoVoice;
    }
    
    synthRef.current.speak(utterance);
  }, []);

  // 朗读中文
  const speakChinese = useCallback((text: string, rate: number = 1) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = rate;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  }, []);

  // 慢速朗读（用于学习）
  const speakSlow = useCallback((text: string) => {
    speakLao(text, 0.5);
  }, [speakLao]);

  // 开始语音识别
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('浏览器不支持语音识别');
      return false;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'lo-LA';  // 尝试识别老挝语
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setConfidence(0);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
          setConfidence(result[0].confidence);
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      
      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('语音识别错误:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    return true;
  }, []);

  // 停止语音识别
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // 计算相似度（简单实现）
  const compareText = useCallback((target: string, spoken: string): number => {
    const normalize = (s: string) => s.toLowerCase().replace(/[.,!?;:]/g, '').trim();
    const t = normalize(target);
    const s = normalize(spoken);
    
    if (t === s) return 100;
    if (s.length === 0) return 0;
    
    // 简单的字符匹配率
    let matches = 0;
    const tChars = t.split('');
    const sChars = s.split('');
    
    for (let i = 0; i < Math.min(tChars.length, sChars.length); i++) {
      if (tChars[i] === sChars[i]) matches++;
    }
    
    return Math.round((matches / Math.max(tChars.length, sChars.length)) * 100);
  }, []);

  return {
    isListening,
    transcript,
    confidence,
    isSpeaking,
    speakLao,
    speakChinese,
    speakSlow,
    startListening,
    stopListening,
    compareText,
  };
}
