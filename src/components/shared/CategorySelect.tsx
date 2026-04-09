import { CATEGORIES } from '../../config/categories';

interface CategorySelectProps {
  categoryId: string;
  subcategoryId: string;
  onCategoryChange: (catId: string, subId: string) => void;
}

export default function CategorySelect({
  categoryId,
  subcategoryId,
  onCategoryChange,
}: CategorySelectProps) {
  const selectedCategory = CATEGORIES.find((c) => c.id === categoryId);
  const subcategories = selectedCategory?.subcategories ?? [];

  const handleMainChange = (newCatId: string) => {
    const cat = CATEGORIES.find((c) => c.id === newCatId);
    const firstSub = cat?.subcategories[0]?.id ?? '';
    onCategoryChange(newCatId, firstSub);
  };

  return (
    <div className="flex gap-2">
      <select
        value={categoryId}
        onChange={(e) => handleMainChange(e.target.value)}
        className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-lavender"
      >
        <option value="">-- קטגוריה --</option>
        {CATEGORIES.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.nameHe}
          </option>
        ))}
      </select>

      <select
        value={subcategoryId}
        onChange={(e) => onCategoryChange(categoryId, e.target.value)}
        className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-lavender"
        disabled={!categoryId}
      >
        <option value="">-- תת-קטגוריה --</option>
        {subcategories.map((sub) => (
          <option key={sub.id} value={sub.id}>
            {sub.nameHe}
          </option>
        ))}
      </select>
    </div>
  );
}
