import { Colors } from '@/styles/theme';

/**
 * Default category taxonomy seeded for every new user. Bumping `DEFAULT_TAXONOMY_VERSION`
 * only affects users seeded after the bump; existing users keep their data.
 * Icon names are PascalCase lucide-react exports present in the curated icon registry.
 */
export const DEFAULT_TAXONOMY_VERSION = 1;

export type TaxonomyGroup = {
  name: string;
  kind: 'income' | 'expense';
  color: string;
  isSystem?: boolean;
  categories: { name: string; icon: string }[];
};

export const DefaultTaxonomy: TaxonomyGroup[] = [
  {
    name: 'Income',
    kind: 'income',
    color: Colors.group.green,
    isSystem: true,
    categories: [
      { name: 'Salary', icon: 'Banknote' },
      { name: 'Freelance & side income', icon: 'Briefcase' },
      { name: 'Investment income', icon: 'TrendingUp' },
      { name: 'Refunds & reimbursements', icon: 'Receipt' },
      { name: 'Other income', icon: 'HandCoins' },
    ],
  },
  {
    name: 'Housing',
    kind: 'expense',
    color: Colors.group.violet,
    categories: [
      { name: 'Rent / Mortgage', icon: 'House' },
      { name: 'Home maintenance', icon: 'Hammer' },
      { name: 'Furniture & decor', icon: 'Sofa' },
      { name: 'Home insurance', icon: 'Shield' },
      { name: 'Property tax / HOA', icon: 'Landmark' },
    ],
  },
  {
    name: 'Bills & Utilities',
    kind: 'expense',
    color: Colors.group.cyan,
    categories: [
      { name: 'Electricity & gas', icon: 'Zap' },
      { name: 'Water & waste', icon: 'Droplets' },
      { name: 'Internet & TV', icon: 'Wifi' },
      { name: 'Mobile phone', icon: 'Smartphone' },
      { name: 'Subscriptions', icon: 'Repeat' },
    ],
  },
  {
    name: 'Transportation',
    kind: 'expense',
    color: Colors.group.orange,
    categories: [
      { name: 'Fuel', icon: 'Fuel' },
      { name: 'Public transit', icon: 'BusFront' },
      { name: 'Taxi & rideshare', icon: 'CarFront' },
      { name: 'Parking & tolls', icon: 'TrafficCone' },
      { name: 'Car payment & insurance', icon: 'Car' },
      { name: 'Repairs & maintenance', icon: 'Wrench' },
    ],
  },
  {
    name: 'Food & Dining',
    kind: 'expense',
    color: Colors.group.red,
    categories: [
      { name: 'Groceries', icon: 'ShoppingCart' },
      { name: 'Restaurants & bars', icon: 'Utensils' },
      { name: 'Coffee', icon: 'Coffee' },
      { name: 'Takeout & delivery', icon: 'Pizza' },
    ],
  },
  {
    name: 'Shopping',
    kind: 'expense',
    color: Colors.group.pink,
    categories: [
      { name: 'Clothing', icon: 'Shirt' },
      { name: 'Electronics', icon: 'Laptop' },
      { name: 'Home & garden', icon: 'Sprout' },
      { name: 'General merchandise', icon: 'ShoppingBag' },
      { name: 'Books & hobbies', icon: 'BookOpen' },
    ],
  },
  {
    name: 'Health & Wellness',
    kind: 'expense',
    color: Colors.group.emerald,
    categories: [
      { name: 'Doctor & dental', icon: 'Stethoscope' },
      { name: 'Pharmacy', icon: 'Pill' },
      { name: 'Fitness', icon: 'Dumbbell' },
      { name: 'Health insurance', icon: 'HeartPulse' },
      { name: 'Personal care', icon: 'Scissors' },
    ],
  },
  {
    name: 'Entertainment',
    kind: 'expense',
    color: Colors.group.purple,
    categories: [
      { name: 'Streaming', icon: 'Tv' },
      { name: 'Movies & events', icon: 'Ticket' },
      { name: 'Games', icon: 'Gamepad2' },
      { name: 'Music', icon: 'Music' },
      { name: 'Sports & recreation', icon: 'Trophy' },
    ],
  },
  {
    name: 'Travel',
    kind: 'expense',
    color: Colors.group.blue,
    categories: [
      { name: 'Flights', icon: 'Plane' },
      { name: 'Lodging', icon: 'Hotel' },
      { name: 'Vacation activities', icon: 'TreePalm' },
      { name: 'Travel misc', icon: 'Luggage' },
    ],
  },
  {
    name: 'Personal & Family',
    kind: 'expense',
    color: Colors.group.amber,
    categories: [
      { name: 'Childcare', icon: 'Baby' },
      { name: 'Education', icon: 'GraduationCap' },
      { name: 'Pets', icon: 'PawPrint' },
      { name: 'Family support', icon: 'Users' },
    ],
  },
  {
    name: 'Financial',
    kind: 'expense',
    color: Colors.group.slate,
    categories: [
      { name: 'Bank fees', icon: 'Landmark' },
      { name: 'Interest & charges', icon: 'Percent' },
      { name: 'Taxes', icon: 'Calculator' },
      { name: 'Savings & investments', icon: 'PiggyBank' },
      { name: 'Professional services', icon: 'FileText' },
    ],
  },
  {
    name: 'Gifts & Donations',
    kind: 'expense',
    color: Colors.group.rose,
    categories: [
      { name: 'Gifts', icon: 'Gift' },
      { name: 'Charity', icon: 'HandHeart' },
      { name: 'Celebrations', icon: 'PartyPopper' },
    ],
  },
];
