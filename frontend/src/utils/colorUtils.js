export const WASTE_TYPE_COLORS = {
  'Hormigón': '#1f77b4',  // Muted Blue
  'Ladrillos': '#ff7f0e', // Safety Orange
  'Tierra': '#2ca02c',    // Cooked Asparagus Green
  'Piedras': '#d62728',   // Brick Red
  'Asfalto': '#9467bd',   // Muted Purple
  'Madera': '#8c564b',    // Chestnut Brown
  'Metales': '#e377c2',   // Raspberry Pink
  'Plásticos': '#7f7f7f', // Middle Gray
  'Papel': '#bcbd22',     // Curry Yellow-Green
  'Cartón': '#17becf'    // Blue-Teal
};

// Default color for any unknown waste type
const DEFAULT_COLOR = '#adb5bd'; // Light Gray

/**
 * Gets an array of colors corresponding to the labels for a chart.
 * @param {string[]} labels - An array of waste type labels.
 * @returns {string[]} An array of hex color codes.
 */
export const getChartColors = (labels) => {
  if (!labels || labels.length === 0) {
    return [DEFAULT_COLOR];
  }
  return labels.map(label => WASTE_TYPE_COLORS[label] || DEFAULT_COLOR);
};
