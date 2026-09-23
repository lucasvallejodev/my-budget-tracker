'use client';

import { Slot } from '@radix-ui/react-slot';
import { ComponentProps, createContext, useContext, useId } from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from 'react-hook-form';

import styles from './controls.module.scss';

const FieldContext = createContext('');
const ItemContext = createContext('');

export const Form = FormProvider;

export function FormField<T extends FieldValues, N extends FieldPath<T>>(
  props: ControllerProps<T, N>
) {
  return (
    <FieldContext.Provider value={props.name}>
      <Controller {...props} />
    </FieldContext.Provider>
  );
}

export function FormItem(props: ComponentProps<'div'>) {
  const id = useId();

  return (
    <ItemContext.Provider value={id}>
      <div className={styles.field} {...props} />
    </ItemContext.Provider>
  );
}

export function FormLabel(props: ComponentProps<'label'>) {
  const id = useContext(ItemContext);

  return <label htmlFor={id} className={styles.label} {...props} />;
}

export function FormControl(props: ComponentProps<typeof Slot>) {
  const id = useContext(ItemContext);
  const name = useContext(FieldContext);
  const { formState, getFieldState } = useFormContext();
  const { error } = getFieldState(name, formState);

  return (
    <>
      <Slot
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-description ${id}-error` : `${id}-description`}
        {...props}
      />
      {error && (
        <span id={`${id}-error`} role="alert" className={styles.error}>
          {error.message}
        </span>
      )}
    </>
  );
}

export function FormDescription(props: ComponentProps<'p'>) {
  const id = useContext(ItemContext);

  return <p id={`${id}-description`} className={styles.description} {...props} />;
}
