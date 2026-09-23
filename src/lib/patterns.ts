/**
 * Every regular expression in the application, named after what it matches.
 *
 * @remarks
 * ESLint rejects regex literals and `new RegExp` anywhere else. Patterns with the `g` flag
 * (`amountSignWrapper`, `reactIdColon`, `thousandsSeparator`, `whitespace`) keep state between
 * `test` calls; use them only with `replace` or `split`.
 */
export const Patterns = {
  amountSignWrapper: /^[-+(]|\)$/g,
  byteOrderMark: /^﻿/,
  csvFormulaPrefix: /^[=+@\-\t\r]/,
  dateDayFirst: /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/,
  dateYearFirst: /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/,
  digitsOnly: /^\d*$/,
  hexColor: /^#[0-9a-fA-F]{6}$/,
  isoDate: /^\d{4}-\d{2}-\d{2}$/,
  isoMonth: /^\d{4}-\d{2}$/,
  lineBreak: /\r?\n/,
  reactIdColon: /:/g,
  thousandsSeparator: /[.,]/g,
  uniqueViolationMessage: /unique|duplicate/i,
  whitespace: /\s/g,
} as const;

/**
 * Checks that a string contains only ASCII digits.
 *
 * @param text - The string to check.
 * @returns `true` for digits only, including the empty string.
 */
export const isDigitsOnly = (text: string): boolean => Patterns.digitsOnly.test(text);

/**
 * Checks that a string has the `YYYY-MM-DD` shape.
 *
 * @remarks
 * Only the shape is checked; `'2026-02-31'` passes.
 *
 * @param text - The string to check.
 * @returns `true` when the text looks like an ISO 8601 date.
 */
export const isIsoDate = (text: string): boolean => Patterns.isoDate.test(text);

/**
 * Checks that a string has the `YYYY-MM` shape used for budget and report months.
 *
 * @remarks
 * Only the shape is checked; `'2026-13'` passes.
 *
 * @param text - The string to check.
 * @returns `true` when the text looks like an ISO 8601 month.
 */
export const isIsoMonth = (text: string): boolean => Patterns.isoMonth.test(text);

/**
 * Checks that a string is a six-digit hex colour such as `'#1f7a5c'`.
 *
 * @param text - The string to check.
 * @returns `true` for `#` followed by exactly six hex digits (no shorthand, no alpha).
 */
export const isHexColor = (text: string): boolean => Patterns.hexColor.test(text);
