export const CATEGORY_GROUP = {
  income: {
    id: 'income',
    name: 'Income',
    color: '#10B981',
  },
  housing: {
    id: 'housing',
    name: 'Housing',
    color: '#3B82F6',
  },
  transportation: {
    id: 'transportation',
    name: 'Transportation',
    color: '#F97316',
  },
  foodAndDining: {
    id: 'foodAndDining',
    name: 'Food & Dining',
    color: '#EF4444',
  },
  utilities: {
    id: 'utilities',
    name: 'Utilities',
    color: '#8B5CF6',
  },
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare',
    color: '#EC4899',
  },
  entertainment: {
    id: 'entertainment',
    name: 'Entertainment',
    color: '#F59E0B',
  },
  shopping: {
    id: 'shopping',
    name: 'Shopping',
    color: '#06B6D4',
  },
  personalCare: {
    id: 'personalCare',
    name: 'Personal Care',
    color: '#A855F7',
  },
  education: {
    id: 'education',
    name: 'Education',
    color: '#0EA5E9',
  },
  financialServices: {
    id: 'financialServices',
    name: 'Financial Services',
    color: '#84CC16',
  },
  giftsAndDonations: {
    id: 'giftsAndDonations',
    name: 'Gifts & Donations',
    color: '#F43F5E',
  },
  savingsAndInvestments: {
    id: 'savingsAndInvestments',
    name: 'Savings & Investments',
    color: '#14B8A6',
  },
  pets: {
    id: 'pets',
    name: 'Pets',
    color: '#FB923C',
  },
  miscellaneous: {
    id: 'miscellaneous',
    name: 'Miscellaneous',
    color: '#9CA3AF',
  },
};

