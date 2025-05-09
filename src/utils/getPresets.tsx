export const getPresets = (units: string) => {
  const metricPresets = {
    lengths: [2440, 2800, 3050],
    widths: [1220, 1525, 1830],
    thicknesses: [3, 6, 9, 12, 15, 16, 18, 19, 22, 25, 30, 32, 38]
  };
  const imperialPresets = {
    lengths: [1219.2, 1524, 1828.8, 2438.4, 3048],
    widths: [609.6, 762, 1219.2, 1524],
    thicknesses: [3.175, 6.35, 9.525, 12.7, 15.875, 19.05, 25.4, 31.75, 38.1]
  };
  return units === 'in' ? imperialPresets : metricPresets;
};
