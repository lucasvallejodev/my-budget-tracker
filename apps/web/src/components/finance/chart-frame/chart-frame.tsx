import './chart-frame.scss';

import { ReactNode } from 'react';

export type ChartTable = {
  columns: string[];
  rows: { label: string; values: string[] }[];
};

function DataTable({ data, label }: { data: ChartTable; label?: string }) {
  const [rowHeader, ...valueHeaders] = data.columns;

  return (
    <table className="chart-frame__data">
      {label && <caption>{label}</caption>}
      <thead>
        <tr>
          <th scope="col">{rowHeader}</th>
          {valueHeaders.map(header => (
            <th key={header} scope="col">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.rows.map(row => (
          <tr key={row.label}>
            <th scope="row">{row.label}</th>
            {row.values.map((value, index) => (
              <td key={valueHeaders[index]}>{value}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ChartFrame({
  children,
  data,
  label,
}: {
  children: ReactNode;
  data?: ChartTable;
  label?: string;
}) {
  if (data) {
    return (
      <figure className="chart-frame">
        <div className="chart-frame__plot" aria-hidden="true">
          {children}
        </div>
        <DataTable data={data} label={label} />
      </figure>
    );
  }

  return (
    <div className="chart-frame" role={label ? 'img' : undefined} aria-label={label}>
      {children}
    </div>
  );
}
