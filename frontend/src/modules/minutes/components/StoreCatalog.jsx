import { useEffect, useState, useContext } from "react";
import { fetchStoreProducts, fetchStoreCategories } from "../services/minutesApi";
import ProductCard from "./ProductCard";
import { MinutesContext } from "../context/MinutesContext";

// Shared by MinutesHome (auto-selected nearest store) and StoreProducts
// (store opened directly via its own page) so both places behave
// identically: search bar above the category tiles, tiles grouped by
// section, click a tile to drill into that store's products for it.
const StoreCatalog = ({ storeId, storeName }) => {
  const { backendUrl } = useContext(MinutesContext);
  const [products, setProducts] = useState([]);
  const [categoryGroups, setCategoryGroups] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!storeId) return;
    fetchStoreProducts(backendUrl, storeId).then(
      ({ data }) => data.success && setProducts(data.products)
    );
    fetchStoreCategories(backendUrl, storeId).then(
      ({ data }) => data.success && setCategoryGroups(data.groups)
    );
    setSelectedCategory(null);
    setSearchQuery("");
  }, [storeId]);

  // Search always searches across the whole store, regardless of whether
  // a category is currently selected — clearing the category filter makes
  // that obvious to the customer.
  const filteredProducts = (
    selectedCategory ? products.filter((p) => p.category === selectedCategory) : products
  ).filter((p) =>
    searchQuery.trim() ? p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) : true
  );

  const hasAnyCategories = Object.keys(categoryGroups).length > 0;

  return (
    <div>
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={`Search in ${storeName || "this store"}...`}
        className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm outline-none focus:border-green-500 mt-4"
      />

      {/* Step 1: no category picked yet — show section-grouped category
          tiles (Grocery & Kitchen, Snacks & Drinks, etc). Clicking a tile
          drills into that category, scoped to this store only. */}
      {!selectedCategory && !searchQuery && hasAnyCategories && (
        <div className="mt-6 flex flex-col gap-8">
          {Object.entries(categoryGroups).map(([group, categories]) => (
            <div key={group}>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">{group}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className="flex flex-col items-center gap-2 text-left"
                  >
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full aspect-square object-cover rounded-xl bg-gray-100"
                    />
                    <p className="text-sm font-medium text-gray-700">{cat.name}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 2: a category is selected (or the customer is searching) —
          show the actual product grid for it. */}
      {(selectedCategory || searchQuery || !hasAnyCategories) && (
        <div className="mt-6">
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-sm text-green-700 font-medium mb-3"
            >
              ← Back to categories
            </button>
          )}

          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            {selectedCategory || (searchQuery ? `Results for "${searchQuery}"` : "All products")}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredProducts.map((p) => (
              <ProductCard key={p._id} product={{ ...p, storeId }} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <p className="text-sm text-gray-400 mt-8 text-center">
              {searchQuery
                ? `No products match "${searchQuery}".`
                : "No products in this category yet."}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default StoreCatalog;
