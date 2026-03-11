import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, UtensilsCrossed, LogIn, Moon, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import type { Dish } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import DishCard from '../components/DishCard';
import DishModal from '../components/DishModal';

async function fetchDishes(): Promise<Dish[]> {
  const res = await api.get('/dishes');
  return res.data;
}

async function fetchTonightIds(): Promise<number[]> {
  const res = await api.get('/meal-plan/tonight');
  return (res.data.dishes as Dish[]).map((d) => d.id);
}

function GuestBanner() {
  const { T } = useLanguage();
  return (
    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-amber-300">
      <UtensilsCrossed size={48} className="mx-auto text-amber-300 mb-4" />
      <h2 className="text-xl font-semibold text-gray-700 mb-2">{T.welcomeTitle}</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">{T.welcomeDesc}</p>
      <div className="flex gap-3 justify-center">
        <Link
          to="/register"
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {T.getStarted}
        </Link>
        <Link
          to="/login"
          className="flex items-center gap-1.5 px-5 py-2.5 border border-gray-300 text-gray-600 hover:border-amber-400 text-sm font-medium rounded-xl transition-colors"
        >
          <LogIn size={14} />
          {T.signIn}
        </Link>
      </div>
    </div>
  );
}

function NoHouseholdBanner() {
  const { T } = useLanguage();
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-amber-300">
      <p className="text-gray-500 mb-3">{T.noHouseholdMsg}</p>
      <Link to="/household" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
        {T.setupHousehold}
      </Link>
    </div>
  );
}

export default function MenuPage() {
  const { user, household } = useAuth();
  const { T } = useLanguage();
  const qc = useQueryClient();
  const [modalDish, setModalDish] = useState<Dish | null | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const enabled = !!user && !!household;

  const dishesQuery = useQuery({ queryKey: ['dishes'], queryFn: fetchDishes, enabled });
  const tonightQuery = useQuery({ queryKey: ['tonight'], queryFn: fetchTonightIds, enabled });

  const saveMutation = useMutation({
    mutationFn: async (data: { id?: number; payload: object; imageFile?: File | null }) => {
      let dishId: number;
      if (data.id) {
        await api.put(`/dishes/${data.id}`, data.payload);
        dishId = data.id;
      } else {
        const res = await api.post('/dishes', data.payload);
        dishId = res.data.id;
      }
      if (data.imageFile === null) {
        await api.delete(`/dishes/${dishId}/image`);
      } else if (data.imageFile instanceof File) {
        const form = new FormData();
        form.append('image', data.imageFile);
        await api.post(`/dishes/${dishId}/image`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dishes'] });
      setModalDish(undefined);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/dishes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dishes'] });
      qc.invalidateQueries({ queryKey: ['tonight'] });
    },
  });

  const toggleTonightMutation = useMutation({
    mutationFn: async ({ id, isTonight }: { id: number; isTonight: boolean }) => {
      if (isTonight) await api.delete(`/meal-plan/tonight/${id}`);
      else await api.post(`/meal-plan/tonight/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tonight'] }),
  });

  // Not logged in
  if (!user) return <GuestBanner />;

  // Logged in but no household
  if (!household) return <NoHouseholdBanner />;

  const dishes = dishesQuery.data ?? [];
  const tonightIds = new Set(tonightQuery.data ?? []);
  const tonightDishes = dishes.filter((d) => tonightIds.has(d.id));
  // Category filter keys are always English (from DB); 'All' is our special value
  // Always show these key categories even if no dishes exist yet
  const PINNED_CATEGORIES = ['Main', 'Dessert', 'Dine Out'];
  const dishCategories = Array.from(new Set(dishes.map((d) => d.category)));
  const allCategories = Array.from(new Set([...PINNED_CATEGORIES, ...dishCategories])).sort();
  const categories = ['All', ...allCategories];

  const filtered = dishes.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.ingredients.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = filterCategory === 'All' || d.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (dishesQuery.isLoading) {
    return <div className="text-center text-gray-400 py-20">{T.loadingMenu}</div>;
  }

  return (
    <div className="flex gap-6 items-start">
      {/* Main content */}
      <div className="flex-1 min-w-0 w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{T.menuTitle}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{T.dishesAvailable(dishes.length)}</p>
          </div>
          <button
            onClick={() => setModalDish(null)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} />
            {T.addDish}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative w-full sm:flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={T.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap overflow-x-auto pb-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  filterCategory === cat
                    ? 'bg-amber-500 text-white'
                    : 'bg-white border border-gray-300 text-gray-600 hover:border-amber-400'
                }`}
              >
                {T.categories[cat] ?? cat}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-2">{T.noDishesFound}</p>
            {dishes.length === 0 && (
              <button
                onClick={() => setModalDish(null)}
                className="text-amber-600 hover:text-amber-700 text-sm font-medium"
              >
                {T.addFirstDish}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                isTonight={tonightIds.has(dish.id)}
                onToggleTonight={() =>
                  toggleTonightMutation.mutate({ id: dish.id, isTonight: tonightIds.has(dish.id) })
                }
                onEdit={() => setModalDish(dish)}
                onDelete={() => {
                  if (confirm(T.deleteConfirm(dish.name))) deleteMutation.mutate(dish.id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tonight sidebar — desktop only */}
      <div className="hidden lg:block w-60 shrink-0 sticky top-6">
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Moon size={16} className="text-amber-500" />
            <h2 className="font-semibold text-gray-700 text-sm">{T.tonightSidebar}</h2>
            {tonightDishes.length > 0 && (
              <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {tonightDishes.length}
              </span>
            )}
          </div>

          {tonightDishes.length === 0 ? (
            <p className="text-xs text-gray-400 py-3 text-center">{T.noDishesAdded}</p>
          ) : (
            <ul className="space-y-2 mb-3">
              {tonightDishes.map((dish) => (
                <li key={dish.id} className="flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-sm text-gray-700 flex-1 truncate">{dish.name}</span>
                  <button
                    onClick={() => toggleTonightMutation.mutate({ id: dish.id, isTonight: true })}
                    className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    title={T.removeFromTonight}
                  >
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Link
            to="/tonight"
            className="flex items-center justify-center gap-1.5 w-full mt-2 py-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
          >
            {T.viewTonight} <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Tonight sticky bar — mobile only */}
      {tonightDishes.length > 0 && (
        <Link
          to="/tonight"
          className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-amber-500 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold"
        >
          <Moon size={16} />
          {T.tonightMenuBar}
          <span className="bg-white text-amber-600 text-xs font-bold px-2 py-0.5 rounded-full">
            {tonightDishes.length}
          </span>
          <ArrowRight size={14} />
        </Link>
      )}

      {modalDish !== undefined && (
        <DishModal
          dish={modalDish}
          onClose={() => setModalDish(undefined)}
          onSave={({ imageFile, ...payload }) => saveMutation.mutate({ id: modalDish?.id, payload, imageFile })}
          saving={saveMutation.isPending}
          serverError={saveMutation.error ? (saveMutation.error as Error).message || 'Failed to save dish' : undefined}
        />
      )}
    </div>
  );
}
