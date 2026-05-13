import { useState, useEffect } from 'react';
import { useSpeech } from '../hooks/useSpeech';

interface Props {
  targetText: string;
  chineseText: string;
  pinyin?: string;
  onClose: () => void;
}

export default function SpeechPractice({ targetText, chineseText, pinyin, onClose }: Props) {
  const { 
    isListening, transcript, isSpeaking,
    speakLao, speakSlow, startListening, stopListening, compareText 
  } = useSpeech();
  
  const [score, setScore] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const handleListen = () => {
    if (isListening) {
      stopListening();
    } else {
      setScore(null);
      setShowResult(false);
      startListening();
    }
  };

  useEffect(() => {
    if (!isListening && transcript) {
      const s = compareText(targetText, transcript);
      setScore(s);
      setShowResult(true);
      setAttempts(prev => [...prev, s]);
    }
  }, [isListening, transcript, targetText, compareText]);

  const avgScore = attempts.length > 0 
    ? Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length) 
    : 0;

  const getScoreEmoji = (s: number) => {
    if (s >= 90) return '🎉';
    if (s >= 70) return '👍';
    if (s >= 50) return '💪';
    return '😅';
  };

  const getScoreColor = (s: number) => {
    if (s >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (s >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (s >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-[480px] max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-3xl">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-center">🎤 语音跟读</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Target Text */}
          <div className="bg-blue-50 rounded-2xl p-5 text-center">
            <div className="text-xs text-blue-400 mb-2">跟读目标</div>
            <div className="lao-text text-4xl font-bold text-gray-800 mb-2">{targetText}</div>
            <div className="text-lg text-gray-600">{chineseText}</div>
            {pinyin && <div className="text-sm text-amber-600 mt-1 font-mono">{pinyin}</div>}
          </div>

          {/* Listen Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => speakLao(targetText)}
              disabled={isSpeaking}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold 
                         hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSpeaking ? (
                <>
                  <span className="animate-pulse">🔊</span> 播放中...
                </>
              ) : (
                <>
                  🔊 正常语速
                </>
              )}
            </button>
            <button
              onClick={() => speakSlow(targetText)}
              disabled={isSpeaking}
              className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold 
                         hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              🐢 慢速播放
            </button>
          </div>

          {/* Record Button */}
          <button
            onClick={handleListen}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg'
            }`}
          >
            {isListening ? '⏹️ 停止录音' : '🎙️ 开始跟读'}
          </button>

          {/* Transcript */}
          {transcript && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1">识别结果</div>
              <div className="lao-text text-xl text-gray-800">{transcript}</div>
            </div>
          )}

          {/* Score */}
          {showResult && score !== null && (
            <div className={`rounded-2xl p-5 text-center border-2 ${getScoreColor(score)}`}>
              <div className="text-4xl mb-2">{getScoreEmoji(score)}</div>
              <div className="text-3xl font-bold mb-1">{score}分</div>
              <div className="text-sm opacity-75">
                {score >= 90 ? '太棒了！发音很标准！' :
                 score >= 70 ? '不错，继续练习！' :
                 score >= 50 ? '加油，再试一次！' :
                 '别灰心，多听几遍再试！'}
              </div>
            </div>
          )}

          {/* Attempts History */}
          {attempts.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">练习记录</span>
                <span className="text-xs font-semibold text-blue-600">平均 {avgScore} 分</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {attempts.map((a, i) => (
                  <span key={i} className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(a)}`}>
                    {a}分
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">💡 跟读技巧：</span>
              先听2-3遍，注意声调变化，然后尽量模仿语调和节奏。
            </p>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
