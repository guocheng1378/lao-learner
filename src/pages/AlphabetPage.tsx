import { useState } from 'react';
import { consonants } from '../data/alphabet';
import { useSpeech } from '../hooks/useSpeech';
import SpeechPractice from '../components/SpeechPractice';

type ConsonantClass = 'all' | 'mid' | 'high' | 'low';

const classColors: Record<string, string> = {
  mid: 'bg-blue-100 text-blue-800 border-blue-200',
  high: 'bg-red-100 text-red-800 border-red-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

const classLabels: Record<string, string> = {
  mid: '中辅音',
  high: '高辅音',
  low: '低辅音',
};

interface Props {
  goBack: () => void;
}

export default function AlphabetPage({ goBack }: Props) {
  const [filter, setFilter] = useState<ConsonantClass>('all');
  const [selected, setSelected] = useState<number | null>(null);
  const [practiceConsonant, setPracticeConsonant] = useState<typeof consonants[0] | null>(null);
  const { speakLao, isSpeaking } = useSpeech();

  const filtered = filter === 'all' 
    ? consonants 
    : consonants.filter(c => c.class === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">老挝语字母表</h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-4 py-3 bg-white border-b border-gray-100">
        {(['all', 'mid', 'high', 'low'] as const).map(cls => (
          <button
            key={cls}
            onClick={() => { setFilter(cls); setSelected(null); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === cls
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cls === 'all' ? '全部' : classLabels[cls]}
          </button>
        ))}
      </div>

      {/* Alphabet Grid */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          {filtered.map((c, i) => (
            <button
              key={`${c.char}-${i}`}
              onClick={() => setSelected(selected === i ? null : i)}
              className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-all duration-200 
                ${selected === i 
                  ? 'border-blue-500 shadow-md scale-[1.02]' 
                  : 'border-transparent hover:border-gray-200'
                }`}
            >
              <div className="lao-text text-4xl font-bold text-center text-gray-800 mb-1">
                {c.char}
              </div>
              <div className="text-xs text-gray-500 text-center">{c.name}</div>
              <div className={`text-xs text-center mt-2 px-2 py-0.5 rounded-full ${classColors[c.class]}`}>
                {classLabels[c.class]}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      {selected !== null && filtered[selected] && (
        <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-6 max-w-[480px] mx-auto z-20 border-t border-gray-200">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          
          <div className="flex items-start gap-6">
            <div className="lao-text text-7xl font-bold text-blue-600">
              {filtered[selected].char}
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold mb-1">{filtered[selected].name}</div>
              <div className="text-sm text-gray-500 mb-2">
                声母: <span className="font-mono text-blue-600">{filtered[selected].sound}</span>
              </div>
              <div className="text-sm text-gray-500 mb-2">
                近似音: <span className="text-amber-600">{filtered[selected].pinyin}</span>
              </div>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${classColors[filtered[selected].class]}`}>
                {classLabels[filtered[selected].class]} · {filtered[selected].meaning}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-xl">
            <div className="text-xs text-gray-500 mb-1">示例单词</div>
            <div className="flex items-baseline gap-2">
              <span className="lao-text text-2xl font-semibold">{filtered[selected].example}</span>
              <span className="text-gray-600">{filtered[selected].exampleMeaning}</span>
            </div>
          </div>

          {/* Voice Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => speakLao(filtered[selected].char)}
              disabled={isSpeaking}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold 
                         hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              🔊 听发音
            </button>
            <button
              onClick={() => speakLao(filtered[selected].example)}
              disabled={isSpeaking}
              className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold 
                         hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              🔊 听例词
            </button>
          </div>

          {/* Practice Button */}
          <button
            onClick={() => {
              setPracticeConsonant(filtered[selected]);
              setSelected(null);
            }}
            className="w-full mt-3 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold 
                       hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            🎤 跟读练习
          </button>

          <button
            onClick={() => setSelected(null)}
            className="w-full mt-3 py-3 bg-gray-100 rounded-xl text-gray-600 font-medium hover:bg-gray-200 transition-colors"
          >
            关闭
          </button>
        </div>
      )}

      {/* Speech Practice Modal */}
      {practiceConsonant && (
        <SpeechPractice
          targetText={practiceConsonant.char}
          chineseText={practiceConsonant.name}
          pinyin={practiceConsonant.pinyin}
          onClose={() => setPracticeConsonant(null)}
        />
      )}
    </div>
  );
}
