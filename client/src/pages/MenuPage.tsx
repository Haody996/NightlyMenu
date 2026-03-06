import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, UtensilsCrossed, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import type { Dish } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
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
  return (
    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-amber-300">
      <UtensilsCrossed size={48} className="mx-auto text-amber-300 mb-4" />
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Welcome to Meal Planner</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
        Plan your household meals, manage recipes, and coordinate what's for dinner tonight.
      </p>
      <div className="flex gap-3 justify-center">
        <Link
          to="/register"
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Get started
        </Link>
        <Link
          to="/login"
          className="flex items-center gap-1.5 px-5 py-2.5 border border-gray-300 text-gray-600 hover:border-amber-400 text-sm font-medium rounded-xl transition-colors"
        >
          <LogIn size={14} />
          Sign in
        </Link>
      </div>
    </div>
  );
}

function NoHouseholdBanner() {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-amber-300">
      <p className="text-gray-500 mb-3">You need to join or create a household to see and manage dishes.</p>
      <Link to="/household" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
        Set up your household →
      </Link>
    </div>
  );
}

export default function MenuPage() {
  const { user, household } = useAuth();
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
        await api.post(`/dishes/${dishId}/image`, form);
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
  const categories = ['All', ...Array.from(new Set(dishes.map((d) => d.category))).sort()];

  const filtered = dishes.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.ingredients.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = filterCategory === 'All' || d.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (dishesQuery.isLoading) {
    return <div className="text-center text-gray-400 py-20">Loading menu...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Menu</h1>
          <p className="text-sm text-gray-500 mt-0.5">{dishes.length} dish{dishes.length !== 1 ? 'es' : ''} available</p>
        </div>
        <button
          onClick={() => setModalDish(null)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add Dish
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes or ingredients..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
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
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-2">No dishes found</p>
          {dishes.length === 0 && (
            <button
              onClick={() => setModalDish(null)}
              className="text-amber-600 hover:text-amber-700 text-sm font-medium"
            >
              Add your first dish
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                if (confirm(`Delete "${dish.name}"?`)) deleteMutation.mutate(dish.id);
              }}
            />
          ))}
        </div>
      )}

      {modalDish !== undefined && (
        <DishModal
          dish={modalDish}
          onClose={() => setModalDish(undefined)}
          onSave={({ imageFile, ...payload }) => saveMutation.mutate({ id: modalDish?.id, payload, imageFile })}
        />
      )}
    </div>
  );
}
