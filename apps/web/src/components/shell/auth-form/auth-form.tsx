'use client';

import './auth-form.scss';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { signIn, signUp } from '@/api/mutations';
import { Button, Form, FormStack, Notice, Text, TextField } from '@/components/ui';
import {
  signInSchema,
  SignInValues,
  signUpFormSchema,
  SignUpFormValues,
} from '@coinkeeper/shared/schema/auth';

export type AuthMode = 'sign-in' | 'sign-up';

const HomePath = '/';
const PROTOCOL_RELATIVE_PREFIX = '//';

const Copy = {
  'sign-in': {
    alternative: 'No account yet?',
    alternativeLink: 'Create one',
    alternativePath: '/sign-up',
    pending: 'Signing in…',
    submit: 'Sign in',
    title: 'Sign in to CoinKeeper',
  },
  'sign-up': {
    alternative: 'Already have an account?',
    alternativeLink: 'Sign in',
    alternativePath: '/sign-in',
    pending: 'Creating your account…',
    submit: 'Create account',
    title: 'Create your CoinKeeper account',
  },
} as const;

export const safeNextPath = (next: string | undefined): string =>
  next?.startsWith(HomePath) && !next.startsWith(PROTOCOL_RELATIVE_PREFIX) ? next : HomePath;

function useAuthSuccess(next: string | undefined) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return () => {
    queryClient.clear();
    router.replace(safeNextPath(next));
    router.refresh();
  };
}

function SignInFields({ next }: { next?: string }) {
  const onSuccess = useAuthSuccess(next);

  const form = useForm<SignInValues>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(signInSchema),
  });

  const submit = useMutation({ mutationFn: signIn, onSuccess });

  return (
    <Form {...form}>
      <FormStack onSubmit={form.handleSubmit(values => submit.mutate(values))}>
        {submit.error && <Notice role="alert">{submit.error.message}</Notice>}
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          description=""
        />
        <TextField
          control={form.control}
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          description=""
        />
        <Button type="submit" disabled={submit.isPending}>
          {submit.isPending ? Copy['sign-in'].pending : Copy['sign-in'].submit}
        </Button>
      </FormStack>
    </Form>
  );
}

function SignUpFields({ next }: { next?: string }) {
  const onSuccess = useAuthSuccess(next);

  const form = useForm<SignUpFormValues>({
    defaultValues: {
      confirmPassword: '',
      email: '',
      name: '',
      password: '',
    },
    resolver: zodResolver(signUpFormSchema),
  });

  const submit = useMutation({
    mutationFn: ({ confirmPassword, ...values }: SignUpFormValues) => signUp(values),
    onSuccess,
  });

  return (
    <Form {...form}>
      <FormStack onSubmit={form.handleSubmit(values => submit.mutate(values))}>
        {submit.error && <Notice role="alert">{submit.error.message}</Notice>}
        <TextField
          control={form.control}
          name="name"
          label="Name"
          autoComplete="name"
          description="Optional. Shown in the account menu."
        />
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          description="You sign in with it."
        />
        <TextField
          control={form.control}
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          description="At least 12 characters. A short sentence works well."
        />
        <TextField
          control={form.control}
          name="confirmPassword"
          label="Repeat the password"
          type="password"
          autoComplete="new-password"
          description=""
        />
        <Button type="submit" disabled={submit.isPending}>
          {submit.isPending ? Copy['sign-up'].pending : Copy['sign-up'].submit}
        </Button>
      </FormStack>
    </Form>
  );
}

export function AuthForm({ mode, next }: { mode: AuthMode; next?: string }) {
  const copy = Copy[mode];
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : '';

  return (
    <section className="auth-form" aria-labelledby="auth-form-title">
      <h1 className="auth-form__title" id="auth-form-title">
        {copy.title}
      </h1>
      {mode === 'sign-in' ? <SignInFields next={next} /> : <SignUpFields next={next} />}
      <Text tone="muted">
        {copy.alternative}{' '}
        <Link className="auth-form__link" href={`${copy.alternativePath}${nextQuery}`}>
          {copy.alternativeLink}
        </Link>
      </Text>
    </section>
  );
}
