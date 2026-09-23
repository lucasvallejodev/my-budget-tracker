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

export const isDigitsOnly = (text: string): boolean => Patterns.digitsOnly.test(text);

export const isIsoDate = (text: string): boolean => Patterns.isoDate.test(text);

export const isIsoMonth = (text: string): boolean => Patterns.isoMonth.test(text);

export const isHexColor = (text: string): boolean => Patterns.hexColor.test(text);
