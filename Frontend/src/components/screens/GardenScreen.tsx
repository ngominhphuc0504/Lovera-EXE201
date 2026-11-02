import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  Sparkles, 
  Heart, 
  History, 
  Sun, 
  Camera, 
  Layers, 
  ArrowRight,
  Sprout,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter,
  User,
  Users,
  Award
} from 'lucide-react';
import { CoupleData, PointHistoryItem, GardenStage, GardenSeason } from '../../types';
import { playSound } from '../../utils/audio';
import { GardenTreeVisual } from './GardenTreeVisual';

interface GardenScreenProps {
  couple: CoupleData;
  lovePoints: number;
  history: PointHistoryItem[];
  onWater: () => void;
  onFertilize: () => void;
  onSunbath: () => void;
  onSaveMemory: () => void;
  isWatering?: boolean;
  isFertilizing?: boolean;
  isSunbathing?: boolean;
}

export const GardenScreen: React.FC<GardenScreenProps> = ({
  couple,
  lovePoints,
  history,
  onWater,
  onFertilize,
  onSunbath,
  onSaveMemory,
  isWatering = false,
  isFertilizing = false,
  isSunbathing = false,
}) => {
  const { userA, userB } = couple;

  // Real natural stage based on points:
  // Stage 1: Hạt Mầm Trái Tim (0 – 99 pts)
  // Stage 2: Cây Non Đâm Chồi (100 – 299 pts)
  // Stage 3: Hoa Hồng Nở Rộ (300 – 499 pts)
  // Stage 4: Cây Đại Thụ Hạnh Phúc (500 – 999 pts)
  // Stage 5: Cổ Thụ Bách Niên Bốn Mùa (1000+ pts)
  const realStage: GardenStage = lovePoints >= 1000 ? 5 : lovePoints >= 500 ? 4 : lovePoints >= 300 ? 3 : lovePoints >= 100 ? 2 : 1;
  const [previewStage, setPreviewStage] = useState<GardenStage>(realStage);

  // Active season state with persistence
  const [selectedSeason, setSelectedSeason] = useState<GardenSeason>(() => {
    try {
      const saved = localStorage.getItem('lovera_garden_season') as GardenSeason;
      if (['spring', 'summer', 'autumn', 'winter'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    const m = new Date().getMonth() + 1;
    if (m >= 3 && m <= 5) return 'spring';
    if (m >= 6 && m <= 8) return 'summer';
    if (m >= 9 && m <= 11) return 'autumn';
    return 'winter';
  });

  // Update preview stage when points grow
  useEffect(() => {
    setPreviewStage(realStage);
  }, [realStage]);

  const handleSelectSeason = (season: GardenSeason) => {
    playSound('click');
    setSelectedSeason(season);
    try {
      localStorage.setItem('lovera_garden_season', season);
    } catch {
      // ignore
    }
  };

  const STAGE_DETAILS = {
    1: {
      title: 'Cấp 1: Hạt Mầm Trái Tim',
      sub: 'Mầm yêu thương bắt đầu nảy nở',
      range: '0 – 99 Pts',
      desc: 'Hạt giống được gieo mầm bằng sự chân thành của hai bạn, chồi non mang hai lá mầm hình trái tim biếc xanh đang vươn lên từ đất ấm.',
      minPts: 0,
      nextTarget: 100,
      icon: '🌱',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    2: {
      title: 'Cấp 2: Cây Non Đâm Chồi',
      sub: 'Tán lá vươn cao đón nắng ban mai',
      range: '100 – 299 Pts',
      desc: 'Cây tình yêu ngày một vững chãi, các nhánh lá tim sum suê đọng sương mai cùng những nụ hoa hồng chúm chím chờ ngày bung nở.',
      minPts: 100,
      nextTarget: 300,
      icon: '🌿',
      tagColor: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    3: {
      title: 'Cấp 3: Hoa Hồng Nở Rộ',
      sub: 'Hương thơm ngạt ngào khoe sắc thắm',
      range: '300 – 499 Pts',
      desc: 'Bụi hoa tình yêu nở bung những đóa hồng nhung đỏ rực rỡ, cánh hoa bay lấp lánh trong nắng báo hiệu tình cảm ngày càng nồng nàn!',
      minPts: 300,
      nextTarget: 500,
      icon: '🌸',
      tagColor: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    4: {
      title: 'Cấp 4: Cây Đại Thụ Hạnh Phúc',
      sub: 'Trĩu quả ngọt ngào & vĩnh cửu',
      range: '500 – 999 Pts',
      desc: 'Cây đại thụ tình yêu vươn cao rợp bóng mát, kết trái ngọt hạnh phúc, là minh chứng bền chặt cho chặng đường yêu thương của hai bạn.',
      minPts: 500,
      nextTarget: 1000,
      icon: '🌳',
      tagColor: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    5: {
      title: 'Cấp 5: Cổ Thụ Bách Niên Bốn Mùa',
      sub: 'Tình yêu trường tồn qua bốn mùa',
      range: '1000+ Pts',
      desc: 'Cổ thụ thần thoại uy nghiêm với thân đôi gắn kết ngàn năm, biến đổi cảnh sắc diệu kỳ qua bốn mùa Xuân - Hạ - Thu - Đông, tượng trưng cho tình yêu bách niên giai lão.',
      minPts: 1000,
      nextTarget: 2000,
      icon: '✨',
      tagColor: 'bg-gradient-to-r from-amber-50 to-purple-50 text-purple-900 border-purple-200'
    }
  }[previewStage];

  const SEASON_CONFIG = {
    spring: {
      name: 'Mùa Xuân',
      icon: '🌸',
      tagline: 'Hoa nở rực rỡ • Tình xuân ấm áp',
      bgGradient: 'from-pink-200/90 via-rose-100/70 to-emerald-100/80',
      borderColor: 'border-pink-300/80',
      sunColor: 'text-rose-400 fill-pink-300',
    },
    summer: {
      name: 'Mùa Hạ',
      icon: '☀️',
      tagline: 'Nắng vàng chan hòa • Trái ngọt sum suê',
      bgGradient: 'from-sky-200/80 via-emerald-100/60 to-emerald-200/90',
      borderColor: 'border-emerald-300/80',
      sunColor: 'text-amber-400 fill-amber-300',
    },
    autumn: {
      name: 'Mùa Thu',
      icon: '🍁',
      tagline: 'Lá phong nhuộm vàng • Chiều thu lãng mạn',
      bgGradient: 'from-amber-200/85 via-orange-100/70 to-amber-100/80',
      borderColor: 'border-amber-300/80',
      sunColor: 'text-orange-400 fill-amber-300',
    },
    winter: {
      name: 'Mùa Đông',
      icon: '❄️',
      tagline: 'Tuyết phủ tinh khôi • Sưởi ấm tim nhau',
      bgGradient: 'from-slate-200/90 via-blue-100/70 to-indigo-100/80',
      borderColor: 'border-sky-300/80',
      sunColor: 'text-sky-300 fill-sky-200',
    },
  }[selectedSeason];

  // Calculate progress percent to next stage for current real points
  const progressPercent = realStage === 1 
    ? Math.min(100, Math.floor((lovePoints / 100) * 100))
    : realStage === 2
    ? Math.min(100, Math.floor(((lovePoints - 100) / 200) * 100))
    : realStage === 3
    ? Math.min(100, Math.floor(((lovePoints - 300) / 200) * 100))
    : realStage === 4
    ? Math.min(100, Math.floor(((lovePoints - 500) / 500) * 100))
    : 100;

  const pointsToNextStage = realStage === 1
    ? 100 - lovePoints
    : realStage === 2
    ? 300 - lovePoints
    : realStage === 3
    ? 500 - lovePoints
    : realStage === 4
    ? 1000 - lovePoints
    : 0;

  // Lịch sử chăm sóc của chính chủ (userA)
  const userHistory = history.filter((item) => {
    const byLower = item.by.toLowerCase();
    return byLower.includes(userA.name.toLowerCase()) || !byLower.includes(userB.name.toLowerCase());
  });

  // Calculate contributor stats
  const alexCount = history.filter(h => h.by.toLowerCase().includes('alex')).length;
  const samCount = history.filter(h => h.by.toLowerCase().includes('sam')).length;
  const totalCount = Math.max(1, alexCount + samCount);
  const alexPercent = Math.round((alexCount / totalCount) * 100);
  const samPercent = 100 - alexPercent;

  // Icon for history category
  const getActionIcon = (action: string, category?: string) => {
    if (category === 'water' || action.includes('Tưới')) return '💧';
    if (category === 'fertilize' || action.includes('phân')) return '🌿';
    if (category === 'sun' || action.includes('nắng')) return '☀️';
    if (category === 'memory' || action.includes('ảnh') || action.includes('kỷ niệm')) return '📸';
    if (category === 'chat' || action.includes('AI')) return '🤖';
    if (category === 'dating' || action.includes('hẹn')) return '💖';
    return '✨';
  };

  return (
    <div className="space-y-4 pb-16 sm:pb-20 pt-2 text-stone-800 select-none">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. GARDEN HEADER & STATS                                      */}
      {/* ------------------------------------------------------------- */}
      <div className="mx-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wide">
            <Sprout className="w-4 h-4 text-emerald-500" />
            <span>Love Garden • Vườn Yêu 1:1</span>
          </div>
          <h2 className="text-base font-bold text-stone-900 font-serif-romantic">
            Vườn Hoa Của {userA.name} & {userB.name}
          </h2>
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-rose-50 border border-emerald-200/90 px-3 py-1 rounded-2xl flex items-center gap-1.5 text-emerald-700 font-bold text-xs shadow-2xs">
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-heart-pulse" />
          <span>{lovePoints} Pts</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. REALISTIC BOTANICAL GARDEN CANVAS                          */}
      {/* ------------------------------------------------------------- */}
      <div className={`mx-4 rounded-3xl bg-gradient-to-b ${SEASON_CONFIG.bgGradient} border ${SEASON_CONFIG.borderColor} shadow-md p-4 relative overflow-hidden text-stone-800 transition-all duration-700`}>
        
        {/* Sky Background Elements: Sun & Clouds */}
        <div className="absolute top-2 right-3 flex items-center gap-2 pointer-events-none z-0">
          <div className="relative">
            <Sun className={`w-10 h-10 ${SEASON_CONFIG.sunColor} ${isSunbathing ? 'animate-spin' : 'animate-soft-float'}`} />
            <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-md"></div>
          </div>
        </div>

        {/* Floating Clouds */}
        <div className="absolute top-4 left-6 w-16 h-5 bg-white/70 rounded-full blur-xs pointer-events-none"></div>
        <div className="absolute top-8 left-16 w-12 h-4 bg-white/50 rounded-full blur-xs pointer-events-none"></div>

        {/* Seasonal Falling Particles Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {selectedSeason === 'spring' && (
            <>
              <span className="absolute top-0 left-[8%] text-sm animate-falling-petal [animation-delay:0s]">🌸</span>
              <span className="absolute top-0 left-[26%] text-xs animate-falling-petal [animation-delay:2.4s]">🌸</span>
              <span className="absolute top-0 left-[48%] text-sm animate-falling-petal [animation-delay:4.2s]">🌺</span>
              <span className="absolute top-0 left-[68%] text-xs animate-falling-petal [animation-delay:1.6s]">🌸</span>
              <span className="absolute top-0 left-[86%] text-sm animate-falling-petal [animation-delay:3.5s]">🌸</span>
              <span className="absolute top-14 left-4 text-base animate-bounce [animation-duration:3.2s]">🦋</span>
            </>
          )}
          {selectedSeason === 'summer' && (
            <>
              <span className="absolute top-8 left-[18%] w-2 h-2 rounded-full bg-yellow-300 blur-[0.5px] animate-firefly [animation-delay:0.3s]"></span>
              <span className="absolute top-16 left-[72%] w-2.5 h-2.5 rounded-full bg-emerald-300 blur-[0.5px] animate-firefly [animation-delay:1.7s]"></span>
              <span className="absolute top-28 left-[35%] w-2 h-2 rounded-full bg-yellow-200 blur-[0.5px] animate-firefly [animation-delay:2.8s]"></span>
              <span className="absolute top-36 left-[82%] w-2 h-2 rounded-full bg-lime-300 blur-[0.5px] animate-firefly [animation-delay:0.9s]"></span>
              <span className="absolute top-14 left-4 text-sm animate-soft-float">🐝</span>
              <span className="absolute top-22 right-8 text-xs animate-pulse">✨</span>
            </>
          )}
          {selectedSeason === 'autumn' && (
            <>
              <span className="absolute top-0 left-[14%] text-sm animate-falling-leaf [animation-delay:0.2s]">🍁</span>
              <span className="absolute top-0 left-[34%] text-xs animate-falling-leaf [animation-delay:2.5s]">🍂</span>
              <span className="absolute top-0 left-[58%] text-sm animate-falling-leaf [animation-delay:4.4s]">🍁</span>
              <span className="absolute top-0 left-[76%] text-xs animate-falling-leaf [animation-delay:1.3s]">🍂</span>
              <span className="absolute top-0 left-[90%] text-sm animate-falling-leaf [animation-delay:3.2s]">🍁</span>
            </>
          )}
          {selectedSeason === 'winter' && (
            <>
              <span className="absolute top-0 left-[8%] text-xs animate-falling-snow [animation-delay:0s]">❄️</span>
              <span className="absolute top-0 left-[24%] text-sm animate-falling-snow [animation-delay:1.8s]">❄️</span>
              <span className="absolute top-0 left-[44%] text-xs animate-falling-snow [animation-delay:3.5s]">❅</span>
              <span className="absolute top-0 left-[64%] text-sm animate-falling-snow [animation-delay:1.2s]">❄️</span>
              <span className="absolute top-0 left-[82%] text-xs animate-falling-snow [animation-delay:2.8s]">❅</span>
              <span className="absolute top-0 left-[94%] text-sm animate-falling-snow [animation-delay:4.5s]">❄️</span>
            </>
          )}
        </div>

        {/* ----------------------------------------------------------- */}
        {/* FOUR SEASONS SELECTOR BAR (XUÂN - HẠ - THU - ĐÔNG)          */}
        {/* ----------------------------------------------------------- */}
        <div className="flex items-center justify-between gap-1 p-1 bg-white/85 backdrop-blur-md rounded-2xl border border-white/70 shadow-2xs mb-2.5 z-20 relative">
          {(['spring', 'summer', 'autumn', 'winter'] as GardenSeason[]).map((seas) => {
            const isSelected = selectedSeason === seas;
            const meta = {
              spring: { label: 'Xuân', icon: '🌸' },
              summer: { label: 'Hạ', icon: '☀️' },
              autumn: { label: 'Thu', icon: '🍁' },
              winter: { label: 'Đông', icon: '❄️' },
            }[seas];

            return (
              <button
                key={seas}
                onClick={() => handleSelectSeason(seas)}
                className={`flex-1 py-1 px-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer ${
                  isSelected
                    ? seas === 'spring'
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs'
                      : seas === 'summer'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xs'
                      : seas === 'autumn'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                      : 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>

        {/* Top Status Pill inside Garden */}
        <div className="flex items-center justify-between z-10 relative mb-1">
          <div className="flex items-center gap-1.5 bg-white/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/80 shadow-2xs">
            <span className="text-base">{STAGE_DETAILS.icon}</span>
            <span className="text-xs font-bold text-stone-900">
              {STAGE_DETAILS.title}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] bg-white/85 backdrop-blur-md text-stone-700 px-2 py-1 rounded-xl border border-white/80 font-bold shadow-2xs">
              {STAGE_DETAILS.range}
            </span>
          </div>
        </div>

        {/* Central Garden Scene: High-End Botanical SVG Tree */}
        <div className="relative w-full flex flex-col items-center justify-center my-1 z-10 min-h-[250px] sm:min-h-[270px]">
          <GardenTreeVisual
            stage={previewStage}
            season={selectedSeason}
            userAName={userA.name}
            userBName={userB.name}
          />

          {/* Watering Animation Overlay */}
          {isWatering && (
            <div className="absolute inset-0 bg-sky-900/40 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center z-30 animate-fade-in text-white space-y-2">
              <div className="w-14 h-14 rounded-full bg-sky-400/30 flex items-center justify-center ring-4 ring-sky-300 animate-pulse">
                <Droplets className="w-8 h-8 text-sky-200 animate-bounce" />
              </div>
              <div className="text-center">
                <strong className="text-sm font-bold block text-sky-100">Đang tưới nước mát lành...</strong>
                <span className="text-[11px] text-sky-200">+10 Love Points vào đất mẹ 💧</span>
              </div>
            </div>
          )}

          {/* Fertilizing Animation Overlay */}
          {isFertilizing && (
            <div className="absolute inset-0 bg-emerald-900/40 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center z-30 animate-fade-in text-white space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-400/30 flex items-center justify-center ring-4 ring-emerald-300 animate-pulse">
                <Sprout className="w-8 h-8 text-emerald-200 animate-bounce" />
              </div>
              <div className="text-center">
                <strong className="text-sm font-bold block text-emerald-100">Đang bón dưỡng chất yêu thương...</strong>
                <span className="text-[11px] text-emerald-200">+10 Love Points giúp rễ đâm sâu 🌿</span>
              </div>
            </div>
          )}

          {/* Sunbathing Animation Overlay */}
          {isSunbathing && (
            <div className="absolute inset-0 bg-amber-900/30 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center z-30 animate-fade-in text-white space-y-2">
              <div className="w-14 h-14 rounded-full bg-amber-400/30 flex items-center justify-center ring-4 ring-amber-300 animate-spin">
                <Sun className="w-8 h-8 text-amber-200" />
              </div>
              <div className="text-center">
                <strong className="text-sm font-bold block text-amber-100">Đang tắm nắng ấm ban mai...</strong>
                <span className="text-[11px] text-amber-200">+5 Love Points quang hợp tươi tốt ☀️</span>
              </div>
            </div>
          )}
        </div>

        {/* Stage Timeline Selector: 5 Stages */}
        <div className="grid grid-cols-5 gap-1 p-1 bg-white/85 backdrop-blur-md rounded-2xl border border-white/80 mb-3 shadow-2xs z-10 relative">
          {([1, 2, 3, 4, 5] as GardenStage[]).map((stg) => {
            const isSelected = previewStage === stg;
            const isReached = realStage >= stg;
            const labels = {
              1: '🌱 Cấp 1',
              2: '🌿 Cấp 2',
              3: '🌸 Cấp 3',
              4: '🌳 Cấp 4',
              5: '✨ Cấp 5',
            }[stg];

            return (
              <button
                key={stg}
                onClick={() => {
                  playSound('click');
                  setPreviewStage(stg);
                }}
                className={`py-1.5 px-0.5 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs scale-102'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-emerald-50'
                }`}
              >
                <span className="truncate">{labels}</span>
                {isReached && <span className="text-[8px] text-emerald-300 font-extrabold mt-0.5">Đã đạt ✓</span>}
              </button>
            );
          })}
        </div>

        {/* Progress Bar to next stage */}
        <div className="space-y-1.5 pt-2 border-t border-white/60 z-10 relative">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-900">
            <span className="text-[11px]">
              {realStage === 5 
                ? '🎉 Khu vườn tình yêu đạt cấp độ cổ thụ vĩnh cửu cao nhất!' 
                : `Cần thêm ${pointsToNextStage} pts để lên Cấp ${realStage + 1}`}
            </span>
            <span className="font-extrabold text-emerald-700 bg-white/85 px-2 py-0.5 rounded-full border border-white/80 shadow-2xs">
              {progressPercent}%
            </span>
          </div>

          <div className="w-full h-2.5 bg-white/60 rounded-full overflow-hidden border border-white/80 p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-rose-500 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Garden Eco-Metrics */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-emerald-300/60 text-xs z-10 relative">
          <div className="bg-white/85 backdrop-blur-md rounded-2xl p-2.5 border border-emerald-200/80 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-base">💧</span>
              <div>
                <span className="text-[10px] text-stone-500 block leading-tight">Độ ẩm đất</span>
                <strong className="text-xs font-bold text-emerald-800">88% (Màu mỡ)</strong>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <div className="bg-white/85 backdrop-blur-md rounded-2xl p-2.5 border border-emerald-200/80 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🌿</span>
              <div>
                <span className="text-[10px] text-stone-500 block leading-tight">Độ tươi tốt</span>
                <strong className="text-xs font-bold text-teal-800">96% (Xanh tươi)</strong>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. GARDEN CARE ACTION TOOLS (Thay thế nút điểm danh cũ)        */}
      {/* ------------------------------------------------------------- */}
      <div className="mx-4 bg-white/95 rounded-3xl p-4 border border-emerald-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span>Hoạt Động Chăm Sóc Khu Vườn Tình Yêu:</span>
          </h4>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
            Tích điểm chung
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          
          {/* Water Tool */}
          <button
            onClick={() => {
              playSound('water');
              onWater();
            }}
            disabled={isWatering}
            className="p-3 rounded-2xl bg-gradient-to-b from-sky-50 to-sky-100/70 border border-sky-200 hover:border-sky-300 text-center space-y-1 transition-all active:scale-95 shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white mx-auto flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Droplets className="w-5 h-5 fill-sky-200" />
            </div>
            <strong className="block text-xs font-bold text-sky-900">Tưới Cây</strong>
            <span className="inline-block text-[10px] font-extrabold text-sky-700 bg-white px-2 py-0.2 rounded-full border border-sky-200">
              +10 pts
            </span>
          </button>

          {/* Fertilize Tool */}
          <button
            onClick={() => {
              playSound('click');
              onFertilize();
            }}
            disabled={isFertilizing}
            className="p-3 rounded-2xl bg-gradient-to-b from-emerald-50 to-emerald-100/70 border border-emerald-200 hover:border-emerald-300 text-center space-y-1 transition-all active:scale-95 shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5" />
            </div>
            <strong className="block text-xs font-bold text-emerald-900">Bón Phân</strong>
            <span className="inline-block text-[10px] font-extrabold text-emerald-700 bg-white px-2 py-0.2 rounded-full border border-emerald-200">
              +10 pts
            </span>
          </button>

          {/* Sunbath Tool */}
          <button
            onClick={() => {
              playSound('chime');
              onSunbath();
            }}
            disabled={isSunbathing}
            className="p-3 rounded-2xl bg-gradient-to-b from-amber-50 to-amber-100/70 border border-amber-200 hover:border-amber-300 text-center space-y-1 transition-all active:scale-95 shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white mx-auto flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Sun className="w-5 h-5 fill-amber-200" />
            </div>
            <strong className="block text-xs font-bold text-amber-900">Tắm Nắng</strong>
            <span className="inline-block text-[10px] font-extrabold text-amber-700 bg-white px-2 py-0.2 rounded-full border border-amber-200">
              +5 pts
            </span>
          </button>
        </div>

        {/* Quick Link to Space Memories */}
        <button
          onClick={() => {
            playSound('click');
            onSaveMemory();
          }}
          className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl text-xs font-semibold border border-rose-200 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Camera className="w-3.5 h-3.5 text-rose-500" />
          <span>Lưu ảnh kỷ niệm vào Space (+10 pts)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. COUPLE EFFORT RATIO (Cùng nhau vun đắp)                     */}
      {/* ------------------------------------------------------------- */}
      <div className="mx-4 bg-white/95 rounded-3xl p-4 border border-rose-100 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-stone-800 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-rose-500" />
            <span>Mức Độ Vun Đắp Của Đôi Bạn:</span>
          </span>
          <span className="text-[10px] text-stone-500">
            {totalCount} lượt chăm sóc
          </span>
        </div>

        <div className="flex items-center justify-between text-xs font-bold px-1">
          <div className="flex items-center gap-1.5 text-rose-700">
            <img src={userA.avatar} alt={userA.name} className="w-5 h-5 rounded-full object-cover border border-rose-200" />
            <span>{userA.name} ({alexPercent}%)</span>
          </div>

          <div className="flex items-center gap-1.5 text-purple-700">
            <span>{userB.name} ({samPercent}%)</span>
            <img src={userB.avatar} alt={userB.name} className="w-5 h-5 rounded-full object-cover border border-purple-200" />
          </div>
        </div>

        <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden flex shadow-inner">
          <div className="bg-gradient-to-r from-rose-500 to-pink-500 h-full" style={{ width: `${alexPercent}%` }}></div>
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full" style={{ width: `${samPercent}%` }}></div>
        </div>

        <p className="text-[11px] text-stone-500 text-center italic pt-0.5">
          "Mỗi giọt nước, mỗi hạt mầm tưới tắm hôm nay sẽ nở thành nụ cười của hai bạn ngày mai." ✨
        </p>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. POINT HISTORY & ACTIVITY LOG (Đầy đủ thời gian & filter)    */}
      {/* ------------------------------------------------------------- */}
      <div className="mx-4 bg-white/95 rounded-3xl p-4 border border-stone-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <History className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-stone-900">
              Lịch Sử Chăm Sóc & Tích Điểm
            </h4>
          </div>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200 shadow-2xs">
            {userHistory.length} hoạt động
          </span>
        </div>

        {/* History List (Chính chủ) */}
        {userHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400 space-y-2 bg-stone-50/60 rounded-2xl border border-dashed border-stone-200">
            <p className="font-medium">Chưa có lịch sử chăm sóc nào.</p>
            <p className="text-[10px] text-stone-400">Hãy nhấn tưới cây hoặc bón phân để tích lũy điểm đầu tiên!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1 pb-1">
            {userHistory.map((item) => {
              const avatar = userA.avatar;
              const icon = getActionIcon(item.action, item.category);

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-stone-50/90 hover:bg-emerald-50/40 border border-stone-100 transition-colors flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    {/* User Avatar with action badge */}
                    <div className="relative shrink-0">
                      <img
                        src={avatar}
                        alt={userA.name}
                        className="w-8 h-8 rounded-xl object-cover border border-stone-200"
                      />
                      <span className="absolute -bottom-1 -right-1 text-xs bg-white rounded-full shadow-2xs border border-stone-100 px-0.5">
                        {icon}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <p className="font-bold text-stone-800 text-[11px] leading-tight">
                        {item.action}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
                        <span className="font-semibold text-rose-600">Bạn ({userA.name})</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-stone-500">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{item.timestamp}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="font-extrabold text-emerald-700 text-xs bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/80 shrink-0 shadow-2xs">
                    +{item.points} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
