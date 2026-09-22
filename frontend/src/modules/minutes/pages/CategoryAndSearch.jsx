import { useEffect, useState, useContext } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { fetchProductsByCategory, searchMinuteProducts } from "../services/minutesApi";
import ProductCard from "../components/ProductCard";
import { MinutesContext } from "../context/MinutesContext";

export const CategoryProducts = () => {
  const { categoryName } = useParams();
  const { backendUrl } = useContext(MinutesContext);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProductsByCategory(backendUrl, categoryName).then(
      ({ data }) => data.success && setProducts(data.products)
    );
  }, [categoryName]);

  return (
    <div className="pb-24 mt-4">
      <h1 className="text-lg font-semibold text-gray-800 mb-4">{categoryName}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
      {products.length === 0 && <p className="text-sm text-gray-400">No products found.</p>}
    </div>
  );
};

export const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const { backendUrl } = useContext(MinutesContext);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!q) return;
    searchMinuteProducts(backendUrl, q).then(({ data }) => data.success && setProducts(data.products));
  }, [q]);

  return (
    <div className="pb-24 mt-4">
      <h1 className="text-lg font-semibold text-gray-800 mb-4">Results for "{q}"</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
      {products.length === 0 && <p className="text-sm text-gray-400">No products found.</p>}
    </div>
  );
};
