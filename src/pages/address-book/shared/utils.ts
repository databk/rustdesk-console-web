/**
 * 将 ARGB 颜色值转换为十六进制颜色字符串
 * @param color ARGB 颜色值（number 类型）
 * @returns 十六进制颜色字符串（如 #FF5733）
 */
export const argbToHex = (color: number | undefined): string => {
  if (!color) return '#1677ff';
  return `#${color.toString(16).padStart(8, '0').slice(-6)}`;
};

/**
 * 将十六进制颜色字符串转换为 ARGB 颜色值
 * @param hex 十六进制颜色字符串（如 #FF5733）
 * @returns ARGB 颜色值（number 类型）
 */
export const hexToArgb = (hex: string): number => {
  const cleanHex = hex.replace('#', '');
  return 0xFF000000 + parseInt(cleanHex, 16);
};