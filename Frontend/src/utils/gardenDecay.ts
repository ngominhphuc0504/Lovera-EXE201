import { GardenEcoMetrics, GardenStage, StageStatus } from '../types';
import { GARDEN_CONFIG } from '../constants/gardenConfig';

/**
 * Tính toán trạng thái các chỉ số sinh thái sau khi áp dụng hao hụt theo thời gian thực (UTC)
 * Không phụ thuộc setInterval, chạy chính xác khi reload, chuyển tab hoặc đăng nhập lại.
 */
export function calculateDecayedMetrics(
  metrics: GardenEcoMetrics,
  now = new Date()
): GardenEcoMetrics {
  const lastTime = new Date(metrics.lastUpdateUtc || now.toISOString()).getTime();
  const nowTime = now.getTime();
  const elapsedMs = Math.max(0, nowTime - lastTime);

  // Số khoảng 5 phút đã trôi qua
  const intervals = Math.floor(elapsedMs / GARDEN_CONFIG.DECAY_INTERVAL_MS);

  if (intervals <= 0) {
    return {
      ...metrics,
      moisture: Math.min(100, Math.max(0, Math.round(metrics.moisture))),
      freshness: Math.min(100, Math.max(0, Math.round(metrics.freshness))),
      sunlight: Math.min(100, Math.max(0, Math.round(metrics.sunlight))),
    };
  }

  const decayedMoisture = Math.max(
    GARDEN_CONFIG.LIMITS.MIN,
    metrics.moisture - intervals * GARDEN_CONFIG.DECAY_RATES.MOISTURE
  );
  const decayedFreshness = Math.max(
    GARDEN_CONFIG.LIMITS.MIN,
    metrics.freshness - intervals * GARDEN_CONFIG.DECAY_RATES.FRESHNESS
  );
  const decayedSunlight = Math.max(
    GARDEN_CONFIG.LIMITS.MIN,
    metrics.sunlight - intervals * GARDEN_CONFIG.DECAY_RATES.SUNLIGHT
  );

  // Cập nhật timestamp bước đã trừ hao hụt
  const nextTimestamp = new Date(
    lastTime + intervals * GARDEN_CONFIG.DECAY_INTERVAL_MS
  ).toISOString();

  return {
    ...metrics,
    moisture: Math.min(100, Math.max(0, Math.round(decayedMoisture))),
    freshness: Math.min(100, Math.max(0, Math.round(decayedFreshness))),
    sunlight: Math.min(100, Math.max(0, Math.round(decayedSunlight))),
    lastUpdateUtc: nextTimestamp,
  };
}

/**
 * Lấy số milliseconds cooldown còn lại cho một hành động
 */
export function getCooldownRemaining(
  lastActionUtc?: string | null,
  cooldownMs = GARDEN_CONFIG.COOLDOWN_MS,
  now = new Date()
): number {
  if (!lastActionUtc) return 0;
  const lastActionTime = new Date(lastActionUtc).getTime();
  const elapsed = now.getTime() - lastActionTime;
  return Math.max(0, cooldownMs - elapsed);
}

/**
 * Định dạng thời gian đếm ngược (mm:ss)
 */
export function formatCooldownTime(remainingMs: number): string {
  if (remainingMs <= 0) return '';
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Xác định trạng thái của từng cấp độ: COMPLETED, CURRENT, hoặc LOCKED
 */
export function getStageStatus(stage: GardenStage, currentStage: GardenStage): StageStatus {
  if (stage < currentStage) return 'COMPLETED';
  if (stage === currentStage) return 'CURRENT';
  return 'LOCKED';
}

/**
 * Kiểm tra xem 3 chỉ số có cùng đạt 100% hay không
 */
export function isTreeReadyToEvolve(metrics: GardenEcoMetrics): boolean {
  return (
    metrics.moisture >= GARDEN_CONFIG.LIMITS.MAX &&
    metrics.freshness >= GARDEN_CONFIG.LIMITS.MAX &&
    metrics.sunlight >= GARDEN_CONFIG.LIMITS.MAX
  );
}
