export const formatReadableNumber = (num: number, fixed = 2): string => {
  if (isNaN(num)) {
    return '0';
  }

  return (+num.toFixed(fixed)).toLocaleString();
};
