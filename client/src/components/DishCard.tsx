import { Pencil, Trash2, Moon, Check, Users, MapPin } from 'lucide-react';
import type { Dish } from '../lib/types';
import { useLanguage } from '../contexts/LanguageContext';
import { uploadsBase } from '../lib/api';

const CATEGORY_COLORS: Record<string, string> = {
  Starter: 'bg-green-100 text-green-700',
  Main: 'bg-amber-100 text-amber-700',
  Side: 'bg-blue-100 text-blue-700',
  Dessert: 'bg-pink-100 text-pink-700',
  Drink: 'bg-purple-100 text-purple-700',
  Snack: 'bg-orange-100 text-orange-700',
  Takeout: 'bg-red-100 text-red-700',
};

interface Props {
  dish: Dish;
  isTonight: boolean;
  onToggleTonight: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function DishCard({ dish, isTonight, onToggleTonight, onEdit, onDelete }: Props) {
  const { T } = useLanguage();
  const colorClass = CATEGORY_COLORS[dish.category] ?? 'bg-gray-100 text-gray-700';
  const isTakeout = dish.category === 'Takeout';

  return (
    <div className={`bg-white rounded-xl border-2 transition-all shadow-sm hover:shadow-md overflow-hidden ${isTonight ? 'border-amber-400' : 'border-transparent'}`}>
      {dish.image && (
        <img
          src={`${uploadsBase}/${dish.image}`}
          alt={dish.name}
          className="w-full h-40 object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-800 leading-tight">{dish.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${colorClass}`}>
            {T.categories[dish.category] ?? dish.category}
          </span>
        </div>

        {dish.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {isTakeout && <MapPin size={12} className="inline mr-1 -mt-0.5" />}
            {dish.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
          {isTakeout ? (
            <span>{T.menuItemsCount(dish.ingredients.length)}</span>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <Users size={12} />
                {dish.servings} {T.servings}
              </span>
              <span>{T.ingredientsCount(dish.ingredients.length)}</span>
            </>
          )}
        </div>

        {dish.ingredients.length > 0 && (
          <div className="border-t border-gray-100 pt-3 mb-4">
            <ul className="space-y-1">
              {dish.ingredients.slice(0, 4).map((ing) => (
                <li key={ing.id} className="text-xs text-gray-600 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isTakeout ? 'bg-red-400' : 'bg-amber-400'}`} />
                  <span className="font-medium">{ing.name}</span>
                  {(ing.quantity || ing.unit) && (
                    <span className="text-gray-400">
                      — {[ing.quantity, ing.unit].filter(Boolean).join(' ')}
                    </span>
                  )}
                </li>
              ))}
              {dish.ingredients.length > 4 && (
                <li className="text-xs text-gray-400 pl-3">
                  {T.moreItems(dish.ingredients.length - 4)}
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={onToggleTonight}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              isTonight
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            {isTonight ? <Check size={14} /> : <Moon size={14} />}
            {isTonight ? T.onTonightsMenu : T.addToTonight}
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title={T.editDishTooltip}
            >
              <Pencil size={15} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title={T.deleteDishTooltip}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