export const CATEGORY = {
  // Income
  salary: {
    id: 'salary',
    name: 'Salary',
    groupId: CATEGORY_GROUP.income.id,
    icon: 'Briefcase',
  },
  freelance: {
    id: 'freelance',
    name: 'Freelance',
    groupId: CATEGORY_GROUP.income.id,
    icon: 'Laptop',
  },
  bonuses: {
    id: 'bonuses',
    name: 'Bonuses',
    groupId: CATEGORY_GROUP.income.id,
    icon: 'Gift',
  },
  investments: {
    id: 'investments',
    name: 'Investment Returns',
    groupId: CATEGORY_GROUP.income.id,
    icon: 'TrendingUp',
  },
  otherIncome: {
    id: 'otherIncome',
    name: 'Other Income',
    groupId: CATEGORY_GROUP.income.id,
    icon: 'DollarSign',
  },

  // Housing
  rent: {
    id: 'rent',
    name: 'Rent',
    groupId: CATEGORY_GROUP.housing.id,
    icon: 'Home',
  },
  mortgage: {
    id: 'mortgage',
    name: 'Mortgage',
    groupId: CATEGORY_GROUP.housing.id,
    icon: 'Building2',
  },
  propertyTax: {
    id: 'propertyTax',
    name: 'Property Tax',
    groupId: CATEGORY_GROUP.housing.id,
    icon: 'FileText',
  },
  homeInsurance: {
    id: 'homeInsurance',
    name: 'Home Insurance',
    groupId: CATEGORY_GROUP.housing.id,
    icon: 'Shield',
  },
  homeRepairs: {
    id: 'homeRepairs',
    name: 'Home Repairs',
    groupId: CATEGORY_GROUP.housing.id,
    icon: 'Wrench',
  },
  homeMaintenance: {
    id: 'homeMaintenance',
    name: 'Home Maintenance',
    groupId: CATEGORY_GROUP.housing.id,
    icon: 'Hammer',
  },
  hoa: {
    id: 'hoa',
    name: 'HOA Fees',
    groupId: CATEGORY_GROUP.housing.id,
    icon: 'Users',
  },

  // Transportation
  carPayment: {
    id: 'carPayment',
    name: 'Car Payment',
    groupId: CATEGORY_GROUP.transportation.id,
    icon: 'Car',
  },
  carInsurance: {
    id: 'carInsurance',
    name: 'Car Insurance',
    groupId: CATEGORY_GROUP.transportation.id,
    icon: 'ShieldCheck',
  },
  fuel: {
    id: 'fuel',
    name: 'Fuel',
    groupId: CATEGORY_GROUP.transportation.id,
    icon: 'Fuel',
  },
  carMaintenance: {
    id: 'carMaintenance',
    name: 'Car Maintenance',
    groupId: CATEGORY_GROUP.transportation.id,
    icon: 'Settings',
  },
  parking: {
    id: 'parking',
    name: 'Parking',
    groupId: CATEGORY_GROUP.transportation.id,
    icon: 'ParkingCircle',
  },
  publicTransit: {
    id: 'publicTransit',
    name: 'Public Transit',
    groupId: CATEGORY_GROUP.transportation.id,
    icon: 'Bus',
  },
  rideshare: {
    id: 'rideshare',
    name: 'Rideshare',
    groupId: CATEGORY_GROUP.transportation.id,
    icon: 'CarTaxiFront',
  },

  // Food & Dining
  groceries: {
    id: 'groceries',
    name: 'Groceries',
    groupId: CATEGORY_GROUP.foodAndDining.id,
    icon: 'ShoppingCart',
  },
  restaurants: {
    id: 'restaurants',
    name: 'Restaurants',
    groupId: CATEGORY_GROUP.foodAndDining.id,
    icon: 'UtensilsCrossed',
  },
  fastFood: {
    id: 'fastFood',
    name: 'Fast Food',
    groupId: CATEGORY_GROUP.foodAndDining.id,
    icon: 'Sandwich',
  },
  coffee: {
    id: 'coffee',
    name: 'Coffee Shops',
    groupId: CATEGORY_GROUP.foodAndDining.id,
    icon: 'Coffee',
  },
  barsAndAlcohol: {
    id: 'barsAndAlcohol',
    name: 'Bars & Alcohol',
    groupId: CATEGORY_GROUP.foodAndDining.id,
    icon: 'Wine',
  },
  foodDelivery: {
    id: 'foodDelivery',
    name: 'Food Delivery',
    groupId: CATEGORY_GROUP.foodAndDining.id,
    icon: 'Truck',
  },

  // Utilities
  electricity: {
    id: 'electricity',
    name: 'Electricity',
    groupId: CATEGORY_GROUP.utilities.id,
    icon: 'Zap',
  },
  water: {
    id: 'water',
    name: 'Water',
    groupId: CATEGORY_GROUP.utilities.id,
    icon: 'Droplet',
  },
  gas: {
    id: 'gas',
    name: 'Gas',
    groupId: CATEGORY_GROUP.utilities.id,
    icon: 'Flame',
  },
  internet: {
    id: 'internet',
    name: 'Internet',
    groupId: CATEGORY_GROUP.utilities.id,
    icon: 'Wifi',
  },
  phone: {
    id: 'phone',
    name: 'Phone',
    groupId: CATEGORY_GROUP.utilities.id,
    icon: 'Phone',
  },
  cable: {
    id: 'cable',
    name: 'Cable/TV',
    groupId: CATEGORY_GROUP.utilities.id,
    icon: 'Tv',
  },
  trash: {
    id: 'trash',
    name: 'Trash/Recycling',
    groupId: CATEGORY_GROUP.utilities.id,
    icon: 'Trash2',
  },

  // Healthcare
  healthInsurance: {
    id: 'healthInsurance',
    name: 'Health Insurance',
    groupId: CATEGORY_GROUP.healthcare.id,
    icon: 'ShieldPlus',
  },
  doctor: {
    id: 'doctor',
    name: 'Doctor Visits',
    groupId: CATEGORY_GROUP.healthcare.id,
    icon: 'Stethoscope',
  },
  dentist: {
    id: 'dentist',
    name: 'Dentist',
    groupId: CATEGORY_GROUP.healthcare.id,
    icon: 'Smile',
  },
  pharmacy: {
    id: 'pharmacy',
    name: 'Pharmacy',
    groupId: CATEGORY_GROUP.healthcare.id,
    icon: 'Pill',
  },
  eyecare: {
    id: 'eyecare',
    name: 'Eye Care',
    groupId: CATEGORY_GROUP.healthcare.id,
    icon: 'Glasses',
  },
  therapy: {
    id: 'therapy',
    name: 'Therapy',
    groupId: CATEGORY_GROUP.healthcare.id,
    icon: 'Brain',
  },
  medicalDevices: {
    id: 'medicalDevices',
    name: 'Medical Devices',
    groupId: CATEGORY_GROUP.healthcare.id,
    icon: 'Activity',
  },

  // Entertainment
  streamingServices: {
    id: 'streamingServices',
    name: 'Streaming Services',
    groupId: CATEGORY_GROUP.entertainment.id,
    icon: 'Monitor',
  },
  movies: {
    id: 'movies',
    name: 'Movies',
    groupId: CATEGORY_GROUP.entertainment.id,
    icon: 'Film',
  },
  concerts: {
    id: 'concerts',
    name: 'Concerts',
    groupId: CATEGORY_GROUP.entertainment.id,
    icon: 'Music',
  },
  hobbies: {
    id: 'hobbies',
    name: 'Hobbies',
    groupId: CATEGORY_GROUP.entertainment.id,
    icon: 'Palette',
  },
  sports: {
    id: 'sports',
    name: 'Sports',
    groupId: CATEGORY_GROUP.entertainment.id,
    icon: 'Dumbbell',
  },
  gaming: {
    id: 'gaming',
    name: 'Gaming',
    groupId: CATEGORY_GROUP.entertainment.id,
    icon: 'Gamepad2',
  },
  books: {
    id: 'books',
    name: 'Books',
    groupId: CATEGORY_GROUP.entertainment.id,
    icon: 'Book',
  },
  music: {
    id: 'music',
    name: 'Music',
    groupId: CATEGORY_GROUP.entertainment.id,
    icon: 'Disc3',
  },
  vacation: {
    id: 'vacation',
    name: 'Vacation',
    groupId: CATEGORY_GROUP.entertainment.id,
    icon: 'Palmtree',
  },

  // Shopping
  clothing: {
    id: 'clothing',
    name: 'Clothing',
    groupId: CATEGORY_GROUP.shopping.id,
    icon: 'Shirt',
  },
  shoes: {
    id: 'shoes',
    name: 'Shoes',
    groupId: CATEGORY_GROUP.shopping.id,
    icon: 'Footprints',
  },
  electronics: {
    id: 'electronics',
    name: 'Electronics',
    groupId: CATEGORY_GROUP.shopping.id,
    icon: 'Smartphone',
  },
  homeGoods: {
    id: 'homeGoods',
    name: 'Home Goods',
    groupId: CATEGORY_GROUP.shopping.id,
    icon: 'Lamp',
  },
  furniture: {
    id: 'furniture',
    name: 'Furniture',
    groupId: CATEGORY_GROUP.shopping.id,
    icon: 'Armchair',
  },
  onlineShopping: {
    id: 'onlineShopping',
    name: 'Online Shopping',
    groupId: CATEGORY_GROUP.shopping.id,
    icon: 'ShoppingBag',
  },

  // Personal Care
  haircare: {
    id: 'haircare',
    name: 'Haircare',
    groupId: CATEGORY_GROUP.personalCare.id,
    icon: 'Scissors',
  },
  spa: {
    id: 'spa',
    name: 'Spa & Massage',
    groupId: CATEGORY_GROUP.personalCare.id,
    icon: 'Sparkles',
  },
  gym: {
    id: 'gym',
    name: 'Gym Membership',
    groupId: CATEGORY_GROUP.personalCare.id,
    icon: 'HeartPulse',
  },
  personalCareProducts: {
    id: 'personalCareProducts',
    name: 'Personal Care Products',
    groupId: CATEGORY_GROUP.personalCare.id,
    icon: 'Spray',
  },
  laundry: {
    id: 'laundry',
    name: 'Laundry',
    groupId: CATEGORY_GROUP.personalCare.id,
    icon: 'WashingMachine',
  },

  // Education
  tuition: {
    id: 'tuition',
    name: 'Tuition',
    groupId: CATEGORY_GROUP.education.id,
    icon: 'GraduationCap',
  },
  studentLoans: {
    id: 'studentLoans',
    name: 'Student Loans',
    groupId: CATEGORY_GROUP.education.id,
    icon: 'BookMarked',
  },
  educationalBooks: {
    id: 'educationalBooks',
    name: 'Books & Supplies',
    groupId: CATEGORY_GROUP.education.id,
    icon: 'BookOpen',
  },
  courses: {
    id: 'courses',
    name: 'Courses',
    groupId: CATEGORY_GROUP.education.id,
    icon: 'School',
  },

  // Financial Services
  bankFees: {
    id: 'bankFees',
    name: 'Bank Fees',
    groupId: CATEGORY_GROUP.financialServices.id,
    icon: 'Landmark',
  },
  atmFees: {
    id: 'atmFees',
    name: 'ATM Fees',
    groupId: CATEGORY_GROUP.financialServices.id,
    icon: 'Banknote',
  },
  accountant: {
    id: 'accountant',
    name: 'Accountant',
    groupId: CATEGORY_GROUP.financialServices.id,
    icon: 'Calculator',
  },
  legalFees: {
    id: 'legalFees',
    name: 'Legal Fees',
    groupId: CATEGORY_GROUP.financialServices.id,
    icon: 'Scale',
  },
  lifeInsurance: {
    id: 'lifeInsurance',
    name: 'Life Insurance',
    groupId: CATEGORY_GROUP.financialServices.id,
    icon: 'HeartHandshake',
  },

  // Gifts & Donations
  gifts: {
    id: 'gifts',
    name: 'Gifts',
    groupId: CATEGORY_GROUP.giftsAndDonations.id,
    icon: 'Gift',
  },
  charity: {
    id: 'charity',
    name: 'Charity',
    groupId: CATEGORY_GROUP.giftsAndDonations.id,
    icon: 'Heart',
  },

  // Savings & Investments
  emergencyFund: {
    id: 'emergencyFund',
    name: 'Emergency Fund',
    groupId: CATEGORY_GROUP.savingsAndInvestments.id,
    icon: 'Siren',
  },
  retirement: {
    id: 'retirement',
    name: 'Retirement',
    groupId: CATEGORY_GROUP.savingsAndInvestments.id,
    icon: 'Waves',
  },
  investmentAccounts: {
    id: 'investmentAccounts',
    name: 'Investment Accounts',
    groupId: CATEGORY_GROUP.savingsAndInvestments.id,
    icon: 'PiggyBank',
  },
  savingsGoals: {
    id: 'savingsGoals',
    name: 'Savings Goals',
    groupId: CATEGORY_GROUP.savingsAndInvestments.id,
    icon: 'Target',
  },

  // Pets
  petFood: {
    id: 'petFood',
    name: 'Pet Food',
    groupId: CATEGORY_GROUP.pets.id,
    icon: 'Dog',
  },
  veterinary: {
    id: 'veterinary',
    name: 'Veterinary',
    groupId: CATEGORY_GROUP.pets.id,
    icon: 'Stethoscope',
  },
  petSupplies: {
    id: 'petSupplies',
    name: 'Pet Supplies',
    groupId: CATEGORY_GROUP.pets.id,
    icon: 'PawPrint',
  },
  petGrooming: {
    id: 'petGrooming',
    name: 'Pet Grooming',
    groupId: CATEGORY_GROUP.pets.id,
    icon: 'Sparkle',
  },

  // Miscellaneous
  other: {
    id: 'other',
    name: 'Other',
    groupId: CATEGORY_GROUP.miscellaneous.id,
    icon: 'MoreHorizontal',
  },
  uncategorized: {
    id: 'uncategorized',
    name: 'Uncategorized',
    groupId: CATEGORY_GROUP.miscellaneous.id,
    icon: 'HelpCircle',
  },
};

