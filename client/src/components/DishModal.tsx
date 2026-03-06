import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, ImagePlus, Trash } from 'lucide-react';
import type { Dish, Ingredient } from '../lib/types';

interface IngredientDraft {
  name: string;
  quantity: string;
  unit: string;
}

interface Props {
  dish?: Dish | null;
  onSave: (data: {
    name: string;
    description: string;
    category: string;
    servings: number;
    ingredients: IngredientDraft[];
    imageFile?: File | null;
  }) => void;
  onClose: () => void;
}

const CATEGORIES = ['Starter', 'Main', 'Side', 'Dessert', 'Drink', 'Snack'];
const UNITS = ['', 'g', 'kg', 'oz', 'lbs', 'ml', 'L', 'tsp', 'tbsp', 'cup', 'pieces', 'slices', 'cans', 'bunches', 'cloves'];

function toIngredientDraft(ing: Ingredient): IngredientDraft {
  return { name: ing.name, quantity: ing.quantity, unit: ing.unit };
}

export default function DishModal({ dish, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Main');
  const [servings, setServings] = useState(2);
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([
    { name: '', quantity: '', unit: '' },
  ]);
  const [error, setError] = useState('');
  // imageFile: undefined = no change, File = new upload, null = remove existing
  const [imageFile, setImageFile] = useState<File | null | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dish) {
      setName(dish.name);
      setDescription(dish.description);
      setCategory(dish.category);
      setServings(dish.servings);
      setIngredients(
        dish.ingredients.length > 0
          ? dish.ingredients.map(toIngredientDraft)
          : [{ name: '', quantity: '', unit: '' }]
      );
    }
    setImageFile(undefined);
    setImagePreview(null);
  }, [dish]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    setImageFile(dish?.image ? null : undefined);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { name: '', quantity: '', unit: '' }]);
  }

  function removeIngredient(i: number) {
    setIngredients((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateIngredient(i: number, field: keyof IngredientDraft, value: string) {
    setIngredients((prev) => prev.map((ing, idx) => (idx === i ? { ...ing, [field]: value } : ing)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Dish name is required.');
      return;
    }
    const validIngredients = ingredients.filter((i) => i.name.trim());
    onSave({ name: name.trim(), description, category, servings, ingredients: validIngredients, imageFile });
  }

  // Determine what image to show in the preview area
  const currentImageUrl = dish?.image ? `/uploads/${dish.image}` : null;
  const displayImage = imagePreview ?? (imageFile === null ? null : currentImageUrl);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {dish ? 'Edit Dish' : 'Add New Dish'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            {displayImage ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200">
                <img src={displayImage} alt="Dish preview" className="w-full h-48 object-cover" />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white/90 hover:bg-white text-gray-700 rounded-lg px-2.5 py-1.5 text-xs font-medium flex items-center gap-1 shadow-sm"
                  >
                    <ImagePlus size={12} /> Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="bg-white/90 hover:bg-white text-red-500 rounded-lg p-1.5 shadow-sm"
                    title="Remove photo"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-amber-500 transition-colors"
              >
                <ImagePlus size={24} />
                <span className="text-sm">Click to upload a photo</span>
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dish Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spaghetti Bolognese"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
              <input
                type="number"
                min={1}
                max={20}
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Ingredients <span className="text-gray-400 font-normal">(recommended)</span></label>
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium"
              >
                <Plus size={14} />
                Add ingredient
              </button>
            </div>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                    placeholder="Ingredient"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <input
                    type="text"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
                    placeholder="Qty"
                    className="w-16 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                    className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(i)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
            >
              {dish ? 'Save Changes' : 'Add Dish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
