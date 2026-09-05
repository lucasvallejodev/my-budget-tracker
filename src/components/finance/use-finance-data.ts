'use client';
import { useQuery } from '@tanstack/react-query';
import { Transaction } from '../transaction-table';
import { AccountResponseType } from '@/app/(main)/_types/accounts';
export async function fetchFinance<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Unable to load financial data. Please try again.');
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Unexpected response from the server');
  return data as T;
}
export function useFinanceData() {
  const transactions = useQuery({
    queryKey: ['transactions'],
    queryFn: () => fetchFinance<Transaction[]>('/api/transactions'),
  });
  const accounts = useQuery({
    queryKey: ['accounts'],
    queryFn: () => fetchFinance<AccountResponseType[]>('/api/accounts'),
  });
  return { transactions, accounts };
}
