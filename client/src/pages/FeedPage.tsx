import { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Sparkles, UtensilsCrossed, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { uploadsBase } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

interface FeedIngredient {
  name: string;
  quantity: string;
  unit: string;
}

interface FeedDish {
  id: number;
  name: string;
  description: string;
  category: string;
  servings: number;
  image: string | null;
  created_at: string;
  household_name: string;
  ingredients: FeedIngredient[];
}

interface FeedPage {
  dishes: FeedDish[];
  nextCursor: number | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  Starter: 'bg-green-100 text-green-700',
  Main: 'bg-amber-100 text-amber-700',
  Side: 'bg-blue-100 text-blue-700',
  Dessert: 'bg-pink-100 text-pink-700',
  Drink: 'bg-purple-100 text-purple-700',
  Snack: 'bg-orange-100 text-orange-700',
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  Starter: 'from-green-200 to-green-400',
  Main: 'from-amber-200 to-orange-400',
  Side: 'from-blue-200 to-blue-400',
  Dessert: 'from-pink-200 to-rose-400',
  Drink: 'from-purple-200 to-purple-400',
  Snack: 'from-orange-200 to-orange-400',
};

async function fetchFeed({ pageParam }: { pageParam: number | null }): Promise<FeedPage> {
  const params = new URLSearchParams({ limit: '12' });
  if (pageParam) params.set('cursor', String(pageParam));
  const res = await api.get(`/feed?${params}`);
  return res.data;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr + 'Z').getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function DishPost({ dish }: { dish: FeedDish }) {
  const { T } = useLanguage();
  const colorClass = CATEGORY_COLORS[dish.category] ?? 'bg-gray-100 text-gray-700';
  const gradient = CATEGORY_GRADIENTS[dish.category] ?? 'from-gray-200 to-gray-400';

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {dish.image ? (
        <img
          src={`${uploadsBase}/${dish.image}`}
          alt={dish.name}
          className="w-full aspect-[4/3] object-cover"
        />
      ) : (
        <div className={`w-full aspect-[4/3] bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <UtensilsCrossed size={48} className="text-white/60" />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h2 className="font-bold text-gray-900 text-lg leading-tight">{dish.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {T.byLabel} <span className="text-gray-500 font-medium">{dish.household_name}</span>
              {' · '}{timeAgo(dish.created_at)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colorClass}`}>
              {T.categories[dish.category] ?? dish.category}
            </span>
            <span className="text-xs text-gray-400">{dish.servings} {T.servings}</span>
          </div>
        </div>

        {dish.description && (
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">{dish.description}</p>
        )}

        {dish.ingredients.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {T.ingredientsSectionTitle}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {dish.ingredients.map((ing, i) => (
                <span
                  key={i}
                  className="text-xs bg-amber-50 text-amber-800 border border-amber-100 px-2.5 py-1 rounded-full"
                >
                  {ing.name}
                  {(ing.quantity || ing.unit) && (
                    <span className="text-amber-500 ml-1">
                      {[ing.quantity, ing.unit].filter(Boolean).join(' ')}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default function FeedPage() {
  const { T } = useLanguage();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: fetchFeed,
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const dishes = data?.pages.flatMap((p) => p.dishes) ?? [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Sparkles size={22} className="text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{T.communityFeed}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{T.feedSubtitle}</p>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && dishes.length === 0 && (
        <div className="text-center py-24">
          <UtensilsCrossed size={48} className="mx-auto text-amber-200 mb-4" />
          <p className="text-gray-500 font-medium">{T.noDishesYet}</p>
          <p className="text-sm text-gray-400 mt-1">{T.beFirstToAdd}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {dishes.map((dish) => (
          <DishPost key={dish.id} dish={dish} />
        ))}
      </div>

      <Link
        to="/menu"
        className="fixed bottom-6 right-4 z-40 flex items-center justify-center w-12 h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg transition-colors"
        title="My Menu"
      >
        <BookOpen size={20} />
      </Link>

      <div ref={sentinelRef} className="py-6 text-center">
        {isFetchingNextPage && (
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
        {!hasNextPage && dishes.length > 0 && (
          <p className="text-xs text-gray-300">{T.seenAll}</p>
        )}
      </div>
    </div>
  );
}
