import './section-intro.scss';

import { ReactNode } from 'react';

export function SectionIntro({ children, steps }: { children: ReactNode; steps?: string[] }) {
  return (
    <div className="section-intro">
      <p className="section-intro__lead">{children}</p>
      {steps && steps.length > 0 && (
        <ul className="section-intro__steps">
          {steps.map(step => (
            <li key={step} className="section-intro__step">
              {step}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
