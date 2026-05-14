import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSpeech } from '../hooks/useSpeech';

interface Props {
  goBack: () => void;
}

// 老挝语数字
const laoDigits: Record<string, string> = {
  '0': 'ສູນ', '1': 'ໜຶ່ງ', '2': 'ສອງ', '3': 'ສາມ', '4': 'ສີ່',
  '5': 'ຫ້າ', '6': 'ຫົກ', '7': 'ເຈັດ', '8': 'ແປດ', '9': 'ເກົ້າ',
};

// 运算符老挝语
const laoOperators: Record<string, string> = {
  '+': 'ບວກ',
  '-': 'ລົບ',
  '×': 'ຄູນ',
  '÷': 'ແບ่ง',
  '=': 'ເທົ່າກັບ',
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
    if (tens === '1') return ones === '0' ? 'ສິບ' : 'ສິບ ' + laoDigits[ones];
    if (tens === '2') return ones === '0' ? 'ຊາວ' : 'ຊາວ ' + laoDigits[ones];
    return laoDigits[tens] + ' ສິບ' + (ones === '0' ? '' : ' ' + laoDigits[ones]);
  }

  if (len === 3) {
    const hundreds = str[0];
    const rest = parseInt(str.substring(1));
    return laoDigits[hundreds] + ' ຮ້ອຍ' + (rest === 0 ? '' : ' ' + numberToLao(rest));
  }

  if (len === 4) {
    const thousands = str[0];
    const rest = parseInt(str.substring(1));
    return laoDigits[thousands] + ' ພັນ' + (rest === 0 ? '' : ' ' + numberToLao(rest));
  }

  if (len === 5) {
    const tenThousands = str[0];
    const rest = parseInt(str.substring(1));
    if (tenThousands === '1') return 'ສິບ ພັນ' + (rest === 0 ? '' : ' ' + numberToLao(rest));
    if (tenThousands === '2') return 'ຊາວ ພັນ' + (rest === 0 ? '' : ' ' + numberToLao(rest));
    return laoDigits[tenThousands] + ' ສິບ ພັນ' + (rest === 0 ? '' : ' ' + numberToLao(rest));
  }

  if (len === 6) {
    const hundredThousands = str[0];
    const rest = parseInt(str.substring(1));
    return laoDigits[hundredThousands] + ' ແສນ' + (rest === 0 ? '' : ' ' + numberToLao(rest));
  }

  if (len >= 7) {
    const millions = parseInt(str.substring(0, len - 6));
    const rest = parseInt(str.substring(len - 6));
    return numberToLao(millions) + ' ລ້ານ' + (rest === 0 ? '' : ' ' + numberToLao(rest));
  }

  return str;
}

