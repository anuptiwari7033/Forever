import { useContext } from "react";
import { MinutesContext } from "../context/MinutesContext";

const ProductCard = ({ product }) => {
  const { addToMinutesCart } = useContext(MinutesContext);

  return (
    <div className="border border-gray-200 rounded-lg p-3 flex flex-col">
      <img src={product.image} alt={product.name} className="w-full h-28 object-cover rounded" />
      <p className="text-sm font-medium mt-2 text-gray-800 line-clamp-2">{product.name}</p>
      <p className="text-xs text-gray-500">{product.unit}</p>
      <div className="flex items-center justify-between mt-2">
        <div>
          <span className="font-semibold">₹{product.price}</span>
          {product.mrp > product.price && (
            <span className="text-xs text-gray-400 line-through ml-1">₹{product.mrp}</span>
          )}
        </div>
        <button
          onClick={() => addToMinutesCart(product)}
          className="text-xs border border-green-600 text-green-700 rounded px-3 py-1 hover:bg-green-50"
        >
          ADD
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
