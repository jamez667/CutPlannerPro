// Updated unit conversion logic
export const convertToMetric = (value: number, fromUnit: string): number => {
  let result = value;
  if (fromUnit === 'in') {
    result = value * 25.4; // Convert inches to millimeters
  }
  return result;
};

export const convertFromMetric = (value: number, toUnit: string): number => {
  if (toUnit === 'in') {
    // For display values, round to the nearest 1/16th inch
    // This gives us more precision than three decimal places for proper woodworking measurements
    const inchValue = value / 25.4;
    return Math.round(inchValue * 16) / 16; // Round to nearest 1/16th inch
  }
  return value;
};