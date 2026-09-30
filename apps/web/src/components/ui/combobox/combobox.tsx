'use client';

import './combobox.scss';

import { Command as CmdkCommand } from 'cmdk';
import { ChevronDown, Search } from 'lucide-react';
import { ComponentProps, ReactNode, useState } from 'react';

import { cn } from '@/lib/styles';

import { Popover, PopoverContent, PopoverTrigger } from '../popover';

export type ComboboxOption = {
  hint?: string;
  id: string;
  keywords?: string[];
  label: string;
  leading?: ReactNode;
};

export type ComboboxSection = {
  heading: string;
  hideWhileSearching?: boolean;
  id: string;
  options: ComboboxOption[];
};

export type ComboboxVariant = 'chip' | 'field';

type ComboboxProps = Omit<ComponentProps<'button'>, 'children' | 'onChange' | 'value'> & {
  clearLabel?: string;
  emptyText?: string;
  footer?: ReactNode;
  invalid?: boolean;
  label: string;
  onChange: (optionId: string | undefined) => void;
  onCloseAutoFocus?: (event: Event) => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  placeholder: string;
  searchPlaceholder?: string;
  sections: ComboboxSection[];
  value?: string;
  variant?: ComboboxVariant;
};

const VariantClassNames: Record<ComboboxVariant, string> = {
  chip: 'combobox--chip',
  field: '',
};

const ClearValue = 'combobox-clear';
const ValueSeparator = '::';
const MatchScore = 1;
const NoMatchScore = 0;

const optionValue = (section: ComboboxSection, option: ComboboxOption) =>
  `${section.id}${ValueSeparator}${option.id}`;

export const matchesSearch = (search: string, keywords: string[] = []): number => {
  const haystack = keywords.join(' ').toLocaleLowerCase();
  const terms = search.toLocaleLowerCase().split(' ').filter(Boolean);

  return terms.every(term => haystack.includes(term)) ? MatchScore : NoMatchScore;
};

const findOption = (sections: ComboboxSection[], value?: string) =>
  value
    ? sections.flatMap(section => section.options).find(option => option.id === value)
    : undefined;

function ComboboxOptions({
  onSelect,
  searching,
  sections,
  value,
}: {
  onSelect: (optionId: string) => void;
  searching: boolean;
  sections: ComboboxSection[];
  value?: string;
}) {
  return sections
    .filter(section => section.options.length && !(searching && section.hideWhileSearching))
    .map(section => (
      <CmdkCommand.Group key={section.id} heading={section.heading} className="combobox__group">
        {section.options.map(option => (
          <CmdkCommand.Item
            key={option.id}
            className="combobox__option"
            value={optionValue(section, option)}
            keywords={[option.label, ...(option.keywords ?? [])]}
            data-checked={option.id === value || undefined}
            onSelect={() => onSelect(option.id)}
          >
            {option.leading}
            <span className="combobox__option-label">{option.label}</span>
            {option.hint && <span className="combobox__option-hint">{option.hint}</span>}
          </CmdkCommand.Item>
        ))}
      </CmdkCommand.Group>
    ));
}

type ComboboxPanelProps = Pick<
  ComboboxProps,
  'clearLabel' | 'emptyText' | 'label' | 'searchPlaceholder' | 'sections' | 'value'
> & {
  onChoose: (optionId: string | undefined) => void;
  onSearch: (search: string) => void;
  search: string;
};

function ComboboxPanel({
  clearLabel,
  emptyText,
  label,
  onChoose,
  onSearch,
  search,
  searchPlaceholder,
  sections,
  value,
}: ComboboxPanelProps) {
  return (
    <CmdkCommand label={label} filter={(_value, term, keywords) => matchesSearch(term, keywords)}>
      <div className="combobox__search">
        <Search className="combobox__search-icon" aria-hidden />
        <CmdkCommand.Input
          className="combobox__input"
          aria-label={`Search ${label.toLocaleLowerCase()}`}
          placeholder={searchPlaceholder}
          value={search}
          onValueChange={onSearch}
          autoFocus
        />
      </div>
      <CmdkCommand.List className="combobox__list">
        <CmdkCommand.Empty className="combobox__empty">{emptyText}</CmdkCommand.Empty>
        <ComboboxOptions
          sections={sections}
          searching={!!search.trim()}
          value={value}
          onSelect={onChoose}
        />
        {clearLabel && (
          <CmdkCommand.Item
            className="combobox__option combobox__option--clear"
            value={ClearValue}
            keywords={[clearLabel]}
            onSelect={() => onChoose(undefined)}
          >
            {clearLabel}
          </CmdkCommand.Item>
        )}
      </CmdkCommand.List>
    </CmdkCommand>
  );
}

function useComboboxOpen(controlledOpen?: boolean, onOpenChange?: (open: boolean) => void) {
  const [localOpen, setLocalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const setOpen = (next: boolean) => {
    setLocalOpen(next);
    if (!next) setSearch('');
    onOpenChange?.(next);
  };

  return {
    open: controlledOpen ?? localOpen,
    search,
    setOpen,
    setSearch,
  };
}

export function Combobox({
  className,
  clearLabel,
  emptyText = 'Nothing matches.',
  footer,
  invalid,
  label,
  onChange,
  onCloseAutoFocus,
  onOpenChange,
  open: controlledOpen,
  placeholder,
  searchPlaceholder = 'Type to search',
  sections,
  value,
  variant = 'field',
  ...buttonProps
}: ComboboxProps) {
  const { open, search, setOpen, setSearch } = useComboboxOpen(controlledOpen, onOpenChange);
  const selected = findOption(sections, value);
  const shown = selected?.label ?? placeholder;

  const choose = (optionId: string | undefined) => {
    onChange(optionId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          {...buttonProps}
          className={cn('combobox', VariantClassNames[variant], className, {
            'combobox--empty': !selected,
            'combobox--invalid': invalid,
          })}
          aria-haspopup="listbox"
          aria-label={`${label}: ${shown}`}
        >
          {selected?.leading}
          <span className="combobox__value">{shown}</span>
          <ChevronDown className="combobox__chevron" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="combobox__panel" onCloseAutoFocus={onCloseAutoFocus}>
        <ComboboxPanel
          clearLabel={clearLabel}
          emptyText={emptyText}
          label={label}
          search={search}
          searchPlaceholder={searchPlaceholder}
          sections={sections}
          value={value}
          onChoose={choose}
          onSearch={setSearch}
        />
        {footer && <div className="combobox__footer">{footer}</div>}
      </PopoverContent>
    </Popover>
  );
}
