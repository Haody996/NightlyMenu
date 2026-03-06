export interface Ingredient {
  id: number;
  dish_id: number;
  name: string;
  quantity: string;
  unit: string;
}

export interface Dish {
  id: number;
  name: string;
  description: string;
  category: string;
  servings: number;
  created_at: string;
  image: string | null;
  ingredients: Ingredient[];
}

export interface MealPlan {
  date: string;
  dishes: Dish[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Household {
  id: number;
  name: string;
  invite_code: string;
  created_at: string;
}

export interface HouseholdMember {
  id: number;
  name: string;
  email: string;
  joined_at: string;
}

export interface HouseholdWithMembers extends Household {
  members: HouseholdMember[];
}
