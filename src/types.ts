export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  tags: string[];
  time: string;
  isFavorite: boolean;
  ingredients: string[];
  instructions?: string[];
  pantryFriendly: boolean;
  calories?: number;
}

export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface DayPlan {
  breakfast: string | null; // recipeId
  lunch: string | null;
  snack: string | null;
  dinner: string | null;
}

export interface MealPlan {
  weekStart: string; // ISO date string (typically Monday)
  days: {
    monday: DayPlan;
    tuesday: DayPlan;
    wednesday: DayPlan;
    thursday: DayPlan;
    friday: DayPlan;
    saturday: DayPlan;
    sunday: DayPlan;
  };
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
  price?: number;
  storeName?: string;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  minStock: number;
  expiryDate?: string; // ISO string
  price?: number;
  isNeededForPlan?: boolean;
}

export interface Pantry {
  items: PantryItem[];
}

export interface UserProfile {
  name: string;
  email: string;
  photoURL: string;
}
