export const formatImperialMeasurement = (inches: number | null | undefined): string => {
  if (inches == null || isNaN(inches)) return '';
  const value = Number(inches);
  if (isNaN(value)) return '';
  if (value < 12) return `${value}"`;
  const feet = Math.floor(value / 12);
  const remainingInches = value % 12;
  return `${value}" (${feet}'${remainingInches > 0 ? remainingInches + '"' : '0"'})`;
};

export const formatImperialFraction = (decimal: number | null | undefined, short: boolean = false): string => {
  if (decimal == null || isNaN(decimal)) return '';
  const value = Number(decimal);
  if (isNaN(value)) return '';
  
  // Handle zero separately
  if (Math.abs(value) < 0.001) return '0"';
  
  // Extract whole number part
  const wholeNumber = Math.floor(value);
  // Extract decimal part
  const decimalPart = value - wholeNumber;
  
  // Common fractions used in imperial measurements (in 1/16 increments)
  const fractionMap = [
    { decimal: 0, fraction: '' },
    { decimal: 1/16, fraction: '1/16' },
    { decimal: 1/8, fraction: '1/8' },
    { decimal: 3/16, fraction: '3/16' },
    { decimal: 1/4, fraction: '1/4' },
    { decimal: 5/16, fraction: '5/16' },
    { decimal: 3/8, fraction: '3/8' },
    { decimal: 7/16, fraction: '7/16' },
    { decimal: 1/2, fraction: '1/2' },
    { decimal: 9/16, fraction: '9/16' },
    { decimal: 5/8, fraction: '5/8' },
    { decimal: 11/16, fraction: '11/16' },
    { decimal: 3/4, fraction: '3/4' },
    { decimal: 13/16, fraction: '13/16' },
    { decimal: 7/8, fraction: '7/8' },
    { decimal: 15/16, fraction: '15/16' }
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
  if (minDifference > 0.02) {
    return `${value.toFixed(2)}"`;
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
  if (value >= 12 && !short) {
    const feet = Math.floor(value / 12);
    const remainingInches = value % 12;
    
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
  
  return result;
};

export const formatDimensionValue = (
  value: number | null | undefined, 
  dimension: 'length' | 'width' | 'thickness',
  units: string,
  short: boolean = false
): string => {
  if (value === null || value === undefined || isNaN(value)) return '';
  
  // Ensure value is a number
  const numValue = Number(value);
  if (isNaN(numValue)) return '';
  
  // Convert from mm (stored value) to display units
  let displayValue = units === 'in' ? numValue / 25.4 : numValue;
  
  if (units === 'in') {
    if (dimension === 'thickness') {
      return `${Intl.NumberFormat('en', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(displayValue)}" (${formatImperialFraction(displayValue, short)})`;
    }
    return formatImperialFraction(displayValue, short);
  } else {
    return `${Intl.NumberFormat('en', {minimumFractionDigits: 1, maximumFractionDigits: 1}).format(displayValue)} mm`;
  }
};