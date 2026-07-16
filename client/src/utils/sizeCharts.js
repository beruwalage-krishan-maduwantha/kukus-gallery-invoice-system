export const SIZE_CHARTS = {
  women: [
    { key: 'xs', label: 'XS / UK 6' },
    { key: 's', label: 'S / UK 8' },
    { key: 'm', label: 'M / UK 10' },
    { key: 'l', label: 'L / UK 12' },
    { key: 'xl', label: 'XL / UK 14' },
    { key: 'xxl', label: '2XL / UK 16' },
    { key: 'xxxl', label: '3XL' },
    { key: 'xxxxl', label: '4XL' }
  ],
  kids: [
    { key: 'age1_2', label: '1-2Y' },
    { key: 'age2_3', label: '2-3Y' },
    { key: 'age3_4', label: '3-4Y' },
    { key: 'age5_6', label: '5-6Y' },
    { key: 'age7_8', label: '7-8Y' },
    { key: 'age9_10', label: '9-10Y' },
    { key: 'age10_11', label: '10-11Y' },
    { key: 'age12_13', label: '12-13Y' },
    { key: 'age14_15', label: '14-15Y' }
  ]
};

export function emptySizeValues(sizeType) {
  const chart = SIZE_CHARTS[sizeType] || SIZE_CHARTS.women;
  return Object.fromEntries(chart.map(s => [s.key, '']));
}
