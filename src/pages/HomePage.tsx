import type { Page } from '../hooks/useNavigation';

interface Props {
  navigate: (page: Page) => void;
}

const menuItems = [
  { page: 'alphabet' as Page, icon: 'ອ', title: '字母表', subtitle: '老挝语27个辅音', color: 'bg-blue-500' },
  { page: 'tone' as Page, icon: '່', title: '声调学习', subtitle: '6个声调轻松掌握', color: 'bg-purple-500' },
  { page: 'vocabulary' as Page, icon: '词', title: '实用词汇', subtitle: '做生意必备词汇', color: 'bg-green-500' },
  { page: 'dialogue' as Page, icon: '💬', title: '常用对话', subtitle: '砍价、打车、吃饭', color: 'bg-orange-500' },
  { page: 'flashcard' as Page, icon: '🃏', title: '闪卡复习', subtitle: '间隔重复记得牢', color: 'bg-red-500' },
];

export default function HomePage({ navigate }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-blue-600 text-white px-6 pt-12 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🇱🇦</span>
          <div>
            <h1 className="text-2xl font-bold">老挝语学习</h1>
            <p className="text-blue-100 text-sm">在老做生意必备</p>
          </div>
        </div>
        <p className="text-blue-100 text-sm mt-3">
          掌握老挝语，生意更顺利 🤝
        </p>
      </div>

      {/* Menu Grid */}
      <div className="px-4 py-6 space-y-3">
        {menuItems.map(item => (
          <button
            key={item.page}
            onClick={() => navigate(item.page)}
            className="w-full flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 
                       hover:shadow-md hover:border-blue-200 transition-all duration-200 active:scale-[0.98]"
          >
            <div className={`${item.color} w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-md`}>
              {item.icon}
            </div>
            <div className="text-left flex-1">
              <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.subtitle}</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {/* Tip */}
      <div className="px-6 pb-8">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">💡 学习提示：</span>老挝语是声调语言，先从字母表开始，
            熟悉辅音分类（中/高/低）对掌握声调很重要！
          </p>
        </div>
      </div>
    </div>
  );
}
