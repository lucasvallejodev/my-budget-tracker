'use client';

import './file-drop.scss';

import { FileUp } from 'lucide-react';
import { DragEvent, useState } from 'react';

import { cn } from '@/lib/styles';

export function FileDrop({
  accept,
  fileName,
  hint,
  label,
  onFile,
}: {
  accept: string;
  fileName?: string;
  hint: string;
  label: string;
  onFile: (file: File | undefined) => void;
}) {
  const [dragging, setDragging] = useState(false);

  const onDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(true);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    onFile(event.dataTransfer.files[0]);
  };

  return (
    <label
      className={cn('file-drop', { 'file-drop--dragging': dragging })}
      onDragOver={onDragOver}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input
        className="file-drop__input"
        type="file"
        accept={accept}
        aria-label={label}
        onChange={event => onFile(event.target.files?.[0])}
      />
      <span className="file-drop__icon" aria-hidden>
        <FileUp />
      </span>
      <span className="file-drop__title">{fileName ?? 'Drop a file here or choose one'}</span>
      <span className="file-drop__hint">
        {fileName ? 'Choose another file to replace it' : hint}
      </span>
    </label>
  );
}
