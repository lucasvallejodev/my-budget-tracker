import { GroupPalette } from '@coinkeeper/shared/constants/palette';

export const DEFAULT_TAXONOMY_VERSION = 1;

export type TaxonomyGroup = {
  categories: { icon: string; name: string }[];
  color: string;
  isSystem?: boolean;
  kind: 'income' | 'expense';
  name: string;
};

export const DefaultTaxonomy: TaxonomyGroup[] = [
  {
    categories: [
      { icon: 'Banknote', name: 'Salary' },
      { icon: 'Briefcase', name: 'Freelance & side income' },
      { icon: 'TrendingUp', name: 'Investment income' },
      { icon: 'Receipt', name: 'Refunds & reimbursements' },
      { icon: 'HandCoins', name: 'Other income' },
    ],
    color: GroupPalette.green,
    isSystem: true,
    kind: 'income',
    name: 'Income',
  },
  {
    categories: [
      { icon: 'House', name: 'Rent / Mortgage' },
      { icon: 'Hammer', name: 'Home maintenance' },
      { icon: 'Sofa', name: 'Furniture & decor' },
      { icon: 'Shield', name: 'Home insurance' },
      { icon: 'Landmark', name: 'Property tax / HOA' },
    ],
    color: GroupPalette.violet,
    kind: 'expense',
    name: 'Housing',
  },
  {
    categories: [
      { icon: 'Zap', name: 'Electricity & gas' },
      { icon: 'Droplets', name: 'Water & waste' },
      { icon: 'Wifi', name: 'Internet & TV' },
      { icon: 'Smartphone', name: 'Mobile phone' },
      { icon: 'Repeat', name: 'Subscriptions' },
    ],
    color: GroupPalette.cyan,
    kind: 'expense',
    name: 'Bills & Utilities',
  },
  {
    categories: [
      { icon: 'Fuel', name: 'Fuel' },
      { icon: 'BusFront', name: 'Public transit' },
      { icon: 'CarFront', name: 'Taxi & rideshare' },
      { icon: 'TrafficCone', name: 'Parking & tolls' },
      { icon: 'Car', name: 'Car payment & insurance' },
      { icon: 'Wrench', name: 'Repairs & maintenance' },
    ],
    color: GroupPalette.orange,
    kind: 'expense',
    name: 'Transportation',
  },
  {
    categories: [
      { icon: 'ShoppingCart', name: 'Groceries' },
      { icon: 'Utensils', name: 'Restaurants & bars' },
      { icon: 'Coffee', name: 'Coffee' },
      { icon: 'Pizza', name: 'Takeout & delivery' },
    ],
    color: GroupPalette.red,
    kind: 'expense',
    name: 'Food & Dining',
  },
  {
    categories: [
      { icon: 'Shirt', name: 'Clothing' },
      { icon: 'Laptop', name: 'Electronics' },
      { icon: 'Sprout', name: 'Home & garden' },
      { icon: 'ShoppingBag', name: 'General merchandise' },
      { icon: 'BookOpen', name: 'Books & hobbies' },
    ],
    color: GroupPalette.pink,
    kind: 'expense',
    name: 'Shopping',
  },
  {
    categories: [
      { icon: 'Stethoscope', name: 'Doctor & dental' },
      { icon: 'Pill', name: 'Pharmacy' },
      { icon: 'Dumbbell', name: 'Fitness' },
      { icon: 'HeartPulse', name: 'Health insurance' },
      { icon: 'Scissors', name: 'Personal care' },
    ],
    color: GroupPalette.emerald,
    kind: 'expense',
    name: 'Health & Wellness',
  },
  {
    categories: [
      { icon: 'Tv', name: 'Streaming' },
      { icon: 'Ticket', name: 'Movies & events' },
      { icon: 'Gamepad2', name: 'Games' },
      { icon: 'Music', name: 'Music' },
      { icon: 'Trophy', name: 'Sports & recreation' },
    ],
    color: GroupPalette.purple,
    kind: 'expense',
    name: 'Entertainment',
  },
  {
    categories: [
      { icon: 'Plane', name: 'Flights' },
      { icon: 'Hotel', name: 'Lodging' },
      { icon: 'TreePalm', name: 'Vacation activities' },
      { icon: 'Luggage', name: 'Travel misc' },
    ],
    color: GroupPalette.blue,
    kind: 'expense',
    name: 'Travel',
  },
  {
    categories: [
      { icon: 'Baby', name: 'Childcare' },
      { icon: 'GraduationCap', name: 'Education' },
      { icon: 'PawPrint', name: 'Pets' },
      { icon: 'Users', name: 'Family support' },
    ],
    color: GroupPalette.amber,
    kind: 'expense',
    name: 'Personal & Family',
  },
  {
    categories: [
      { icon: 'Landmark', name: 'Bank fees' },
      { icon: 'Percent', name: 'Interest & charges' },
      { icon: 'Calculator', name: 'Taxes' },
      { icon: 'PiggyBank', name: 'Savings & investments' },
      { icon: 'FileText', name: 'Professional services' },
    ],
    color: GroupPalette.slate,
    kind: 'expense',
    name: 'Financial',
  },
  {
    categories: [
      { icon: 'Gift', name: 'Gifts' },
      { icon: 'HandHeart', name: 'Charity' },
      { icon: 'PartyPopper', name: 'Celebrations' },
    ],
    color: GroupPalette.rose,
    kind: 'expense',
    name: 'Gifts & Donations',
  },
];
