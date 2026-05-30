import { Recipe, MealPlan, Pantry } from './types';

export const DEFAULT_RECIPES: Recipe[] = [
  {
    id: "1",
    name: "Papaya Breakfast Bowl",
    emoji: "🍳",
    tags: ["#Quick", "#Vegan"],
    time: "15 min",
    isFavorite: false,
    ingredients: ["Papaya: 1 cup", "Yogurt: 100g", "Granola: 2 tbsp"],
    instructions: [
      "Cut the papaya in half and remove seeds.",
      "Scoop yogurt into the papaya hollow.",
      "Top with granola and fresh berries.",
      "Serve and enjoy immediately!"
    ],
    pantryFriendly: true,
    calories: 250
  },
  {
    id: "2",
    name: "Quinoa Salad",
    emoji: "🥗",
    tags: ["#Quick", "#Vegan", "#LowCarb"],
    time: "10 min",
    isFavorite: true,
    ingredients: ["Quinoa: 0.5 cup", "Cucumber: 1", "Lemon: 0.5", "Olive Oil: 1 tbsp"],
    instructions: [
      "Rinse quinoa and cook according to package directions.",
      "Chop the cucumber into small cubes.",
      "Whisk lemon juice and olive oil to make dressing.",
      "Toss quinoa and cucumber with the dressing.",
      "Season with salt and pepper to taste."
    ],
    pantryFriendly: true,
    calories: 320
  },
  {
    id: "3",
    name: "Salmon with Asparagus",
    emoji: "🐟",
    tags: ["#Quick"],
    time: "20 min",
    isFavorite: false,
    ingredients: ["Salmon: 150g", "Asparagus: 100g", "Butter: 10g"],
    pantryFriendly: false,
    calories: 450
  },
  {
    id: "4",
    name: "Spinach Omelette",
    emoji: "🥚",
    tags: ["#Quick"],
    time: "10 min",
    isFavorite: false,
    ingredients: ["Eggs: 2", "Spinach: 50g", "Cheese: 20g"],
    instructions: [
      "Whisk eggs in a small bowl and season with salt.",
      "Heat a non-stick pan and lightly sauté the spinach.",
      "Pour eggs over the spinach and cook until set.",
      "Sprinkle cheese on one half and fold the omelette.",
      "Slide onto a plate and serve warm."
    ],
    pantryFriendly: true,
    calories: 280
  },
  {
    id: "5",
    name: "Overnight Oats",
    emoji: "🥣",
    tags: ["#Quick", "#Vegan"],
    time: "5 min prep",
    isFavorite: false,
    ingredients: ["Oats: 0.5 cup", "Almond Milk: 1 cup", "Chia: 1 tsp"],
    pantryFriendly: true,
    calories: 310
  },
  {
    id: "6",
    name: "Chicken Stir Fry",
    emoji: "🍜",
    tags: ["#Quick"],
    time: "25 min",
    isFavorite: false,
    ingredients: ["Chicken: 100g", "Broccoli: 100g", "Soy Sauce: 1 tbsp"],
    pantryFriendly: false,
    calories: 380
  }
];

export const INITIAL_MEAL_PLAN_DAYS = {
  monday: { breakfast: null, lunch: null, snack: null, dinner: null },
  tuesday: { breakfast: null, lunch: null, snack: null, dinner: null },
  wednesday: { breakfast: null, lunch: null, snack: null, dinner: null },
  thursday: { breakfast: null, lunch: null, snack: null, dinner: null },
  friday: { breakfast: null, lunch: null, snack: null, dinner: null },
  saturday: { breakfast: null, lunch: null, snack: null, dinner: null },
  sunday: { breakfast: null, lunch: null, snack: null, dinner: null },
};

export const DEFAULT_PANTRY: Pantry = {
  items: [
    { id: "p1", name: "Rice", quantity: 500, unit: "g", category: "Pantry", minStock: 0 },
    { id: "p2", name: "Olive Oil", quantity: 1, unit: "L", category: "Pantry", minStock: 0 },
    { id: "p3", name: "Salt", quantity: 200, unit: "g", category: "Pantry", minStock: 0 },
    { id: "p4", name: "Eggs", quantity: 6, unit: "pcs", category: "Proteins", minStock: 0 },
    { id: "p5", name: "Milk", quantity: 1, unit: "L", category: "Dairy", minStock: 0 },
    { id: "p6", name: "Butter", quantity: 250, unit: "g", category: "Dairy", minStock: 0 },
    { id: "p7", name: "Flour", quantity: 1, unit: "kg", category: "Pantry", minStock: 0 },
    { id: "p8", name: "Sugar", quantity: 500, unit: "g", category: "Pantry", minStock: 0 },
    { id: "p9", name: "Yogurt", quantity: 500, unit: "ml", category: "Dairy", minStock: 0 },
    { id: "p10", name: "Granola", quantity: 300, unit: "g", category: "Pantry", minStock: 0 },
    { id: "p11", name: "Oats", quantity: 1, unit: "kg", category: "Pantry", minStock: 0 },
    { id: "p12", name: "Papaya", quantity: 2, unit: "pcs", category: "Produce", minStock: 0 }
  ]
};

export const CATEGORIES = ["Produce", "Proteins", "Pantry", "Dairy", "Other"];
