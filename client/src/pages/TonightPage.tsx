import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { X, ShoppingBasket, Moon, Users, LogIn, Send } from 'lucide-react';
import api from '../lib/api';
import type { Dish, Ingredient, MealPlan } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

async function fetchTonight(): Promise<MealPlan> {
  const res = await api.get('/meal-plan/tonight');
  return res.data;
}

function formatIngredient(ing: Ingredient): string {
  const parts = [ing.quantity, ing.unit].filter(Boolean).join(' ');
  return parts ? `${ing.name} — ${parts}` : ing.name;
}

export default function TonightPage() {
  const { user, household } = useAuth();
  const { T } = useLanguage();
  const qc = useQueryClient();
  const [notifySent, setNotifySent] = useState(false);

  const enabled = !!user && !!household;
  const { data, isLoading } = useQuery({ queryKey: ['tonight-full'], queryFn: fetchTonight, enabled });

  const removeMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/meal-plan/tonight/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tonight-full'] });
      qc.invalidateQueries({ queryKey: ['tonight'] });
      setNotifySent(false);
    },
  });

  const notifyMutation = useMutation({
    mutationFn: () => api.post('/meal-plan/tonight/notify'),
    onSuccess: () => setNotifySent(true),
  });

  if (!user) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-amber-300">
        <Moon size={40} className="mx-auto text-amber-300 mb-3" />
        <p className="text-gray-500 mb-4">{T.signInTonight}</p>
        <div className="flex gap-3 justify-center">
          <Link to="/register" className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors">
            {T.getStarted}
          </Link>
          <Link to="/login" className="flex items-center gap-1.5 px-5 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-xl transition-colors">
            <LogIn size={14} />{T.signIn}
          </Link>
        </div>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-amber-300">
        <p className="text-gray-500 mb-3">{T.noHouseholdTonight}</p>
        <Link to="/household" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
          {T.setupHousehold}
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center text-gray-400 py-20">{T.loading}</div>;
  }

  const dishes: Dish[] = data?.dishes ?? [];
  const totalServings = dishes.reduce((sum, d) => sum + d.servings, 0);
  const allIngredients = dishes.flatMap((d) => d.ingredients);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Moon size={22} className="text-amber-500" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{T.tonightTitle}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data?.date} &middot; {T.dishCount(dishes.length)}
            {totalServings > 0 && ` ${T.totalServings(totalServings)}`}
          </p>
        </div>
        {dishes.length > 0 && (
          <button
            onClick={() => notifyMutation.mutate()}
            disabled={notifyMutation.isPending || notifySent}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              notifySent
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            <Send size={14} />
            {notifySent ? T.notified : notifyMutation.isPending ? T.sending : T.notifyHousehold}
          </button>
        )}
      </div>

      {dishes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-amber-300">
          <Moon size={40} className="mx-auto text-amber-300 mb-3" />
          <p className="text-gray-500 mb-1">{T.nothingPlanned}</p>
          <Link to="/" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
            {T.browseMenu}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {dishes.map((dish) => (
              <div key={dish.id} className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
                {dish.image && (
                  <img src={`/uploads/${dish.image}`} alt={dish.name} className="w-full h-44 object-cover" />
                )}
                <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{dish.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">
                        {T.categories[dish.category] ?? dish.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        {dish.servings} {T.servings}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeMutation.mutate(dish.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1"
                    title={T.removeFromTonight}
                  >
                    <X size={16} />
                  </button>
                </div>
                {dish.description && <p className="text-sm text-gray-500 mb-3">{dish.description}</p>}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {dish.ingredients.map((ing) => (
                    <div key={ing.id} className="text-sm text-gray-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span>{formatIngredient(ing)}</span>
                    </div>
                  ))}
                </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm h-fit">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBasket size={18} className="text-amber-500" />
              <h2 className="font-semibold text-gray-700 text-sm">{T.allIngredients}</h2>
              <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {allIngredients.length}
              </span>
            </div>
            <ul className="space-y-2">
              {allIngredients.map((ing) => (
                <li key={ing.id} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  <span>
                    <span className="font-medium">{ing.name}</span>
                    {(ing.quantity || ing.unit) && (
                      <span className="text-gray-400 ml-1">
                        {[ing.quantity, ing.unit].filter(Boolean).join(' ')}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
