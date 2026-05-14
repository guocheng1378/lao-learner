import { useState, useMemo, useCallback } from 'react';
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

  if (len === 2) {
    const tens = str[0];
    const ones = str[1];
    if (tens === '1') return ones === '0' ? 'ສິບ' : 'ສິບ' + laoDigits[ones];
    if (tens === '2') return ones === '0' ? 'ຊາວ' : 'ຊາວ' + laoDigits[ones];
    return laoDigits[tens] + 'ສິບ' + (ones === '0' ? '' : laoDigits[ones]);
  }

  if (len === 3) {
    const hundreds = str[0];
    const rest = parseInt(str.substring(1));
    return laoDigits[hundreds] + 'ຮ້ອຍ' + (rest === 0 ? '' : numberToLao(rest));
  }

  if (len === 4) {
    const thousands = str[0];
    const rest = parseInt(str.substring(1));
    return laoDigits[thousands] + 'ພັນ' + (rest === 0 ? '' : numberToLao(rest));
  }

  if (len === 5) {
    const tenThousands = str[0];
    const rest = parseInt(str.substring(1));
    if (tenThousands === '1') return 'ສິບພັນ' + (rest === 0 ? '' : numberToLao(rest));
    if (tenThousands === '2') return 'ຊາວພັນ' + (rest === 0 ? '' : numberToLao(rest));
    return laoDigits[tenThousands] + 'ສິບພັນ' + (rest === 0 ? '' : numberToLao(rest));
  }

  if (len === 6) {
    const hundredThousands = str[0];
    const rest = parseInt(str.substring(1));
    return laoDigits[hundredThousands] + 'ແສນ' + (rest === 0 ? '' : numberToLao(rest));
  }

  if (len >= 7) {
    const millions = parseInt(str.substring(0, len - 6));
    const rest = parseInt(str.substring(len - 6));
    return numberToLao(millions) + 'ລ້ານ' + (rest === 0 ? '' : numberToLao(rest));
  }

  return str;
}

// 汇率（估算）
const RATES = { kip: 1, cny: 2500, usd: 21000, thb: 650 };

type Currency = 'kip' | 'cny' | 'usd' | 'thb';
const CURRENCY_LABELS: Record<Currency, string> = {
  kip: '₭ 基普', cny: '¥ 人民币', usd: '$ 美元', thb: '฿ 泰铢',
};
const CURRENCY_FLAGS: Record<Currency, string> = {
  kip: '🇱🇦', cny: '🇨🇳', usd: '🇺🇸', thb: '🇹🇭',
};

