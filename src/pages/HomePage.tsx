import type { Page } from '../hooks/useNavigation';
import { useTheme } from '../hooks/useTheme';
import { useStats } from '../hooks/useStats';
import { useSpeech } from '../hooks/useSpeech';

interface Props {
  navigate: (page: Page) => void;
}

const mainMenuItems = [
  { page: 'alphabet' as Page, icon: 'ອ', title: '字母表', subtitle: '老挝语27个辅音', color: 'bg-blue-500' },
  { page: 'tone' as Page, icon: '່', title: '声调学习', subtitle: '6个声调轻松掌握', color: 'bg-purple-500' },
  { page: 'vocabulary' as Page, icon: '词', title: '实用词汇', subtitle: '做生意必备词汇', color: 'bg-green-500' },
  { page: 'dialogue' as Page, icon: '💬', title: '常用对话', subtitle: '砍价、打车、吃饭', color: 'bg-orange-500' },
  { page: 'flashcard' as Page, icon: '🃏', title: '闪卡复习', subtitle: '间隔重复记得牢', color: 'bg-red-500' },
];

const toolMenuItems = [
  { page: 'search' as Page, icon: '🔍', title: '搜索', subtitle: '中老双向搜索' },
  { page: 'favorites' as Page, icon: '📌', title: '收藏夹', subtitle: '我的常用词汇' },
  { page: 'calculator' as Page, icon: '🧮', title: '数字计算器', subtitle: '报价神器' },
  { page: 'scenario' as Page, icon: '📍', title: '场景短语', subtitle: '海关/医院/银行' },
  { page: 'tone-game' as Page, icon: '🎮', title: '声调游戏', subtitle: '寓教于乐' },
  { page: 'stats' as Page, icon: '📊', title: '学习统计', subtitle: '我的学习进度' },
];

export default function HomePage({ navigate }: Props) {
  const { toggleTheme, isDark } = useTheme();
  const { getTodayStats, stats } = useStats();
  const { speakLao, speakChinese, isSpeaking } = useSpeech();
  const today = getTodayStats();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-800 text-white px-6 pt-12 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🇱🇦</span>
            <div>
              <h1 className="text-2xl font-bold">老挝语学习</h1>
              <p className="text-blue-100 text-sm">在老做生意必备</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
        
        {/* Today Stats */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{today.wordsLearned}</div>
            <div className="text-xs text-blue-100">今日词汇</div>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{stats.streak}</div>
            <div className="text-xs text-blue-100">连续天数</div>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{stats.totalWordsLearned}</div>
            <div className="text-xs text-blue-100">累计词汇</div>
          </div>
        </div>
      </div>

      {/* Main Menu */}
      <div className="px-4 py-6">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 px-2">📚 核心学习</h2>
        <div className="space-y-3">
          {mainMenuItems.map(item => (
            <button
              key={item.page}
              onClick={() => navigate(item.page)}
              className="w-full flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 
                         hover:shadow-md hover:border-blue-200 transition-all duration-200 active:scale-[0.98]"
            >
              <div className={`${item.color} w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-md`}>
                {item.icon}
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.subtitle}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="px-4 pb-6">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 px-2">🛠️ 实用工具</h2>
        <div className="grid grid-cols-3 gap-3">
          {toolMenuItems.map(item => (
            <button
              key={item.page}
              onClick={() => navigate(item.page)}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700
                         hover:shadow-md transition-all text-center active:scale-[0.98]"
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">{item.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.subtitle}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Audio Test */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">🔊 语音测试</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">点击下面按钮测试语音是否正常工作：</p>
          <div className="flex gap-2">
            <button
              onClick={() => speakLao('ສະບາຍດີ')}
              disabled={isSpeaking}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold 
                         hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSpeaking ? '🔊 播放中...' : '🇱🇦 测试老挝语'}
            </button>
            <button
              onClick={() => speakChinese('你好')}
              disabled={isSpeaking}
              className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-semibold 
                         hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {isSpeaking ? '🔊 播放中...' : '🇨🇳 测试中文'}
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            💡 如果听不到声音，请使用 Chrome 浏览器并检查系统音量
          </p>
        </div>
      </div>

      {/* Tip */}
      <div className="px-6 pb-8">
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">💡 学习提示：</span>老挝语是声调语言，先从字母表开始，
            熟悉辅音分类（中/高/低）对掌握声调很重要！
          </p>
        </div>
      </div>
    </div>
  );
}
