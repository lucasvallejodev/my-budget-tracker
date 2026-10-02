export type UpcomingView = 'due' | 'recurring' | 'subscriptions' | 'suggestions';

export type UpcomingSection = {
  intro: string;
  label: string;
  path: string;
  steps: string[];
  view: UpcomingView;
};

// keep order
export const UpcomingSections: UpcomingSection[] = [
  {
    intro:
      'Payments your recurring payments expect, from the last five weeks to the next 30 days. When you record or import a payment with the same payee, a similar amount (within 7.5 %) and a date close to the due date, it is matched and marked paid automatically.',
    label: 'What is due',
    path: '/upcoming',
    steps: [
      'Record: you paid it but have not entered it yet. The transaction form opens filled in.',
      'Link: you already entered it but it was not matched, for example because the amount changed. Pick the transaction from a short list.',
      'Not paid: undo a wrong match. The transaction itself is kept.',
    ],
    view: 'due',
  },
  {
    intro:
      'Everything that repeats: your salary, rent, bills and subscriptions. Each one knows how often it happens, so CoinKeeper can predict the next dates and what is still to pay.',
    label: 'Recurring payments',
    path: '/upcoming/recurring',
    steps: [
      'New recurring payment adds one by hand; the payee and the usual amount are used to match payments.',
      'Edit changes the amount or the dates, or pauses it while you do not pay it.',
      'Turn on "Add it to Review when it is due" to get a pending transaction to confirm on each due date.',
    ],
    view: 'recurring',
  },
  {
    intro:
      'What each recurring charge costs per month and per year, most expensive first. Weekly and yearly charges are converted to a monthly cost so you can compare them, and a badge shows when the latest payment changed price.',
    label: 'Subscription review',
    path: '/upcoming/subscriptions',
    steps: [
      'Pause a charge you no longer use, then cancel it with the provider.',
      'Up or Down shows how much the latest payment changed compared with the one before.',
    ],
    view: 'subscriptions',
  },
  {
    intro:
      'Payments that repeat at a regular rhythm in the last 400 days but are not followed yet. They are found from the payee, the dates and the amounts of your transactions.',
    label: 'Found in your history',
    path: '/upcoming/suggestions',
    steps: [
      'Add starts following it with the values found.',
      'Review opens the form first, so you can change the name, the amount or the dates.',
    ],
    view: 'suggestions',
  },
];
