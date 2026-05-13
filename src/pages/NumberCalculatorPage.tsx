import { useState, useMemo } from 'react';
import { useSpeech } from '../hooks/useSpeech';

interface Props {
  goBack: () => void;
}

// 老挝语数字
const laoDigits: Record<string, string> = {
  '0': 'ສູນ', '1': 'ໜຶ່ງ', '2': 'ສອງ', '3': 'ສາມ', '4': 'ສີ່',
  '5': 'ຫ້າ', '6': 'ຫົກ', '7': 'ເຈັດ', '8': 'ແປດ', '9': 'ເກົ້າ',
};

function numberToLao(num: number): string {
  if (num === 0) return laoDigits['0'];
  if (num < 0) return 'ລົບ ' + numberToLao(-num);
  
  const str = num.toString();
  const len = str.length;
  
  if (len === 1) return laoDigits[str];
  
  // 特殊处理两位数
  if (len === 2) {
    const tens = str[0];
    const ones = str[1];
    if (tens === '1') {
      return ones === '0' ? 'ສິບ' : 'ສິບ' + laoDigits[ones];
    }
    if (tens === '2') {
      return ones === '0' ? 'ຊາວ' : 'ຊາວ' + laoDigits[ones];
    }
    return laoDigits[tens] + 'ສິບ' + (ones === '0' ? '' : laoDigits[ones]);
  }
  
  // 三位数
  if (len === 3) {
    const hundreds = str[0];
    const rest = parseInt(str.substring(1));
    return laoDigits[hundreds] + 'ຮ້ອຍ' + (rest === 0 ? '' : numberToLao(rest));
  }
  
  // 四位数（千）
  if (len === 4) {
    const thousands = str[0];
    const rest = parseInt(str.substring(1));
    return laoDigits[thousands] + 'ພັນ' + (rest === 0 ? '' : numberToLao(rest));
  }
  
  // 五位数（万）
  if (len === 5) {
    const tenThousands = str[0];
    const rest = parseInt(str.substring(1));
    if (tenThousands === '1') {
      return 'ສິບພັນ' + (rest === 0 ? '' : numberToLao(rest));
    }
    if (tenThousands === '2') {
      return 'ຊາວພັນ' + (rest === 0 ? '' : numberToLao(rest));
    }
    return laoDigits[tenThousands] + 'ສິບພັນ' + (rest === 0 ? '' : numberToLao(rest));
  }
  
  // 六位数（十万）
  if (len === 6) {
    const hundredThousands = str[0];
    const rest = parseInt(str.substring(1));
    return laoDigits[hundredThousands] + 'ແສນ' + (rest === 0 ? '' : numberToLao(rest));
  }
  
  // 七位数及以上（百万）
  if (len >= 7) {
    const millions = parseInt(str.substring(0, len - 6));
    const rest = parseInt(str.substring(len - 6));
    return numberToLao(millions) + 'ລ້ານ' + (rest === 0 ? '' : numberToLao(rest));
  }
  
  return str;
}

// 格式化货币
function formatKip(num: number): string {
  return num.toLocaleString('lo-LA') + ' ກີບ';
}

export default function NumberCalculatorPage({ goBack }: Props) {
  const [input, setInput] = useState('');
  const { speakLao, isSpeaking } = useSpeech();

  const result = useMemo(() => {
    const num = parseInt(input);
    if (isNaN(num) || num < 0) return null;
    return {
      number: num,
      lao: numberToLao(num),
      kip: formatKip(num),
      kipFormatted: num.toLocaleString(),
    };
  }, [input]);

  const presets = [
    { label: '1万', value: 10000 },
    { label: '5万', value: 50000 },
    { label: '10万', value: 100000 },
    { label: '50万', value: 500000 },
    { label: '100万', value: 1000000 },
    { label: '500万', value: 5000000 },
    { label: '1000万', value: 10000000 },
    { label: '1亿', value: 100000000 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={goBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <svg className="w-5 h-5 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold dark:text-white">数字计算器</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Tip */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <span className="font-semibold">💡 做生意必备：</span>输入数字自动转老挝语，报价时直接念出来！
          </p>
        </div>

        {/* Input */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
          <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">输入数字</label>
          <input
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入数字，如 150000"
            className="w-full text-3xl font-bold text-center py-4 bg-gray-50 dark:bg-gray-700 rounded-xl 
                       dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Quick Buttons */}
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <button
              key={p.value}
              onClick={() => setInput(p.value.toString())}
              className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full text-sm font-medium 
                         text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700
                         hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Result */}
        {result && (
          <div className="space-y-3">
            {/* Lao Reading */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-5 text-white">
              <div className="text-sm opacity-80 mb-1">老挝语读法</div>
              <div className="lao-text text-2xl font-bold mb-3">{result.lao}</div>
              <button
                onClick={() => speakLao(result.lao)}
                disabled={isSpeaking}
                className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium hover:bg-white/30 transition-colors"
              >
                {isSpeaking ? '🔊 播放中...' : '🔊 听发音'}
              </button>
            </div>

            {/* Kip Format */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">基普写法</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{result.kip}</div>
            </div>

            {/* Chinese Reference */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">中文参考</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {result.kipFormatted} 基普
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                ≈ ¥{(result.number / 2500).toFixed(2)} 人民币（按1元≈2500基普估算）
              </div>
            </div>
          </div>
        )}

        {/* Common Numbers Reference */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">📖 常用数字对照</h3>
          <div className="space-y-2">
            {[
              { num: 10000, label: '一万基普' },
              { num: 50000, label: '五万基普' },
              { num: 100000, label: '十万基普' },
              { num: 500000, label: '五十万基普' },
              { num: 1000000, label: '一百万基普' },
            ].map(item => (
              <div key={item.num} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                <span className="lao-text font-semibold text-gray-800 dark:text-white">{numberToLao(item.num)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
