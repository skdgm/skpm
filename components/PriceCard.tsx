
import React from 'react';
import { Phone } from '../types';

interface PriceCardProps {
  phone: Phone;
}

const PriceCard: React.FC<PriceCardProps> = ({ phone }) => {
  const getBrandStyles = (brand: string) => {
    const b = brand.toLowerCase().trim();
    if (b === 'oneplus' || b.includes('one plus')) return 'bg-[#B20D0D] text-white border-[#B20D0D]';
    if (b.includes('apple') || b.includes('google')) return 'bg-black text-white border-black';
    if (b.includes('infinix')) return 'bg-[#CCFF00] text-black border-[#CCFF00] font-black'; // Neon Green
    if (b.includes('samsung')) return 'bg-[#034EA2] text-white border-[#034EA2]';
    if (b.includes('oppo')) return 'bg-[#008A45] text-white border-[#008A45]';
    if (b.includes('vivo')) return 'bg-[#008CFF] text-white border-[#008CFF]';
    if (b.includes('realme')) return 'bg-[#FFC915] text-black border-[#FFC915]';
    if (b.includes('mi') || b.includes('xiaomi')) return 'bg-[#FF6700] text-white border-[#FF6700]';
    if (b.includes('motorola') || b.includes('moto')) return 'bg-[#212121] text-white border-[#212121]';
    if (b.includes('nothing')) return 'bg-white text-black border-black';
    return 'bg-slate-900 text-white border-slate-900';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const displayPercentage = phone.marginPercentage > 1 ? phone.marginPercentage.toFixed(1) : (phone.marginPercentage * 100).toFixed(1);

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 flex flex-col hover:shadow-xl transition-all border-l-4 hover:border-l-[#B20D0D] overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${getBrandStyles(phone.brand)}`}>
                {phone.brand}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border bg-slate-100 text-slate-500 border-slate-200">
                {phone.category}
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 leading-tight tracking-tight">{phone.model}</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-900 rounded-3xl p-4 text-white flex flex-col justify-center">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Selling Rate</span>
            <span className="text-lg font-black">{formatCurrency(phone.sellingPrice)}</span>
          </div>
          <div className="bg-blue-50/50 rounded-3xl p-4 border border-blue-100 flex flex-col justify-center">
            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Net Cost</span>
            <span className="text-lg font-black text-blue-900">{formatCurrency(phone.costPrice)}</span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-[20px] p-4 flex justify-between items-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Margin</span>
          <div className="flex flex-col items-end">
            <span className="text-base font-black text-emerald-600 leading-none">{formatCurrency(phone.margin)}</span>
            <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-md mt-1">{displayPercentage}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceCard;
