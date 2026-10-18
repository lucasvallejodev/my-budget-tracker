import './chart-legend.scss';

export type LegendItem = {
  color: string;
  label: string;
};

export function ChartLegend({ items }: Readonly<{ items: LegendItem[] }>) {
  return (
    <ul className="chart-legend">
      {items.map(item => (
        <li key={item.label} className="chart-legend__item">
          <span className="chart-legend__dot" style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
