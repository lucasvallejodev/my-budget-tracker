import './section-intro.scss';

import { ChevronDown, Info } from 'lucide-react';
import { ReactNode } from 'react';

export function SectionIntro({
  children,
  steps,
  topic,
}: {
  children: ReactNode;
  steps?: string[];
  topic: string;
}) {
  return (
    <details className="section-intro">
      <summary className="section-intro__summary">
        <Info className="section-intro__icon" aria-hidden />
        <span className="section-intro__question">How does this work?</span>
        <span className="section-intro__topic">About {topic}</span>
        <ChevronDown className="section-intro__chevron" aria-hidden />
      </summary>
      <div className="section-intro__body">
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
    </details>
  );
}