// 计算表达式求值（安全版，支持 + - × ÷）
function safeEval(expr: string): number | null {
  try {
    const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');
    if (!/^[\d+\-*/().%\s]+$/.test(sanitized)) return null;
    const result = Function('"use strict";return (' + sanitized + ')')();
    if (typeof result !== 'number' || !isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
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

// 常用量词/单位
const UNITS = [
  { cn: '个', lao: 'ອັນ', pinyin: 'an', desc: '通用量词' },
  { cn: '只', lao: 'ໂຕ', pinyin: 'tou', desc: '动物/鞋' },
  { cn: '头', lao: 'ໂຕ', pinyin: 'tou', desc: '大动物' },
  { cn: '条', lao: 'ເສັ້ນ', pinyin: 'sen', desc: '长条物' },
  { cn: '件', lao: 'ຊິ້ນ', pinyin: 'sin', desc: '衣物/物品' },
  { cn: '框', lao: 'ກ່ອງ', pinyin: 'kong', desc: '箱子/框' },
  { cn: '袋', lao: 'ຖົງ', pinyin: 'thong', desc: '袋子' },
  { cn: '瓶', lao: 'ແກ້ວ', pinyin: 'kaew', desc: '瓶装' },
  { cn: '包', lao: 'ແພັກ', pinyin: 'paek', desc: '包裹' },
  { cn: '公斤', lao: 'ກິໂລ', pinyin: 'ki lo', desc: '重量' },
  { cn: '克', lao: 'ກຣາມ', pinyin: 'gram', desc: '重量' },
  { cn: '升', lao: 'ລິດ', pinyin: 'lit', desc: '容量' },
  { cn: '米', lao: 'ແມັດ', pinyin: 'mat', desc: '长度' },
  { cn: '块', lao: 'ບ່ອນ', pinyin: 'bon', desc: '地方/块' },
  { cn: '棵', lao: 'ຕົ້ນ', pinyin: 'ton', desc: '树木' },
  { cn: '把', lao: 'ດັມ', pinyin: 'dam', desc: '把/束' },
  { cn: '双', lao: 'ຄູ່', pinyin: 'khou', desc: '成对' },
  { cn: '套', lao: 'ຊຸດ', pinyin: 'soud', desc: '套装' },
];

export default function NumberCalculatorPage({ goBack }: Props) {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [fromCurrency, setFromCurrency] = useState<Currency>('kip');
  const [showConverter, setShowConverter] = useState(false);
  const [showLaoPanel, setShowLaoPanel] = useState(false);
  const { speakLao, speakSlow, isSpeaking } = useSpeech();

  // 格式化显示数字
  const formatNumber = useCallback((num: number): string => {
    if (Number.isInteger(num) && Math.abs(num) < 1e15) {
      return num.toLocaleString('en-US');
    }
    const str = num.toString();
    if (str.includes('.')) {
      const [intPart, decPart] = str.split('.');
      return parseInt(intPart).toLocaleString('en-US') + '.' + decPart;
    }
    return str;
  }, []);

  // 显示文本
  const displayText = useMemo(() => {
    if (result !== null) return formatNumber(result);
    if (!expression) return '0';
    return expression.replace(/(\d+)(\.\d+)?/g, (match) => {
      const num = parseFloat(match);
      if (isNaN(num)) return match;
      return formatNumber(num);
    });
  }, [expression, result, formatNumber]);

  // 当前有效数字
  const currentNumber = useMemo(() => {
    if (result !== null) return result;
    const num = parseFloat(expression);
    return isNaN(num) ? null : num;
  }, [expression, result]);

  // 老挝语文本
  const laoText = useMemo(() => {
    if (currentNumber === null) return null;
    const intNum = Math.floor(Math.abs(currentNumber));
    if (intNum === 0 && currentNumber !== 0) return null;
    return numberToLao(intNum);
  }, [currentNumber]);

  // 自动播报（防抖 800ms）- 只播报数字
  const autoPlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (autoPlayTimer.current) clearTimeout(autoPlayTimer.current);
    if (laoText && currentNumber && currentNumber > 0) {
      autoPlayTimer.current = setTimeout(() => {
        speakLao(laoText, 1.3);
      }, 800);
    }
    return () => {
      if (autoPlayTimer.current) clearTimeout(autoPlayTimer.current);
    };
  }, [laoText, currentNumber, speakLao]);

  // 货币换算
  const conversions = useMemo(() => {
    const num = result !== null ? result : parseFloat(expression);
    if (isNaN(num) || num <= 0) return null;
    const kipValue = fromCurrency === 'kip' ? num : num * RATES[fromCurrency];
    return {
      kip: Math.round(kipValue),
      cny: (kipValue / RATES.cny).toFixed(2),
      usd: (kipValue / RATES.usd).toFixed(2),
      thb: (kipValue / RATES.thb).toFixed(0),
    };
  }, [expression, result, fromCurrency]);

  // 按钮处理
  const handleButton = useCallback((key: string) => {
    // 播放运算符语音
    if (laoOperators[key]) {
      speakLao(laoOperators[key], 1.3);
    }

    if (key === 'AC') {
      setExpression('');
      setResult(null);
      return;
    }

    if (key === '⌫') {
      if (result !== null) {
        setResult(null);
        setExpression('');
      } else {
        setExpression(prev => prev.slice(0, -1));
      }
      return;
    }

    if (key === '%') {
      if (result !== null) {
        setResult(result / 100);
      } else {
        const num = parseFloat(expression);
        if (!isNaN(num)) {
          setResult(num / 100);
          setExpression('');
        }
      }
      return;
    }

    if (key === '+/-') {
      if (result !== null) {
        setResult(-result);
      } else {
        const num = parseFloat(expression);
        if (!isNaN(num)) {
          setExpression((-num).toString());
        }
      }
      return;
    }

    if (key === '=') {
      if (expression) {
        const evalResult = safeEval(expression);
        if (evalResult !== null) {
          setResult(evalResult);
          setExpression('');
        }
      }
      return;
    }

    // 运算符
    if (['+', '-', '×', '÷'].includes(key)) {
      if (result !== null) {
        setExpression(result.toString() + ' ' + key + ' ');
        setResult(null);
      } else if (expression) {
        const trimmed = expression.trimEnd();
        if (/[+\-×÷]\s*$/.test(trimmed)) {
          setExpression(trimmed.replace(/[+\-×÷]\s*$/, '') + ' ' + key + ' ');
        } else {
          setExpression(expression + ' ' + key + ' ');
        }
      }
      return;
    }

    // 数字和小数点
    if (result !== null) {
      setResult(null);
      setExpression(key);
    } else {
      setExpression(prev => prev + key);
    }
  }, [expression, result, speakLao]);

  // 键盘支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleButton(e.key);
      else if (e.key === '.') handleButton('.');
      else if (e.key === '+') handleButton('+');
      else if (e.key === '-') handleButton('-');
      else if (e.key === '*') handleButton('×');
      else if (e.key === '/') { e.preventDefault(); handleButton('÷'); }
      else if (e.key === 'Enter' || e.key === '=') handleButton('=');
      else if (e.key === 'Backspace') handleButton('⌫');
      else if (e.key === 'Escape') handleButton('AC');
      else if (e.key === '%') handleButton('%');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleButton]);

  // 小米风格按钮布局
  const rows = [
    [
      { label: 'AC', type: 'func' },
      { label: '+/-', type: 'func' },
      { label: '%', type: 'func' },
      { label: '÷', type: 'op' },
    ],
    [
      { label: '7', type: 'num' },
      { label: '8', type: 'num' },
      { label: '9', type: 'num' },
      { label: '×', type: 'op' },
    ],
    [
      { label: '4', type: 'num' },
      { label: '5', type: 'num' },
      { label: '6', type: 'num' },
      { label: '-', type: 'op' },
    ],
    [
      { label: '1', type: 'num' },
      { label: '2', type: 'num' },
      { label: '3', type: 'num' },
      { label: '+', type: 'op' },
    ],
    [
      { label: '0', type: 'num', wide: true },
      { label: '.', type: 'num' },
      { label: '=', type: 'op' },
    ],
  ];

  const getButtonStyle = (type: string) => {
    switch (type) {
      case 'func':
        return 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500 active:bg-gray-400 dark:active:bg-gray-700';
      case 'op':
        return 'bg-amber-500 text-white hover:bg-amber-400 active:bg-amber-600 shadow-md shadow-amber-500/20';
      case 'num':
      default:
        return 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 active:bg-gray-100 dark:active:bg-gray-800 shadow-sm';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <button onClick={goBack} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
          <svg className="w-5 h-5 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-medium text-gray-600 dark:text-gray-300">计算器</h1>
        <div className="w-9" />
      </div>

      {/* Calculator Body */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 mx-2 mt-1 rounded-3xl shadow-lg overflow-hidden">
        {/* Display Area */}
        <div className="flex-1 flex flex-col justify-end px-6 pb-4 pt-8 min-h-[200px]">
          <div className="text-right text-gray-400 dark:text-gray-500 text-base h-7 overflow-hidden font-light tracking-wide">
            {expression || '\u00A0'}
          </div>
          <div className={`text-right font-light tracking-tight transition-all duration-200 ${
            result !== null
              ? 'text-5xl text-gray-900 dark:text-white'
              : 'text-4xl text-gray-700 dark:text-gray-200'
          }`}>
            {displayText}
          </div>
        </div>

        {/* Lao Translation Bar */}
        {laoText && currentNumber && currentNumber > 0 && (
          <div className="mx-4 mb-2">
            <button
              onClick={() => setShowLaoPanel(!showLaoPanel)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-blue-500 text-lg">🇱🇦</span>
                <span className="lao-text text-blue-700 dark:text-blue-300 text-sm font-medium truncate">{laoText}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); speakLao(laoText, 1.3); }}
                  disabled={isSpeaking}
                  className="p-1.5 bg-blue-200 dark:bg-blue-800 rounded-lg text-blue-700 dark:text-blue-300 hover:bg-blue-300 dark:hover:bg-blue-700 transition-colors text-xs"
                >
                  🔊
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); speakSlow(laoText); }}
                  disabled={isSpeaking}
                  className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors text-xs"
                >
                  🐢
                </button>
                <span className="text-gray-400 text-xs ml-1">{showLaoPanel ? '▲' : '▼'}</span>
              </div>
            </button>

            {showLaoPanel && (
              <div className="mt-2 p-4 bg-white dark:bg-gray-700 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-600">
                <div className="text-center">
                  <div className="lao-text text-3xl font-bold text-gray-800 dark:text-white mb-2">{laoText}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">老挝语读法</div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => speakLao(laoText, 1.3)}
                      disabled={isSpeaking}
                      className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors active:scale-95"
                    >
                      🔊 正常速度
                    </button>
                    <button
                      onClick={() => speakSlow(laoText)}
                      disabled={isSpeaking}
                      className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-medium hover:bg-purple-600 transition-colors active:scale-95"
                    >
                      🐢 慢速发音
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Number Pad */}
        <div className="px-3 pb-3 space-y-2">
          {rows.map((row, ri) => (
            <div key={ri} className="flex gap-2">
              {row.map(btn => (
                <button
                  key={btn.label}
                  onClick={() => handleButton(btn.label)}
                  className={`
                    ${btn.wide ? 'flex-[2.1]' : 'flex-1'}
                    h-[62px] rounded-2xl text-xl font-medium
                    transition-all active:scale-[0.95] active:brightness-90
                    ${getButtonStyle(btn.type)}
                  `}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Lao Numbers Bar */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { label: '1千', value: 1000 },
            { label: '5千', value: 5000 },
            { label: '1万', value: 10000 },
            { label: '5万', value: 50000 },
            { label: '10万', value: 100000 },
            { label: '50万', value: 500000 },
            { label: '100万', value: 1000000 },
            { label: '500万', value: 5000000 },
          ].map(p => (
            <button
              key={p.value}
              onClick={() => {
                setResult(p.value);
                setExpression('');
              }}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full text-xs font-medium 
                         text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700
                         hover:border-blue-300 hover:text-blue-600 transition-colors whitespace-nowrap flex-shrink-0"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Unit / Measure Words */}
      <div className="px-4 pb-2">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">📦 常用量词（做生意必备）</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {UNITS.map(u => (
              <button
                key={u.cn}
                onClick={() => speakLao(u.lao, 1.3)}
                disabled={isSpeaking}
                className="flex flex-col items-center py-2 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors active:scale-95"
              >
                <span className="text-sm font-bold text-gray-800 dark:text-white">{u.cn}</span>
                <span className="lao-text text-xs text-blue-600 dark:text-blue-400 font-medium">{u.lao}</span>
                <span className="text-[9px] text-gray-400 mt-0.5">{u.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Crops */}
      <div className="px-4 pb-2">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">🌱 作物（点击听发音）</h3>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { cn: '芒果', lao: 'ໝາກມ່ວງ', pinyin: 'mak muang' },
              { cn: '红薯', lao: 'ມັນ', pinyin: 'man' },
              { cn: '黄瓜', lao: 'ແຕງ', pinyin: 'taeng' },
              { cn: '西瓜', lao: 'ໝາກໂມ', pinyin: 'mak mo' },
              { cn: '水稻', lao: 'ເຂົ້າ', pinyin: 'khao' },
              { cn: '玉米', lao: 'ໝາກສາລີ', pinyin: 'mak sali' },
              { cn: '香蕉', lao: 'ໝາກກ້ວຍ', pinyin: 'mak kuai' },
              { cn: '木薯', lao: 'ມັນຕົ້ນ', pinyin: 'man ton' },
            ].map(c => (
              <button
                key={c.cn}
                onClick={() => speakLao(c.lao, 1.3)}
                disabled={isSpeaking}
                className="flex flex-col items-center py-2 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors active:scale-95"
              >
                <span className="text-sm font-bold text-gray-800 dark:text-white">{c.cn}</span>
                <span className="lao-text text-[10px] text-green-600 dark:text-green-400 font-medium">{c.lao}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Farming Operations */}
      <div className="px-4 pb-2">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">🚜 农活操作</h3>
          <div className="space-y-1">
            {[
              { lao: 'ປູກໝາກມ່ວງ', cn: '种芒果', pinyin: 'pouk mak muang' },
              { lao: 'ປູກມັນ', cn: '种红薯', pinyin: 'pouk man' },
              { lao: 'ປູກແຕງ', cn: '种黄瓜', pinyin: 'pouk taeng' },
              { lao: 'ປູກໝາກໂມ', cn: '种西瓜', pinyin: 'pouk mak mo' },
              { lao: 'ເກັບໝາກມ່ວງ', cn: '收芒果', pinyin: 'kaeb mak muang' },
              { lao: 'ເກັບມັນ', cn: '收红薯', pinyin: 'kaeb man' },
              { lao: 'ເກັບແຕງ', cn: '收黄瓜', pinyin: 'kaeb taeng' },
              { lao: 'ເກັບໝາກໂມ', cn: '收西瓜', pinyin: 'kaeb mak mo' },
              { lao: 'ຫົດນ້ຳ', cn: '浇水', pinyin: 'hot nam' },
              { lao: 'ໃສ່ປຸ໋ຍ', cn: '施肥', pinyin: 'sai pui' },
              { lao: 'ຖາງຫຍ້າ', cn: '除草', pinyin: 'thang nya' },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800 dark:text-white">{p.cn}</span>
                  <span className="lao-text text-xs text-green-600 dark:text-green-400 ml-2">{p.lao}</span>
                  <span className="text-[9px] text-gray-400 ml-1">{p.pinyin}</span>
                </div>
                <div className="flex gap-1 ml-1">
                  <button onClick={() => speakLao(p.lao, 1.3)} disabled={isSpeaking}
                    className="p-1 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400 text-xs">🔊</button>
                  <button onClick={() => speakSlow(p.lao)} disabled={isSpeaking}
                    className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 text-xs">🐢</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Processing - Sweet Potato Starch */}
      <div className="px-4 pb-2">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">🏭 红薯粉加工</h3>
          <div className="space-y-1">
            {[
              { lao: 'ເຮັດແປ້ງມັນ', cn: '做红薯粉', pinyin: 'het paeng man' },
              { lao: 'ລ້າງມັນ', cn: '洗红薯', pinyin: 'lang man' },
              { lao: 'ປົ່ນມັນ', cn: '磨碎', pinyin: 'pon man' },
              { lao: 'ກອງແປ້ງ', cn: '过滤淀粉', pinyin: 'kong paeng' },
              { lao: 'ຕົ້ມມັນ', cn: '煮/蒸', pinyin: 'tom man' },
              { lao: 'ຕາກແຫ້ງ', cn: '晾干', pinyin: 'tak haeng' },
              { lao: 'ເອົາມັນຂຶ້ນລົດ', cn: '把红薯装车', pinyin: 'ao man khuen lot' },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800 dark:text-white">{p.cn}</span>
                  <span className="lao-text text-xs text-orange-600 dark:text-orange-400 ml-2">{p.lao}</span>
                  <span className="text-[9px] text-gray-400 ml-1">{p.pinyin}</span>
                </div>
                <div className="flex gap-1 ml-1">
                  <button onClick={() => speakLao(p.lao, 1.3)} disabled={isSpeaking}
                    className="p-1 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400 text-xs">🔊</button>
                  <button onClick={() => speakSlow(p.lao)} disabled={isSpeaking}
                    className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 text-xs">🐢</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Worker Management */}
      <div className="px-4 pb-2">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">👷 管理工人</h3>
          <div className="space-y-1">
            {[
              { lao: 'ມື້ນີ້ເຮັດຫຍັງ?', cn: '今天干什么？', pinyin: 'mui ni het nyang?' },
              { lao: 'ເອົາລົດມາ', cn: '把车开过来', pinyin: 'ao lot ma' },
              { lao: 'ລົດເສຍ', cn: '车坏了', pinyin: 'lot sia' },
              { lao: 'ສ້ອມແປງລົດ', cn: '修车', pinyin: 'sompaeng lot' },
              { lao: 'ເປີດນ້ຳ', cn: '开水（水泵）', pinyin: 'poet nam' },
              { lao: 'ປິດນ້ຳ', cn: '关水', pinyin: 'pit nam' },
              { lao: 'ເປີດເຄື່ອງ', cn: '开机器', pinyin: 'poet khueang' },
              { lao: 'ປິດເຄື່ອງ', cn: '关机器', pinyin: 'pit khueang' },
              { lao: 'ມື້ອື່ນມາແຕ່ເຊົ້າ', cn: '明天早上来', pinyin: 'mui un ma tae sao' },
              { lao: 'ພັກຜ່ອນກ່ອນ', cn: '先休息', pinyin: 'pak phon kon' },
              { lao: 'ເຮັດໃຫ້ແລ້ວ', cn: '做完它', pinyin: 'het hai laew' },
              { lao: 'ເຮັດໄວໆ', cn: '做快点', pinyin: 'het vai vai' },
              { lao: 'ເຮັດຊ້າໆ', cn: '做慢点', pinyin: 'het sa sa' },
              { lao: 'ລະວັດແດ່', cn: '小心点', pinyin: 'lavat dae' },
              { lao: 'ຂົນຂຶ້ນລົດ', cn: '搬上车', pinyin: 'khon khuen lot' },
              { lao: 'ລົງຂອງ', cn: '卸货', pinyin: 'long khong' },
              { lao: 'ມື້ນີ້ຈ່າຍເງິນ', cn: '今天发工资', pinyin: 'mui ni chai ngoen' },
              { lao: 'ຄ່າແຮງງານເທົ່າໃດ?', cn: '工钱多少？', pinyin: 'kha haeng ngan thao dai?' },
              { lao: 'ຕ້ອງການຄົນ', cn: '需要人', pinyin: 'tongkan khon' },
              { lao: 'ຂາດຄົນ', cn: '缺人', pinyin: 'khat khon' },
              { lao: 'ມີຄົນຈັກຄົນ?', cn: '有几个人？', pinyin: 'mi khon jak khon?' },
              { lao: 'ມາເຕັມ', cn: '全来了', pinyin: 'ma tem' },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800 dark:text-white">{p.cn}</span>
                  <span className="lao-text text-xs text-blue-600 dark:text-blue-400 ml-2">{p.lao}</span>
                  <span className="text-[9px] text-gray-400 ml-1">{p.pinyin}</span>
                </div>
                <div className="flex gap-1 ml-1">
                  <button onClick={() => speakLao(p.lao, 1.3)} disabled={isSpeaking}
                    className="p-1 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400 text-xs">🔊</button>
                  <button onClick={() => speakSlow(p.lao)} disabled={isSpeaking}
                    className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 text-xs">🐢</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selling & Transport */}
      <div className="px-4 pb-2">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">💰 卖货 & 运输</h3>
          <div className="space-y-1">
            {[
              { lao: 'ໝາກມ່ວງກິໂລລະເທົ່າໃດ?', cn: '芒果多少钱一公斤？', pinyin: 'mak muang ki lo la thao dai?' },
              { lao: 'ຊື້ທັງໝົດ', cn: '全买了', pinyin: 'sue thang mot' },
              { lao: 'ຂາຍຍົກ', cn: '批发', pinyin: 'khai yok' },
              { lao: 'ຂາຍຍ່ອຍ', cn: '零售', pinyin: 'khai noi' },
              { lao: 'ລົດມາແລ້ວ', cn: '车来了', pinyin: 'lot ma laew' },
              { lao: 'ຕັດແຕງ', cn: '摘黄瓜', pinyin: 'tat taeng' },
              { lao: 'ເກັບຜົນ', cn: '收果实/收获', pinyin: 'kaeb phon' },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800 dark:text-white">{p.cn}</span>
                  <span className="lao-text text-xs text-amber-600 dark:text-amber-400 ml-2">{p.lao}</span>
                  <span className="text-[9px] text-gray-400 ml-1">{p.pinyin}</span>
                </div>
                <div className="flex gap-1 ml-1">
                  <button onClick={() => speakLao(p.lao, 1.3)} disabled={isSpeaking}
                    className="p-1 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400 text-xs">🔊</button>
                  <button onClick={() => speakSlow(p.lao)} disabled={isSpeaking}
                    className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 text-xs">🐢</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Currency Converter */}
      <div className="px-4 pb-2">
        <button
          onClick={() => setShowConverter(!showConverter)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm"
        >
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">💱 货币换算</span>
          <span className="text-xs text-gray-400">{showConverter ? '收起 ▲' : '展开 ▼'}</span>
        </button>

        {showConverter && (
          <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <div className="flex gap-1.5 mb-3">
              {(Object.keys(RATES) as Currency[]).map(c => (
                <button
                  key={c}
                  onClick={() => setFromCurrency(c)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                    fromCurrency === c
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {CURRENCY_FLAGS[c]} {c.toUpperCase()}
                </button>
              ))}
            </div>

            {conversions && (
              <div className="grid grid-cols-2 gap-2">
                {(['kip', 'cny', 'usd', 'thb'] as Currency[]).map(c => (
                  <div
                    key={c}
                    className={`rounded-xl p-3 ${
                      c === fromCurrency
                        ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700'
                        : 'bg-gray-50 dark:bg-gray-700'
                    }`}
                  >
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
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

            <p className="text-[10px] text-gray-400 text-center mt-3">
              * 汇率仅供参考（1 CNY ≈ 2,500 KIP / 1 USD ≈ 21,000 KIP / 1 THB ≈ 650 KIP）
            </p>
          </div>
        )}
      </div>

      {/* Business Phrases */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">🗣️ 砍价必备</h3>
          <div className="space-y-1">
            {[
              { lao: 'ລາຄາ ເທົ່າໃດ?', cn: '多少钱？', pinyin: 'laka thao dai?' },
              { lao: 'ຖືກກວ່າໄດ້ບໍ່?', cn: '能便宜吗？', pinyin: 'thuek kwa dai bo?' },
              { lao: 'ຫຼຸດໃຫ້ແດ່', cn: '给个折扣', pinyin: 'lut hai dae' },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex-1 min-w-0">
                  <div className="lao-text text-sm font-medium text-gray-800 dark:text-white">{p.lao}</div>
                  <div className="text-[10px] text-gray-400">{p.cn} · {p.pinyin}</div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => speakLao(p.lao, 1.3)}
                    disabled={isSpeaking}
                    className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-200 transition-colors text-xs"
                  >
                    🔊
                  </button>
                  <button
                    onClick={() => speakSlow(p.lao)}
                    disabled={isSpeaking}
                    className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-200 transition-colors text-xs"
                  >
                    🐢
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Single Digit Reference */}
      <div className="px-4 pb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">🔢 数字发音参考</h3>
          <div className="grid grid-cols-5 gap-1.5">
            {Object.entries(laoDigits).map(([num, lao]) => (
              <button
                key={num}
                onClick={() => speakLao(lao, 1.3)}
                disabled={isSpeaking}
                className="flex flex-col items-center py-2 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors active:scale-95"
              >
                <span className="text-lg font-bold text-gray-800 dark:text-white">{num}</span>
                <span className="lao-text text-[10px] text-blue-600 dark:text-blue-400 font-medium">{lao}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
