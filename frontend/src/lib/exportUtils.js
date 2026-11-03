/**
 * CSV Export Utility
 * 
 * Safely converts tabular data to CSV and triggers a client-side download.
 * Extracts text cleanly even if column accessors return JSX elements.
 */

export const exportToCSV = (data, filename, columns) => {
  if (!Array.isArray(data) || data.length === 0) return;

  const extractText = (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return String(val);
    }
    // If it's a React element or object with children
    if (typeof val === 'object' && val.props) {
      if (typeof val.props.children === 'string' || typeof val.props.children === 'number') {
        return String(val.props.children);
      }
      if (Array.isArray(val.props.children)) {
        return val.props.children.map(extractText).filter(Boolean).join(' ');
      }
    }
    return '';
  };

  const escapeCsvCell = (value) => {
    const text = extractText(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  // Create CSV header
  const headers = columns.map((col) => escapeCsvCell(col.header)).join(',');

  // Create CSV rows
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        let value;
        if (typeof col.exportValue === 'function') {
          value = col.exportValue(item);
        } else if (typeof col.accessor === 'function') {
          value = col.accessor(item);
        } else if (typeof col.accessor === 'string') {
          value = item[col.accessor];
        }
        return escapeCsvCell(value);
      })
      .join(',');
  });

  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
