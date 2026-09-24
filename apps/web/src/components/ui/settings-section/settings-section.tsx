import './settings-section.scss';

import { ReactNode } from 'react';

export function SettingsSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="settings-section">
      <div>
        <h3>{title}</h3>
        {description && <p className="settings-section__description">{description}</p>}
      </div>
      <div>{children}</div>
    </section>
  );
}
