# Default categories

> Summary: the groups and categories seeded for every new user, with their colours and icons.

Seeded once per user by `ensureUserBootstrap` from `apps/web/src/server/categories/default-taxonomy.ts` (version 1). Icons are names from the curated registry in `packages/shared/src/constants/icon-names.ts`. Everything below can be renamed, recoloured, reordered, extended or archived by the user; the Income group is the only one that cannot be archived.

| Group | Kind · colour | Categories (icon) |
| --- | --- | --- |
| Income | income · `#16A34A` | Salary (Banknote) · Freelance & side income (Briefcase) · Investment income (TrendingUp) · Refunds & reimbursements (Receipt) · Other income (HandCoins) |
| Housing | expense · `#7C3AED` | Rent / Mortgage (House) · Home maintenance (Hammer) · Furniture & decor (Sofa) · Home insurance (Shield) · Property tax / HOA (Landmark) |
| Bills & Utilities | expense · `#0891B2` | Electricity & gas (Zap) · Water & waste (Droplets) · Internet & TV (Wifi) · Mobile phone (Smartphone) · Subscriptions (Repeat) |
| Transportation | expense · `#EA580C` | Fuel (Fuel) · Public transit (BusFront) · Taxi & rideshare (CarFront) · Parking & tolls (TrafficCone) · Car payment & insurance (Car) · Repairs & maintenance (Wrench) |
| Food & Dining | expense · `#DC2626` | Groceries (ShoppingCart) · Restaurants & bars (Utensils) · Coffee (Coffee) · Takeout & delivery (Pizza) |
| Shopping | expense · `#DB2777` | Clothing (Shirt) · Electronics (Laptop) · Home & garden (Sprout) · General merchandise (ShoppingBag) · Books & hobbies (BookOpen) |
| Health & Wellness | expense · `#059669` | Doctor & dental (Stethoscope) · Pharmacy (Pill) · Fitness (Dumbbell) · Health insurance (HeartPulse) · Personal care (Scissors) |
| Entertainment | expense · `#9333EA` | Streaming (Tv) · Movies & events (Ticket) · Games (Gamepad2) · Music (Music) · Sports & recreation (Trophy) |
| Travel | expense · `#2563EB` | Flights (Plane) · Lodging (Hotel) · Vacation activities (TreePalm) · Travel misc (Luggage) |
| Personal & Family | expense · `#D97706` | Childcare (Baby) · Education (GraduationCap) · Pets (PawPrint) · Family support (Users) |
| Financial | expense · `#475569` | Bank fees (Landmark) · Interest & charges (Percent) · Taxes (Calculator) · Savings & investments (PiggyBank) · Professional services (FileText) |
| Gifts & Donations | expense · `#E11D48` | Gifts (Gift) · Charity (HandHeart) · Celebrations (PartyPopper) |

There is deliberately no "Transfers" group (transfers have their own `kind`) and no "Uncategorized" category (an empty category is a state that the review inbox tracks).

## Changing the defaults

Edit `default-taxonomy.ts` and bump `DEFAULT_TAXONOMY_VERSION`. Only users seeded after the change receive the new list; existing users keep their data. The service test `seeds the default taxonomy once per user with valid icons` checks that every icon name exists in the registry.
