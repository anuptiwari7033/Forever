import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { fetchProduct } from "../services/minutesApi";
import { MinutesContext } from "../context/MinutesContext";

const ProductDetails = () => {
  const { productId } = useParams();
  const { backendUrl, addToMinutesCart } = useContext(MinutesContext);
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct(backendUrl, productId).then(({ data }) => data.success && setProduct(data.product));
  }, [productId]);

  if (!product) return <p className="mt-8 text-sm text-gray-400">Loading...</p>;

  return (
    <div className="mt-4 pb-24 max-w-lg">
      <img src={product.image} alt={product.name} className="w-full h-64 object-cover rounded-lg" />
      <h1 className="text-lg font-semibold mt-4 text-gray-800">{product.name}</h1>
      <p className="text-sm text-gray-500">{product.unit}</p>
      <p className="text-sm text-gray-600 mt-2">{product.description}</p>

      <div className="flex items-center gap-3 mt-4">
        <span className="text-xl font-semibold">₹{product.price}</span>
        {product.mrp > product.price && (
          <span className="text-sm text-gray-400 line-through">₹{product.mrp}</span>
        )}
      </div>

      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center border border-gray-300 rounded">
          <button className="px-3 py-1" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
            −
          </button>
          <span className="px-3">{quantity}</span>
          <button className="px-3 py-1" onClick={() => setQuantity((q) => q + 1)}>
            +
          </button>
        </div>
        <button
          onClick={() => addToMinutesCart({ ...product, storeId: product.storeId }, quantity)}
          className="bg-green-600 text-white rounded px-6 py-2 text-sm font-medium hover:bg-green-700"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
};

export default ProductDetails;
