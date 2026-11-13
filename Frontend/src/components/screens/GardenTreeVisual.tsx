import React from 'react';
import { GardenSeason, GardenStage } from '../../types';
import treeStage5Spring from '../../assets/images/tree_stage5_spring.png';
import treeStage5Summer from '../../assets/images/tree_stage5_summer.png';
import treeStage5Autumn from '../../assets/images/tree_stage5_autumn.png';
import treeStage5Winter from '../../assets/images/tree_stage5_winter.png';

interface GardenTreeVisualProps {
  stage: GardenStage;
  season: GardenSeason;
  userAName: string;
  userBName: string;
}

const STAGE5_IMAGES: Record<GardenSeason, string> = {
  spring: treeStage5Spring,
  summer: treeStage5Summer,
  autumn: treeStage5Autumn,
  winter: treeStage5Winter,
};

export const GardenTreeVisual: React.FC<GardenTreeVisualProps> = ({
  stage,
  season,
  userAName,
  userBName,
}) => {
  // If Stage 5 (Cổ Thụ Bách Niên Bốn Mùa), display the masterpiece bonsai artwork synchronized with seasons
  if (stage === 5) {
    const currentImg = STAGE5_IMAGES[season] || treeStage5Spring;

    return (
      <div className="relative w-full max-w-[340px] h-[260px] sm:h-[280px] flex items-center justify-center select-none">
        {/* Soft magical seasonal aura */}
        <div
          className={`absolute inset-0 rounded-full blur-2xl opacity-40 pointer-events-none transition-all duration-700 ${
            season === 'spring'
              ? 'bg-pink-300'
              : season === 'summer'
              ? 'bg-emerald-300'
              : season === 'autumn'
              ? 'bg-amber-300'
              : 'bg-sky-200'
          }`}
        />

        {/* Masterpiece Bonsai Ancient Tree */}
        <img
          key={season}
          src={currentImg}
          alt={`Cổ Thụ Bách Niên Bốn Mùa - ${season}`}
          className="relative z-10 max-w-full max-h-full object-contain drop-shadow-xl animate-fade-in transition-transform duration-500 hover:scale-[1.02]"
          draggable={false}
        />

        {/* Ambient floating seasonal particles (sparkles / petals) */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          {season === 'spring' && (
            <>
              <span className="absolute top-6 left-8 text-sm animate-bounce opacity-80">🌸</span>
              <span className="absolute top-12 right-6 text-xs animate-pulse opacity-75">✨</span>
              <span className="absolute bottom-14 left-10 text-xs animate-soft-float opacity-70">🌸</span>
            </>
          )}
          {season === 'summer' && (
            <>
              <span className="absolute top-6 right-8 text-xs animate-pulse opacity-85">✨</span>
              <span className="absolute top-14 left-6 text-xs animate-bounce opacity-75">☀️</span>
              <span className="absolute bottom-14 right-10 text-xs animate-soft-float opacity-70">🌿</span>
            </>
          )}
          {season === 'autumn' && (
            <>
              <span className="absolute top-6 left-8 text-sm animate-bounce opacity-80">🍁</span>
              <span className="absolute top-12 right-6 text-xs animate-pulse opacity-75">🍂</span>
              <span className="absolute bottom-14 left-10 text-xs animate-soft-float opacity-70">✨</span>
            </>
          )}
          {season === 'winter' && (
            <>
              <span className="absolute top-6 right-8 text-xs animate-pulse opacity-85">❄️</span>
              <span className="absolute top-14 left-6 text-xs animate-bounce opacity-75">⭐</span>
              <span className="absolute bottom-14 right-10 text-xs animate-soft-float opacity-70">❄️</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[340px] h-[250px] sm:h-[270px] flex items-center justify-center select-none">
      
      {/* ----------------------------------------------------------------- */}
      {/* SVG TREE CANVAS WITH RICH BOTANICAL GRADIENTS & SHADOWS           */}
      {/* ----------------------------------------------------------------- */}
      <svg
        viewBox="0 0 340 280"
        className="w-full h-full overflow-visible drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Trunk & Bark Gradients */}
          <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6B4226" />
            <stop offset="40%" stopColor="#8B5A2B" />
            <stop offset="70%" stopColor="#A06535" />
            <stop offset="100%" stopColor="#5C381E" />
          </linearGradient>

          <linearGradient id="trunkAncientGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#583116" />
            <stop offset="30%" stopColor="#7E4A25" />
            <stop offset="70%" stopColor="#9C6237" />
            <stop offset="100%" stopColor="#4A260F" />
          </linearGradient>

          {/* Pot Terracotta & Gold Rim Gradients */}
          <linearGradient id="potGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B45309" />
            <stop offset="35%" stopColor="#D97706" />
            <stop offset="75%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          <linearGradient id="goldRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          <linearGradient id="soilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3E2723" />
            <stop offset="100%" stopColor="#1B0E09" />
          </linearGradient>

          {/* Leaf Gradients - Dynamically synchronized with season */}
          <linearGradient id="leafSummer1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={
              season === 'spring' ? '#FBCFE8' :
              season === 'autumn' ? '#FDE047' :
              season === 'winter' ? '#E0F2FE' : '#4ADE80'
            } />
            <stop offset="100%" stopColor={
              season === 'spring' ? '#DB2777' :
              season === 'autumn' ? '#C2410C' :
              season === 'winter' ? '#0F766E' : '#15803D'
            } />
          </linearGradient>
          <linearGradient id="leafSummer2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={
              season === 'spring' ? '#FCE7F3' :
              season === 'autumn' ? '#FEF08A' :
              season === 'winter' ? '#FFFFFF' : '#86EFAC'
            } />
            <stop offset="50%" stopColor={
              season === 'spring' ? '#F472B6' :
              season === 'autumn' ? '#FB923C' :
              season === 'winter' ? '#38BDF8' : '#22C55E'
            } />
            <stop offset="100%" stopColor={
              season === 'spring' ? '#BE185D' :
              season === 'autumn' ? '#991B1B' :
              season === 'winter' ? '#115E59' : '#166534'
            } />
          </linearGradient>

          {/* Spring Sakura Gradients */}
          <linearGradient id="sakuraCanopy1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FBCFE8" />
            <stop offset="60%" stopColor="#F472B6" />
            <stop offset="100%" stopColor="#DB2777" />
          </linearGradient>
          <linearGradient id="sakuraCanopy2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCE7F3" />
            <stop offset="50%" stopColor="#F9A8D4" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>

          {/* Autumn Maple Gradients */}
          <linearGradient id="autumnCanopy1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#C2410C" />
          </linearGradient>
          <linearGradient id="autumnCanopy2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#FB923C" />
            <stop offset="100%" stopColor="#B91C1C" />
          </linearGradient>

          {/* Winter Snow Gradients */}
          <linearGradient id="winterCanopy1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
          <linearGradient id="winterPineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="60%" stopColor="#0F766E" />
            <stop offset="100%" stopColor="#115E59" />
          </linearGradient>

          {/* Rose Petal Gradient */}
          <linearGradient id="roseRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDA4AF" />
            <stop offset="40%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#BE123C" />
          </linearGradient>

          {/* Apple & Heart Fruit Gradient */}
          <radialGradient id="appleGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FF6B81" />
            <stop offset="40%" stopColor="#EE5253" />
            <stop offset="100%" stopColor="#B33939" />
          </radialGradient>

          {/* Glow filter */}
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ============================================================= */}
        {/* AMBIENT AURAS & BACKGROUND GLOW ACCORDING TO STAGE            */}
        {/* ============================================================= */}
        {stage === 4 && (
          <ellipse
            cx="170"
            cy="120"
            rx={95}
            ry={70}
            className="transition-all duration-700 fill-emerald-300/20"
            filter="url(#softGlow)"
          />
        )}

        {/* ============================================================= */}
        {/* STAGE 1: HẠT MẦM TRÁI TIM (SEEDLING)                          */}
        {/* ============================================================= */}
        {stage === 1 && (
          <g className="animate-soft-float origin-bottom">
            {/* The Seed nestled in soil */}
            <path
              d="M162 205 C158 198, 160 190, 168 190 C176 190, 180 198, 174 205 Z"
              fill="#78350F"
              stroke="#592408"
              strokeWidth="1.5"
            />
            {/* Golden crack line */}
            <path d="M168 191 Q167 197 170 203" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />

            {/* Sprout stem */}
            <path
              d="M168 192 C167 175, 171 160, 170 148"
              stroke="#4ADE80"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M169 192 C168 175, 172 160, 171 148"
              stroke="#86EFAC"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Left Heart Leaf */}
            <path
              d="M170 148 C158 136, 140 142, 144 154 C148 166, 168 160, 170 152 Z"
              fill="url(#leafSummer2)"
              stroke="#15803D"
              strokeWidth="1.5"
            />
            {/* Right Heart Leaf */}
            <path
              d="M170 148 C182 136, 200 142, 196 154 C192 166, 172 160, 170 152 Z"
              fill="url(#leafSummer1)"
              stroke="#15803D"
              strokeWidth="1.5"
            />

            {/* Dew drop shining on tip */}
            <circle cx="170" cy="144" r="3" fill="#E0F2FE" opacity="0.9" />
            <circle cx="169" cy="143" r="1" fill="#FFFFFF" />

            {/* Sparkle stars */}
            <text x="135" y="140" className="text-[12px] animate-pulse">✨</text>
            <text x="195" y="145" className="text-[10px] animate-bounce">💖</text>
          </g>
        )}

        {/* ============================================================= */}
        {/* STAGE 2: CÂY NON ĐÂM CHỒI (YOUNG HEART SAPLING)               */}
        {/* ============================================================= */}
        {stage === 2 && (
          <g className="animate-soft-float origin-bottom">
            {/* Young Slender Trunk */}
            <path
              d="M165 204 C166 180, 167 150, 169 122 C171 150, 172 180, 174 204 Z"
              fill="url(#trunkGrad)"
            />
            {/* Branch Left */}
            <path
              d="M167 165 C156 158, 148 152, 140 150"
              stroke="#7E4A25"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Branch Right */}
            <path
              d="M171 150 C182 144, 192 138, 202 135"
              stroke="#7E4A25"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Leaves Cluster Left */}
            <path
              d="M140 150 C128 140, 122 154, 134 162 C146 170, 148 154, 140 150 Z"
              fill="url(#leafSummer2)"
              stroke="#166534"
              strokeWidth="1.2"
            />
            <path
              d="M142 148 C144 135, 130 130, 126 142 C122 154, 138 152, 142 148 Z"
              fill="url(#leafSummer1)"
              stroke="#166534"
              strokeWidth="1.2"
            />

            {/* Leaves Cluster Right */}
            <path
              d="M202 135 C214 125, 222 138, 210 148 C198 156, 194 140, 202 135 Z"
              fill="url(#leafSummer2)"
              stroke="#166534"
              strokeWidth="1.2"
            />
            <path
              d="M200 133 C202 120, 218 116, 220 128 C222 140, 204 138, 200 133 Z"
              fill="url(#leafSummer1)"
              stroke="#166534"
              strokeWidth="1.2"
            />

            {/* Top Crown Foliage */}
            <circle cx="169" cy="118" r="16" fill="url(#leafSummer1)" />
            <circle cx="160" cy="112" r="14" fill="url(#leafSummer2)" />
            <circle cx="178" cy="112" r="14" fill="url(#leafSummer2)" />
            <circle cx="169" cy="102" r="15" fill="url(#leafSummer1)" />

            {/* Rose Bud waiting to blossom */}
            <circle cx="169" cy="98" r="5" fill="#F43F5E" />
            <path d="M169 93 C166 90, 172 90, 169 93" stroke="#FDA4AF" strokeWidth="1.5" />

            <text x="120" y="130" className="text-[12px] animate-bounce">🌿</text>
            <text x="210" y="115" className="text-[12px] animate-pulse">🌸</text>
          </g>
        )}

        {/* ============================================================= */}
        {/* STAGE 3: BỤI HOA HỒNG NỞ RỘ (BLOOMING ROSE BUSH)               */}
        {/* ============================================================= */}
        {stage === 3 && (
          <g className="animate-soft-float origin-bottom">
            {/* Bush Foliage Base */}
            <circle cx="145" cy="160" r="26" fill="url(#leafSummer2)" />
            <circle cx="195" cy="160" r="26" fill="url(#leafSummer2)" />
            <circle cx="130" cy="138" r="28" fill="url(#leafSummer1)" />
            <circle cx="210" cy="138" r="28" fill="url(#leafSummer1)" />
            <circle cx="170" cy="148" r="34" fill="url(#leafSummer2)" />
            <circle cx="150" cy="118" r="30" fill="url(#leafSummer1)" />
            <circle cx="190" cy="118" r="30" fill="url(#leafSummer1)" />
            <circle cx="170" cy="100" r="28" fill="url(#leafSummer2)" />

            {/* Stems inside bush */}
            <path d="M165 204 Q162 170 152 135" stroke="#166534" strokeWidth="4" />
            <path d="M172 204 Q176 170 188 135" stroke="#166534" strokeWidth="4" />

            {/* Rose 1 - Center Big Red */}
            <g transform="translate(170, 115)">
              <circle cx="0" cy="0" r="14" fill="url(#roseRedGrad)" stroke="#9F1239" strokeWidth="1" />
              <path d="M-6 -2 C-4 -8, 4 -8, 6 -2 C8 4, -8 4, -6 -2" fill="#E11D48" />
              <circle cx="0" cy="0" r="5" fill="#FDA4AF" />
            </g>

            {/* Rose 2 - Left Pink Rose */}
            <g transform="translate(135, 138)">
              <circle cx="0" cy="0" r="12" fill="#F472B6" stroke="#BE185D" strokeWidth="1" />
              <circle cx="0" cy="0" r="7" fill="#FBCFE8" />
              <circle cx="0" cy="0" r="3" fill="#BE185D" />
            </g>

            {/* Rose 3 - Right Velvet Rose */}
            <g transform="translate(205, 135)">
              <circle cx="0" cy="0" r="13" fill="url(#roseRedGrad)" stroke="#881337" strokeWidth="1" />
              <circle cx="0" cy="0" r="6" fill="#FB7185" />
            </g>

            {/* Rose 4 - Top Bud */}
            <g transform="translate(170, 85)">
              <circle cx="0" cy="0" r="10" fill="#FB7185" stroke="#9F1239" strokeWidth="1" />
              <circle cx="0" cy="0" r="5" fill="#FFE4E6" />
            </g>

            {/* Floating flower petals */}
            <text x="110" y="110" className="text-[14px] animate-bounce">🌸</text>
            <text x="220" y="105" className="text-[12px] animate-pulse">🌺</text>
            <text x="175" y="60" className="text-[14px] animate-soft-float">✨</text>
          </g>
        )}

        {/* ============================================================= */}
        {/* STAGE 4: CÂY ĐẠI THỤ HẠNH PHÚC (GRAND TREE OF HAPPINESS)        */}
        {/* ============================================================= */}
        {stage === 4 && (
          <g className="animate-soft-float origin-bottom">
            {/* Trunk */}
            <path
              d="M152 204 C153 175, 150 145, 138 120 C156 128, 168 132, 172 150 C175 132, 186 126, 202 120 C190 145, 186 175, 188 204 Z"
              fill="url(#trunkGrad)"
              stroke="#451A03"
              strokeWidth="1.5"
            />
            {/* Trunk Wood Grain Line */}
            <path d="M165 200 C166 170 162 145 158 135" stroke="#451A03" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            <path d="M175 198 C176 170 178 145 180 135" stroke="#451A03" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

            {/* Heart engraving on trunk */}
            <path
              d="M170 175 C167 171, 163 172, 164 176 C165 180, 170 183, 170 183 C170 183, 175 180, 176 176 C177 172, 173 171, 170 175 Z"
              fill="#F43F5E"
            />

            {/* Tree Canopy - Multi-layered Domes */}
            {/* Layer 1 (Back shadow) */}
            <ellipse
              cx="170"
              cy="115"
              rx={72}
              ry={50}
              fill={
                season === 'spring'
                  ? '#9D174D'
                  : season === 'autumn'
                  ? '#7C2D12'
                  : season === 'winter'
                  ? '#064E3B'
                  : '#14532D'
              }
            />
            
            {/* Layer 2 (Mid Foliage) */}
            <circle cx="125" cy="118" r="36" fill="url(#leafSummer2)" />
            <circle cx="215" cy="118" r="36" fill="url(#leafSummer2)" />
            <circle cx="145" cy="85" r="40" fill="url(#leafSummer1)" />
            <circle cx="195" cy="85" r="40" fill="url(#leafSummer1)" />
            <circle cx="170" cy="70" r="38" fill="url(#leafSummer2)" />
            <ellipse cx="170" cy="100" rx="55" ry="38" fill="url(#leafSummer1)" />

            {/* Apples & Love fruits */}
            <circle cx="132" cy="105" r="7" fill="url(#appleGrad)" />
            <path d="M132 98 Q135 95 137 97" stroke="#15803D" strokeWidth="1.5" />

            <circle cx="208" cy="102" r="7" fill="url(#appleGrad)" />
            <path d="M208 95 Q211 92 213 94" stroke="#15803D" strokeWidth="1.5" />

            <circle cx="170" cy="65" r="8" fill="url(#appleGrad)" />
            <path d="M170 57 Q173 54 175 56" stroke="#15803D" strokeWidth="1.5" />

            {/* Glowing Heart Ribbon */}
            <text x="148" y="102" className="text-[16px] animate-pulse">💖</text>
            <text x="180" y="92" className="text-[12px] animate-bounce">✨</text>
          </g>
        )}



        {/* ============================================================= */}
        {/* ARTISAN CERAMIC POT WITH GOLD RIM & ENGRAVED NAMES            */}
        {/* ============================================================= */}
        <g id="ArtisanPot">
          {/* Soil Base Inside Pot */}
          <ellipse cx="170" cy="204" rx="55" ry="10" fill="url(#soilGrad)" />

          {/* Pot Body */}
          <path
            d="M120 206 C122 228, 134 246, 170 246 C206 246, 218 228, 220 206 Z"
            fill="url(#potGrad)"
            stroke="#78350F"
            strokeWidth="2"
          />

          {/* Pot Rim with Gold Accent */}
          <ellipse cx="170" cy="204" rx="58" ry="8" fill="url(#goldRimGrad)" stroke="#92400E" strokeWidth="1.5" />
          <ellipse cx="170" cy="204" rx="54" ry="6" fill="url(#soilGrad)" />

          {/* Bottom Stand / Saucer */}
          <ellipse cx="170" cy="247" rx="36" ry="5" fill="#78350F" opacity="0.8" />

          {/* Artisan Ceramic Pot with sleek surface - No text */}
        </g>

        {/* Grass Mound & Garden Floor Details */}
        <ellipse cx="170" cy="254" rx="85" ry="7" fill="#14532D" opacity="0.4" filter="url(#softGlow)" />
        <g transform="translate(115, 248)">
          <text x="0" y="0" className="text-[10px]">🌱</text>
          <text x="25" y="2" className="text-[10px]">🌼</text>
          <text x="50" y="-1" className="text-[9px]">🍄</text>
          <text x="75" y="2" className="text-[10px]">🌸</text>
          <text x="100" y="0" className="text-[10px]">🌿</text>
        </g>
      </svg>

    </div>
  );
};
