export interface FoodItem {
  name: string;
  cuisine: string;
  dishType: string;
  portionSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  country: string;
}

export const GLOBAL_FOOD_DATABASE: FoodItem[] = [
  // American/General
  { name: 'Grilled Chicken Breast', cuisine: 'American', dishType: 'Protein', portionSize: '150g cooked', calories: 220, protein: 43, carbs: 0, fat: 5, country: 'United States' },
  { name: 'Baked Salmon Fillet', cuisine: 'American', dishType: 'Protein', portionSize: '150g cooked', calories: 290, protein: 34, carbs: 0, fat: 17, country: 'United States' },
  { name: 'Hard Boiled Egg', cuisine: 'Common', dishType: 'Breakfast', portionSize: '1 large (50g)', calories: 78, protein: 6, carbs: 0.6, fat: 5.3, country: 'Global' },
  { name: 'Greek Yogurt (Plain, Low-Fat)', cuisine: 'Mediterranean', dishType: 'Snack', portionSize: '150g cup', calories: 110, protein: 15, carbs: 6, fat: 2.5, country: 'Greece' },
  { name: 'Rolled Oatmeal (Water Cooked)', cuisine: 'Common', dishType: 'Breakfast', portionSize: '1 cup cooked', calories: 154, protein: 6, carbs: 28, fat: 2.5, country: 'Scotland' },
  { name: 'Avocado', cuisine: 'Mexican', dishType: 'Fruit', portionSize: '1 medium (150g)', calories: 240, protein: 3, carbs: 12, fat: 22, country: 'Mexico' },
  { name: 'Sweet Potato (Baked)', cuisine: 'American', dishType: 'Side', portionSize: '1 medium (150g)', calories: 135, protein: 3, carbs: 31, fat: 0.2, country: 'United States' },
  { name: 'Whey Protein Isolate Shake', cuisine: 'Common', dishType: 'Fitness Supplement', portionSize: '1 scoop (30g) in water', calories: 110, protein: 25, carbs: 1.5, fat: 0.5, country: 'Global' },
  { name: 'Peanut Butter', cuisine: 'American', dishType: 'Spread', portionSize: '1 tbsp (16g)', calories: 95, protein: 4, carbs: 3, fat: 8, country: 'United States' },
  
  // Asian
  { name: 'Steamed Jasmine Rice', cuisine: 'Asian', dishType: 'Grain', portionSize: '1 cup (150g cooked)', calories: 205, protein: 4.2, carbs: 45, fat: 0.4, country: 'Thailand' },
  { name: 'Sushi Salmon Nigiri', cuisine: 'Japanese', dishType: 'Main', portionSize: '2 pieces (80g)', calories: 140, protein: 7, carbs: 18, fat: 3, country: 'Japan' },
  { name: 'Miso Soup', cuisine: 'Japanese', dishType: 'Appetizer', portionSize: '1 bowl (240g)', calories: 45, protein: 3, carbs: 5, fat: 1.5, country: 'Japan' },
  { name: 'Chicken Pho Soup', cuisine: 'Vietnamese', dishType: 'Main', portionSize: '1 large bowl (500g)', calories: 420, protein: 28, carbs: 55, fat: 8, country: 'Vietnam' },
  { name: 'Pad Thai Noodles with Shrimp', cuisine: 'Thai', dishType: 'Main', portionSize: '1 plate (350g)', calories: 580, protein: 22, carbs: 85, fat: 18, country: 'Thailand' },
  { name: 'Tofu stir-fry with mixed greens', cuisine: 'Chinese', dishType: 'Main', portionSize: '1 plate (250g)', calories: 210, protein: 12, carbs: 15, fat: 12, country: 'China' },

  // Indian
  { name: 'Chicken Tikka Masala', cuisine: 'Indian', dishType: 'Main', portionSize: '1 bowl (250g)', calories: 380, protein: 26, carbs: 12, fat: 24, country: 'India' },
  { name: 'Dal Tadka (Lentil Curry)', cuisine: 'Indian', dishType: 'Main', portionSize: '1 cup (200g)', calories: 190, protein: 10, carbs: 28, fat: 4.5, country: 'India' },
  { name: 'Whole Wheat Roti / Chapati', cuisine: 'Indian', dishType: 'Bread', portionSize: '1 piece (35g)', calories: 104, protein: 3.5, carbs: 20, fat: 0.8, country: 'India' },
  { name: 'Paneer Butter Masala', cuisine: 'Indian', dishType: 'Main', portionSize: '1 cup (200g)', calories: 310, protein: 12, carbs: 9, fat: 26, country: 'India' },

  // Middle Eastern & Mediterranean
  { name: 'Hummus (Chickpea Puree)', cuisine: 'Middle Eastern', dishType: 'Dip', portionSize: '2 tbsp (30g)', calories: 75, protein: 2.2, carbs: 5, fat: 5.5, country: 'Lebanon' },
  { name: 'Baked Falafel', cuisine: 'Middle Eastern', dishType: 'Appetizer', portionSize: '3 patties (60g)', calories: 160, protein: 6, carbs: 18, fat: 7, country: 'Egypt' },
  { name: 'Mediterranean Tabbouleh', cuisine: 'Mediterranean', dishType: 'Salad', portionSize: '1 cup (150g)', calories: 120, protein: 2.5, carbs: 11, fat: 8, country: 'Syria' },
  { name: 'Greek Salad with Feta', cuisine: 'Mediterranean', dishType: 'Salad', portionSize: '1 plate (250g)', calories: 180, protein: 5, carbs: 9, fat: 14, country: 'Greece' },

  // European & Italian
  { name: 'Margherita Pizza (Thin Crust)', cuisine: 'Italian', dishType: 'Main', portionSize: '1 personal (200g)', calories: 512, protein: 22, carbs: 64, fat: 16, country: 'Italy' },
  { name: 'Pasta Beef Bolognese', cuisine: 'Italian', dishType: 'Main', portionSize: '1 plate (300g)', calories: 480, protein: 24, carbs: 65, fat: 14, country: 'Italy' },
  { name: 'French Croissant', cuisine: 'French', dishType: 'Pastry', portionSize: '1 medium (57g)', calories: 231, protein: 4.7, carbs: 26, fat: 12, country: 'France' },

  // Latin American
  { name: 'Chicken Corn Tacos', cuisine: 'Mexican', dishType: 'Main', portionSize: '2 medium soft tacos (160g)', calories: 280, protein: 18, carbs: 32, fat: 9, country: 'Mexico' },
  { name: 'Beef Empanada (Baked)', cuisine: 'Argentine', dishType: 'Snack', portionSize: '1 piece (85g)', calories: 240, protein: 9, carbs: 24, fat: 11, country: 'Argentina' },
  { name: 'Black Beans & White Rice', cuisine: 'Brazilian', dishType: 'Main', portionSize: '1 plate (280g)', calories: 340, protein: 11, carbs: 62, fat: 4, country: 'Brazil' },

  // Raw Common Foods & Fruits
  { name: 'Fresh Banana', cuisine: 'Common', dishType: 'Fruit', portionSize: '1 medium (120g)', calories: 105, protein: 1.3, carbs: 27, fat: 0.3, country: 'Ecuador' },
  { name: 'Sweet Red Apple', cuisine: 'Common', dishType: 'Fruit', portionSize: '1 medium (182g)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, country: 'China' },
  { name: 'Raw Almonds (Natural)', cuisine: 'Common', dishType: 'Nut', portionSize: '1 oz (28g)', calories: 164, protein: 6, carbs: 6, fat: 14, country: 'Spain' },
  { name: 'Blueberries', cuisine: 'Common', dishType: 'Fruit', portionSize: '1 cup (150g)', calories: 85, protein: 1.1, carbs: 21, fat: 0.5, country: 'Canada' },
  { name: 'Fresh Spinach', cuisine: 'Common', dishType: 'Vegetable', portionSize: '2 cups raw (60g)', calories: 14, protein: 1.7, carbs: 2.2, fat: 0.2, country: 'Persia' }
];

export function searchLocalFood(query: string): FoodItem[] {
  const normQuery = query.toLowerCase().trim();
  if (!normQuery) return [];
  
  return GLOBAL_FOOD_DATABASE.filter(item => 
    item.name.toLowerCase().includes(normQuery) ||
    item.cuisine.toLowerCase().includes(normQuery) ||
    item.dishType.toLowerCase().includes(normQuery)
  );
}
