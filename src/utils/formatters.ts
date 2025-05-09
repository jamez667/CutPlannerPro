import { Dimension } from "../enums/Dimension";

/**
 * Constants for unit conversion
 */
export const MM_TO_INCHES = 25.4;

/**
 * Formats a measurement in inches to display feet and inches
 * @param inches - The measurement in inches
 * @returns Formatted string with feet and inches notation
 */
export const formatImperialMeasurement = (inches: number | null | undefined): string => {
  if (inches == null || typeof inches !== 'number' || isNaN(inches)) return '';
  
  // Use toFixed for consistent decimal display
  if (inches < 12) return `${inches.toFixed(2)}"`;
  
  const feet = Math.floor(inches / 12);
  const remainingInches = +(inches % 12).toFixed(2); // Convert to number after fixing decimals
  
  // Only show decimals in the full inch value, not in the feet'inches' notation
  return `${inches.toFixed(2)}" (${feet}'${Math.round(remainingInches)}")`;
};

/**
 * Formats a decimal inch value to a fractional representation
 * @param decimal - The decimal value in inches
 * @param short - Whether to use short format without foot notation
 * @returns Formatted string with fractional inches
 */
export const formatImperialFraction = (decimal: number | null | undefined, short: boolean = false): string => {
  // Better null/undefined and NaN handling
  if (decimal == null || typeof decimal !== 'number' || isNaN(decimal)) return '';
  
  // Handle zero and negative values more robustly
  const absValue = Math.abs(decimal);
  const sign = decimal < 0 ? '-' : '';
  
  if (absValue < 0.001) return '0"';
  
  // Extract whole number part
  const wholeNumber = Math.floor(absValue);
  // Extract decimal part with higher precision
  const decimalPart = +(absValue - wholeNumber).toFixed(6);
  
  // Common fractions used in imperial measurements (in 1/32 increments)
  // Use a more explicit definition to avoid floating-point precision issues
  const fractionMap = [
    { decimal: 0.0313, fraction: '1/32' },
    { decimal: 0.0625, fraction: '1/16' },
    { decimal: 0.0938, fraction: '3/32' },
    { decimal: 0.1250, fraction: '1/8' },
    { decimal: 0.1563, fraction: '5/32' },
    { decimal: 0.1875, fraction: '3/16' },
    { decimal: 0.2188, fraction: '7/32' },
    { decimal: 0.2500, fraction: '1/4' },
    { decimal: 0.2813, fraction: '9/32' },
    { decimal: 0.3125, fraction: '5/16' },
    { decimal: 0.3438, fraction: '11/32' },
    { decimal: 0.3750, fraction: '3/8' },
    { decimal: 0.4063, fraction: '13/32' },
    { decimal: 0.4375, fraction: '7/16' },
    { decimal: 0.4688, fraction: '15/32' },
    { decimal: 0.5000, fraction: '1/2' },
    { decimal: 0.5313, fraction: '17/32' },
    { decimal: 0.5625, fraction: '9/16' },
    { decimal: 0.5938, fraction: '19/32' },
    { decimal: 0.6250, fraction: '5/8' },
    { decimal: 0.6563, fraction: '21/32' },
    { decimal: 0.6875, fraction: '11/16' },
    { decimal: 0.7188, fraction: '23/32' },
    { decimal: 0.7500, fraction: '3/4' },
    { decimal: 0.7813, fraction: '25/32' },
    { decimal: 0.8125, fraction: '13/16' },
    { decimal: 0.8438, fraction: '27/32' },
    { decimal: 0.8750, fraction: '7/8' },
    { decimal: 0.9063, fraction: '29/32' },
    { decimal: 0.9375, fraction: '15/16' },
    { decimal: 0.9688, fraction: '31/32' }
  ];
  
  // Find the closest fraction
  let closestFraction = '';
  let minDifference = Number.MAX_VALUE;
  
  for (const entry of fractionMap) {
    const difference = Math.abs(decimalPart - entry.decimal);
    if (difference < minDifference) {
      minDifference = difference;
      closestFraction = entry.fraction;
    }
  }
  
  // If the difference is too large, just return the decimal value with 2 places
  if (minDifference > 0.03) {
    return `${decimal.toFixed(2)}"`;
  }
  
  // Format the result based on whole and fractional parts
  let result = '';
  if (wholeNumber === 0) {
    // Just the fraction if less than 1
    result = closestFraction === '' ? '0"' : `${closestFraction}"`;
  } else if (closestFraction === '') {
    // Just the whole number if no significant fraction
    result = `${wholeNumber}"`;
  } else {
    // Combine whole number with fraction
    result = `${wholeNumber}-${closestFraction}"`;
  }
  
  // Add foot measurement in brackets if the value is 12 inches or more
  if (absValue >= 12 && !short) {
    const feet = Math.floor(absValue / 12);
    const remainingInches = absValue % 12;
    
    // Format the remaining inches with fraction if needed
    let remainingStr = '';
    if (Math.abs(remainingInches) > 0.001) {
      // Format the remaining inches with fraction 
      // Important: Don't add quotes here since the recursive call already adds them
      const remainingFormatted = formatImperialFraction(remainingInches);
      // Remove the trailing quote that was added by the recursive call
      const cleanRemaining = remainingFormatted.endsWith('"') 
        ? remainingFormatted.slice(0, -1) 
        : remainingFormatted;
        
      remainingStr = `-${cleanRemaining}`;
    }
    
    result = `${result} (${feet}'${remainingStr})`;
  }
  
  return sign + result;
};

/**
 * Formats a dimension value according to the specified unit system
 * @param value - The numeric value to format
 * @param dimension - The type of dimension (length, width, thickness)
 * @param units - The unit system to use ('in' for imperial, 'mm' for metric)
 * @param short - Whether to use short format 
 * @returns Formatted string representation
 */
export const formatDimensionValue = (
  value: number | null | undefined, 
  dimension: Dimension,
  units: string,
  short: boolean = false
): string => {
  if (value === null || value === undefined || isNaN(value)) return '';
  
  // Ensure value is a number
  const numValue = Number(value);
  if (isNaN(numValue)) return '';
  
  // Convert from mm (stored value) to display units
  let displayValue = units === 'in' ? numValue / MM_TO_INCHES : numValue;
  
  if (units === 'in') {
    if (dimension === Dimension.THICKNESS) {
      return `${Intl.NumberFormat('en', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(displayValue)}" (${formatImperialFraction(displayValue, short)})`;
    }
    return formatImperialFraction(displayValue, short);
  } else {
    return `${Intl.NumberFormat('en', {minimumFractionDigits: 1, maximumFractionDigits: 1}).format(displayValue)} mm`;
  }
};