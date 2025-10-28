'use client';

import { useState } from 'react';

interface TooltipProps {
  content: string;
  position: { x: number; y: number };
}

interface Position {
  x: number;
  y: number;
}

interface TooltipState {
  content: string;
  position: Position;
}

interface Category {
  id: string;
  label: string;
  value: number;
  height: number;
  color: string;
}

interface MonthData {
  month: number;
  categories: Category[];
}

const Tooltip: React.FC<TooltipProps> = ({ content, position }) => {
  if (!content) return null;

  return (
    <div 
      className="absolute px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 40}px`,
        transform: 'translateX(-50%)'
      }}
    >
      {content}
      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
    </div>
  );
};

const ExpenseChart: React.FC = () => {
  const [tooltip, setTooltip] = useState<TooltipState>({ 
    content: '', 
    position: { x: 0, y: 0 } 
  });

  const expenseData: MonthData[] = [
    {
      month: 1,
      categories: [
        { id: 'transport', label: 'Transportation', value: 320, height: 17, color: 'bg-violet-500' },
        { id: 'food', label: 'Food', value: 450, height: 22, color: 'bg-amber-500' },
        { id: 'housing', label: 'Housing', value: 780, height: 38, color: 'bg-emerald-500' }
      ]
    },
    {
      month: 2,
      categories: [
        { id: 'transport', label: 'Transportation', value: 580, height: 30, color: 'bg-violet-500' },
        { id: 'food', label: 'Food', value: 540, height: 28, color: 'bg-amber-500' },
        { id: 'housing', label: 'Housing', value: 350, height: 18, color: 'bg-emerald-500' }
      ]
    }
  ];

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    label: string,
    value: number
  ): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      content: `${label}: $${value.toFixed(2)}`,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top,
      },
    });
  };

  const handleMouseLeave = (): void => {
    setTooltip({ content: '', position: { x: 0, y: 0 } });
  };

  return (
    <>
      <div className="flex flex-col p-3.5 px-5 pb-5 gap-4 rounded-[18px] border border-neutral-400 bg-white relative max-w-[600px]">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-sm text-neutral-800 leading-5">Expenses per month</span>
          </div>
        </div>
        <div className="flex gap-4 h-[300px]">
          {expenseData.map((monthData, idx) => (
            <div key={idx} className="w-[20px] h-full bg-neutral-200 rounded-md relative overflow-hidden">
              {monthData.categories.map((category, catIdx) => {
                const bottomPosition = monthData.categories
                  .slice(0, catIdx)
                  .reduce((sum, cat) => sum + cat.height, 0);
                const isFirst = catIdx === 0;
                const isLast = catIdx === monthData.categories.length - 1;
                return (
                  <div
                    key={category.id}
                    className={`absolute w-full ${category.color} cursor-pointer transition-opacity hover:opacity-80 ${
                      isFirst ? 'rounded-b-md' : ''
                    } ${isLast ? 'rounded-t-md' : ''}`}
                    style={{
                      bottom: `${bottomPosition}%`,
                      height: `${category.height}%`
                    }}
                    onMouseEnter={(e) => handleMouseEnter(e, category.label, category.value)}
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <Tooltip content={tooltip.content} position={tooltip.position} />
    </>
  );
};

export default ExpenseChart;