export const CATEGORIES_BY_GROUP = [
  {
    ...CATEGORY_GROUP.income,
    categories: [
      CATEGORY.salary,
      CATEGORY.freelance,
      CATEGORY.bonuses,
      CATEGORY.investments,
      CATEGORY.otherIncome,
    ],
  },
  {
    ...CATEGORY_GROUP.housing,
    categories: [
      CATEGORY.rent,
      CATEGORY.mortgage,
      CATEGORY.propertyTax,
      CATEGORY.homeInsurance,
      CATEGORY.homeRepairs,
      CATEGORY.homeMaintenance,
      CATEGORY.hoa,
    ],
  },
  {
    ...CATEGORY_GROUP.transportation,
    categories: [
      CATEGORY.carPayment,
      CATEGORY.carInsurance,
      CATEGORY.fuel,
      CATEGORY.carMaintenance,
      CATEGORY.parking,
      CATEGORY.publicTransit,
      CATEGORY.rideshare,
    ],
  },
  {
    ...CATEGORY_GROUP.foodAndDining,
    categories: [
      CATEGORY.groceries,
      CATEGORY.restaurants,
      CATEGORY.fastFood,
      CATEGORY.coffee,
      CATEGORY.barsAndAlcohol,
      CATEGORY.foodDelivery,
    ],
  },
  {
    ...CATEGORY_GROUP.utilities,
    categories: [
      CATEGORY.electricity,
      CATEGORY.water,
      CATEGORY.gas,
      CATEGORY.internet,
      CATEGORY.phone,
      CATEGORY.cable,
      CATEGORY.trash,
    ],
  },
  {
    ...CATEGORY_GROUP.healthcare,
    categories: [
      CATEGORY.healthInsurance,
      CATEGORY.doctor,
      CATEGORY.dentist,
      CATEGORY.pharmacy,
      CATEGORY.eyecare,
      CATEGORY.therapy,
      CATEGORY.medicalDevices,
    ],
  },
  {
    ...CATEGORY_GROUP.entertainment,
    categories: [
      CATEGORY.streamingServices,
      CATEGORY.movies,
      CATEGORY.concerts,
      CATEGORY.hobbies,
      CATEGORY.sports,
      CATEGORY.gaming,
      CATEGORY.books,
      CATEGORY.music,
      CATEGORY.vacation,
    ],
  },
  {
    ...CATEGORY_GROUP.shopping,
    categories: [
      CATEGORY.clothing,
      CATEGORY.shoes,
      CATEGORY.electronics,
      CATEGORY.homeGoods,
      CATEGORY.furniture,
      CATEGORY.onlineShopping,
    ],
  },
  {
    ...CATEGORY_GROUP.personalCare,
    categories: [
      CATEGORY.haircare,
      CATEGORY.spa,
      CATEGORY.gym,
      CATEGORY.personalCareProducts,
      CATEGORY.laundry,
    ],
  },
  {
    ...CATEGORY_GROUP.education,
    categories: [
      CATEGORY.tuition,
      CATEGORY.studentLoans,
      CATEGORY.educationalBooks,
      CATEGORY.courses,
    ],
  },
  {
    ...CATEGORY_GROUP.financialServices,
    categories: [
      CATEGORY.bankFees,
      CATEGORY.atmFees,
      CATEGORY.accountant,
      CATEGORY.legalFees,
      CATEGORY.lifeInsurance,
    ],
  },
  {
    ...CATEGORY_GROUP.giftsAndDonations,
    categories: [CATEGORY.gifts, CATEGORY.charity],
  },
  {
    ...CATEGORY_GROUP.savingsAndInvestments,
    categories: [
      CATEGORY.emergencyFund,
      CATEGORY.retirement,
      CATEGORY.investmentAccounts,
      CATEGORY.savingsGoals,
    ],
  },
  {
    ...CATEGORY_GROUP.pets,
    categories: [CATEGORY.petFood, CATEGORY.veterinary, CATEGORY.petSupplies, CATEGORY.petGrooming],
  },
  {
    ...CATEGORY_GROUP.miscellaneous,
    categories: [CATEGORY.other, CATEGORY.uncategorized],
  },
];