export default function NumberCalculatorPage({ goBack }: Props) {
  const [input, setInput] = useState('');
  const [fromCurrency, setFromCurrency] = useState<Currency>('kip');
  const [showConverter, setShowConverter] = useState(false);
  const { speakLao, speakSlow, isSpeaking } = useSpeech();

  const result = useMemo(() => {
    const num = parseInt(input);
    if (isNaN(num) || num < 0) return null;
    return {
      number: num,
      lao: numberToLao(num),
      kip: num.toLocaleString('lo-LA') + ' ກີບ',
    };
  }, [input]);

  // 货币换算
  const conversions = useMemo(() => {
    const num = parseFloat(input);
    if (isNaN(num) || num <= 0) return null;
    const kipValue = fromCurrency === 'kip' ? num : num * RATES[fromCurrency];
    return {
      kip: Math.round(kipValue),
      cny: (kipValue / RATES.cny).toFixed(2),
      usd: (kipValue / RATES.usd).toFixed(2),
      thb: (kipValue / RATES.thb).toFixed(0),
    };
  }, [input, fromCurrency]);

  const handleNumpad = useCallback((key: string) => {
    if (key === 'del') {
      setInput(prev => prev.slice(0, -1));
    } else if (key === 'clear') {
      setInput('');
    } else {
      setInput(prev => {
        if (prev.length >= 12) return prev;
        return prev + key;
      });
    }
  }, []);

  const presets = [
    { label: '1万', value: 10000, lao: 'ສິບພັນ' },
    { label: '5万', value: 50000, lao: 'ຫ້າສິບພັນ' },
    { label: '10万', value: 100000, lao: 'ໜຶ່ງແສນ' },
    { label: '50万', value: 500000, lao: 'ຫ້າແສນ' },
    { label: '100万', value: 1000000, lao: 'ໜຶ່ງລ້ານ' },
    { label: '500万', value: 5000000, lao: 'ຫ້າລ້ານ' },
    { label: '1000万', value: 10000000, lao: 'ສິບລ້ານ' },
    { label: '1亿', value: 100000000, lao: 'ໜຶ່ງຮ້ອຍລ້ານ' },
  ];

  const pricePhrases = [
    { lao: 'ລາຄາ ເທົ່າໃດ?', chinese: '多少钱？', pinyin: 'laka thao dai?' },
    { lao: 'ຖືກກວ່າໄດ້ບໍ່?', chinese: '能便宜吗？', pinyin: 'thuek kwa dai bo?' },
    { lao: 'ຫຼຸດໃຫ້ແດ່', chinese: '给个折扣', pinyin: 'lut hai dae' },
    { lao: 'ລາຄາສຸດທ້າຍ', chinese: '最终价格', pinyin: 'laka sut thai' },
  ];

  const numpadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['clear', '0', 'del'],
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={goBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <svg className="w-5 h-5 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold dark:text-white">🔢 数字计算器</h1>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Tip */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-3">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <span className="font-semibold">💡 做生意必备：</span>输入数字 → 自动转老挝语 → 点击听发音报价！
          </p>
        </div>

        {/* Input Display */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">
              {CURRENCY_FLAGS[fromCurrency]} {CURRENCY_LABELS[fromCurrency]}
            </div>
            <div className="text-4xl font-bold text-gray-800 dark:text-white min-h-[48px] font-mono">
              {input ? parseInt(input).toLocaleString() : <span className="text-gray-300 dark:text-gray-600">0</span>}
            </div>
          </div>
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-2">
          {numpadKeys.flat().map(key => (
            <button
              key={key}
              onClick={() => handleNumpad(key)}
              className={`py-4 rounded-xl text-xl font-bold transition-all active:scale-95 ${
                key === 'del'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : key === 'clear'
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {key === 'del' ? '⌫' : key === 'clear' ? 'C' : key}
            </button>
          ))}
        </div>

        {/* Quick Amounts */}
        <div className="flex flex-wrap gap-1.5">
          {presets.map(p => (
            <button
              key={p.value}
              onClick={() => setInput(p.value.toString())}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full text-xs font-medium 
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
            {/* Lao Reading - Main Feature */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-5 text-white">
              <div className="text-sm opacity-80 mb-1">🇱🇦 老挝语读法</div>
              <div className="lao-text text-3xl font-bold mb-4">{result.lao}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => speakLao(result.lao)}
                  disabled={isSpeaking}
                  className="flex-1 py-2.5 bg-white/20 rounded-xl text-sm font-semibold hover:bg-white/30 transition-colors active:scale-95"
                >
                  {isSpeaking ? '🔊 播放中' : '🔊 正常语速'}
                </button>
                <button
                  onClick={() => speakSlow(result.lao)}
                  disabled={isSpeaking}
                  className="flex-1 py-2.5 bg-white/20 rounded-xl text-sm font-semibold hover:bg-white/30 transition-colors active:scale-95"
                >
                  {isSpeaking ? '🔊 播放中' : '🐢 慢速'}
                </button>
              </div>
            </div>

            {/* Currency Converter */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setShowConverter(!showConverter)}
                className="w-full px-5 py-3 flex items-center justify-between"
              >
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">💱 货币换算</span>
                <span className="text-xs text-gray-400">{showConverter ? '收起' : '展开'}</span>
              </button>

              {showConverter && (
                <div className="px-5 pb-4 space-y-3">
                  {/* From Currency Selector */}
                  <div className="flex gap-1.5">
                    {(Object.keys(RATES) as Currency[]).map(c => (
                      <button
                        key={c}
                        onClick={() => setFromCurrency(c)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                          fromCurrency === c
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {CURRENCY_FLAGS[c]} {c.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {/* Conversions */}
                  {conversions && (
                    <div className="grid grid-cols-2 gap-2">
                      {(['kip', 'cny', 'usd', 'thb'] as Currency[]).map(c => (
                        <div
                          key={c}
                          className={`rounded-xl p-3 ${
                            c === fromCurrency
                              ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                              : 'bg-gray-50 dark:bg-gray-700'
                          }`}
                        >
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {CURRENCY_FLAGS[c]} {CURRENCY_LABELS[c]}
                          </div>
                          <div className="text-lg font-bold text-gray-800 dark:text-white mt-1">
                            {c === 'kip' ? conversions.kip.toLocaleString() :
                             c === 'cny' ? `¥${conversions.cny}` :
                             c === 'usd' ? `$${conversions.usd}` :
                             `฿${conversions.thb}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 text-center">
                    * 汇率仅供参考（1 CNY ≈ 2,500 KIP / 1 USD ≈ 21,000 KIP / 1 THB ≈ 650 KIP）
                  </p>
                </div>
              )}
            </div>

            {/* Kip Format */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-400 mb-1">基普写法</div>
                  <div className="text-xl font-bold text-gray-800 dark:text-white">{result.kip}</div>
                </div>
                <button
                  onClick={() => speakLao(result.number.toLocaleString().replace(/,/g, '') + ' ກີບ')}
                  disabled={isSpeaking}
                  className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400 hover:bg-green-200 transition-colors"
                >
                  🔊
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Price Phrases */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">🗣️ 砍价必备句子</h3>
          <div className="space-y-2">
            {pricePhrases.map((phrase, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="lao-text text-base font-semibold text-gray-800 dark:text-white">{phrase.lao}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{phrase.chinese} · {phrase.pinyin}</div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => speakLao(phrase.lao)}
                    disabled={isSpeaking}
                    className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-200 transition-colors"
                  >
                    🔊
                  </button>
                  <button
                    onClick={() => speakSlow(phrase.lao)}
                    disabled={isSpeaking}
                    className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-200 transition-colors"
                  >
                    🐢
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Common Numbers Reference */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">📖 常用金额对照</h3>
          <div className="space-y-1.5">
            {[
              { num: 10000, cn: '一万基普', approx: '≈ ¥4' },
              { num: 50000, cn: '五万基普', approx: '≈ ¥20' },
              { num: 100000, cn: '十万基普', approx: '≈ ¥40' },
              { num: 500000, cn: '五十万基普', approx: '≈ ¥200' },
              { num: 1000000, cn: '一百万基普', approx: '≈ ¥400' },
              { num: 5000000, cn: '五百万基普', approx: '≈ ¥2,000' },
              { num: 10000000, cn: '一千万基普', approx: '≈ ¥4,000' },
            ].map(item => (
              <div key={item.num} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{item.cn}</span>
                  <span className="text-xs text-gray-400 ml-2">{item.approx}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="lao-text text-sm font-semibold text-gray-800 dark:text-white">{numberToLao(item.num)}</span>
                  <button
                    onClick={() => speakLao(numberToLao(item.num))}
                    disabled={isSpeaking}
                    className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-200 transition-colors"
                  >
                    🔊
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Single Digit Reference */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">🔢 单个数字发音</h3>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(laoDigits).map(([num, lao]) => (
              <button
                key={num}
                onClick={() => speakLao(lao)}
                disabled={isSpeaking}
                className="flex flex-col items-center py-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors active:scale-95"
              >
                <span className="text-xl font-bold text-gray-800 dark:text-white">{num}</span>
                <span className="lao-text text-sm text-blue-600 dark:text-blue-400 font-semibold">{lao}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
