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
    return Number((value / 25.4).toFixed(3)); // Convert mm to inches, with 3 decimal places
  }
  return value;
};