import './spinner.scss';

import { Loader2 } from 'lucide-react';

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return <Loader2 className="spinner" aria-label={label} role="img" />;
}
