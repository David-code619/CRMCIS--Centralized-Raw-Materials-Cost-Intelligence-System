export const exportToCSV = (data, filename, columns) => {
    if (!data || data.length === 0) return;

    const escapeCsvCell = (value) => {
      const stringValue = String(value ?? '');
      return `"${stringValue.replace(/"/g, '""')}"`;
    };
  
    // Create CSV header
    const headers = columns.map(col => escapeCsvCell(col.header)).join(',');
    
    // Create CSV rows
    const rows = data.map(item => {
      return columns.map(col => {
        const value = typeof col.accessor === 'function' 
          ? col.accessor(item) 
          : item[col.accessor];
        
        return escapeCsvCell(value);
      }).join(',');
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