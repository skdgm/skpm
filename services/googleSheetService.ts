
import { Phone } from '../types';

const BRAND_DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYmplgfNf6rZ9PvQ_Sp19QlJU_4c0bAIUVxTz9ekW8fqQE04_U3knNK6C1SeEw-yAM-woc9_dJaiQv/pub?gid=774188901&single=true&output=csv';

export const fetchPhoneData = async (): Promise<Phone[]> => {
  try {
    const url = `${BRAND_DATA_URL}&t=${Date.now()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Pricing fetch failed: ${response.status}`);
    
    const csvText = await response.text();
    return parseCsv(csvText);
  } catch (error) {
    console.error("Pricing Load Error:", error);
    throw error;
  }
};

const parseCsv = (csvText: string): Phone[] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i+1];
    if (char === '"' && inQuotes && nextChar === '"') { currentField += '"'; i++; }
    else if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { currentRow.push(currentField.trim()); currentField = ''; }
    else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      }
      if (char === '\r' && nextChar === '\n') i++;
    } else { currentField += char; }
  }
  if (currentField || currentRow.length > 0) { currentRow.push(currentField.trim()); rows.push(currentRow); }

  return rows.slice(1).filter(r => r.length >= 10).map((values, index) => {
    const cleanNum = (str: string) => {
      if (!str) return 0;
      const num = parseFloat(str.replace(/[^\d.-]/g, ''));
      return isNaN(num) ? 0 : num;
    };

    return {
      id: `item-${index}`,
      category: values[0] || 'General',
      brand: values[1] || 'Unknown',
      model: values[2] || 'Unknown',
      variant: '', 
      costPrice: cleanNum(values[14]),   
      sellingPrice: cleanNum(values[15]),
      mrp: cleanNum(values[7]) || 0,
      margin: cleanNum(values[17]) || 0,
      marginPercentage: cleanNum(values[18]) || 0,
      currentOffer: '-', 
      stockStatus: (values[9] as any) || 'In Stock',
      lastUpdated: values[10] || new Date().toLocaleDateString()
    };
  });
};
