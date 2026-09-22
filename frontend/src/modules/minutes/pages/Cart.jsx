import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { MinutesContext } from "../context/MinutesContext";

const Cart = () => {
  const { minutesCart, updateMinutesCartQuantity, getMinutesCartAmount } = useContext(MinutesContext);
  const navigate = useNavigate();
  const items = Object.values(minutesCart);

  if (items.length === 0) {
    return (
      <div className="mt-16 text-center">
        <p className="text-gray-500">Your Velora Minutes cart is empty.</p>
        <button
          onClick={() => navigate("/minutes")}
          className="mt-4 text-sm text-green-700 font-medium"
        >
          Browse stores
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 pb-32 max-w-lg">
      <h1 className="text-lg font-semibold text-gray-800 mb-4">Your Cart</h1>

      <div className="flex flex-col gap-3">
        {items.map(({ product, quantity }) => (
          <div key={product._id} className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <img src={product.image} alt={product.name} className="w-14 h-14 object-cover rounded" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{product.name}</p>
              <p className="text-xs text-gray-500">{product.unit}</p>
              <p className="text-sm font-semibold">₹{product.price * quantity}</p>
            </div>
            <div className="flex items-center border border-gray-300 rounded">
              <button
                className="px-2 py-1"
                onClick={() => updateMinutesCartQuantity(product._id, quantity - 1)}
              >
                −
              </button>
              <span className="px-2">{quantity}</span>
              <button
                className="px-2 py-1"
                onClick={() => updateMinutesCartQuantity(product._id, quantity + 1)}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-lg font-semibold">₹{getMinutesCartAmount()}</p>
        </div>
        <button
          onClick={() => navigate("/minutes/checkout")}
          className="bg-green-600 text-white rounded px-8 py-3 text-sm font-medium hover:bg-green-700"
        >
          Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;
