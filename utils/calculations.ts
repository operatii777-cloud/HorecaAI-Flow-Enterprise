
import { RecipeItem, Ingredient } from '../types';

export const calculateMacros = (recipe: RecipeItem[], ingredients: Ingredient[]) => {
    let calories = 0, protein = 0, fats = 0, carbs = 0;
    recipe.forEach(r => {
        const ing = ingredients.find(i => i.id === r.ingredientId);
        if(ing) {
            calories += (ing.calories || 0) * r.quantity;
            protein += (ing.protein || 0) * r.quantity;
            fats += (ing.fats || 0) * r.quantity;
            carbs += (ing.carbs || 0) * r.quantity;
        }
    });
    return { 
        calories: Math.round(calories), 
        protein: Math.round(protein), 
        fats: Math.round(fats), 
        carbs: Math.round(carbs) 
    };
};

export const calculateCOGS = (recipe: RecipeItem[], ingredients: Ingredient[]) => {
    return recipe.reduce((total, r) => {
        const ing = ingredients.find(i => i.id === r.ingredientId);
        return total + (ing ? ing.costPerUnit * r.quantity : 0);
    }, 0);
};
