import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { MinutesContext } from "../context/MinutesContext";
import { placeMinuteOrder, applyCoupon } from "../services/minutesApi";

const Checkout = () => {
  const {
    backendUrl,
    token,
    minutesCart,
    getMinutesCartAmount,
    clearMinutesCart,
    selectedAddress,
    selectedStore,
  } = useContext(MinutesContext);
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [placing, setPlacing] = useState(false);

  const cartAmount = getMinutesCartAmount();
  const deliveryFee = 15;
  const total = Math.max(0, cartAmount + deliveryFee - discount);

  const handleApplyCoupon = async () => {
    try {
      const { data } = await applyCoupon(backendUrl, token, couponCode, cartAmount);
      if (data.success) {
        setDiscount(data.discount);
        toast.success("Coupon applied");
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select or add a delivery address");
      return;
    }

    setPlacing(true);
    try {
      const items = Object.values(minutesCart).map(({ product, quantity }) => ({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity,
      }));

      // const { data } = await placeMinuteOrder(backendUrl, token, {
      //   storeId: selectedStore,
      //   items,
      //   amount: total,
      //   deliveryFee,
      //   discount,
      //   couponCode,
      //   address: {
      //     addressLine: selectedAddress.addressLine,
      //     lat: selectedAddress.location.lat,
      //     lng: selectedAddress.location.lng,
      //   },
      //   paymentMethod,
      // });

      const { data } = await placeMinuteOrder(backendUrl, token, {
  storeId: selectedStore,
  items,
  amount: total,
  deliveryFee,
  discount,
  couponCode,
  address: {
    addressLine: selectedAddress.addressLine,
    location: {
      lat: selectedAddress.location.lat,
      lng: selectedAddress.location.lng,
    },
  },
  paymentMethod,
});

      if (data.success) {
        clearMinutesCart();
        toast.success("Order placed! Finding you a rider...");
        navigate(`/minutes/orders/${data.order._id}`);
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="mt-4 pb-32 max-w-lg">
      <h1 className="text-lg font-semibold text-gray-800 mb-4">Checkout</h1>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Delivery address</h2>
        {/* Deliberately read-only here — the address was already chosen on
            the Velora Minutes home screen before the customer got this far.
            No "change" control on checkout itself; go back to home to
            change it (which re-runs the full store-availability check). */}
        {selectedAddress ? (
          <div className="border border-green-600 bg-green-50 rounded p-3 text-sm">
            <p className="font-medium text-gray-800">
              {selectedAddress.contactName || selectedAddress.label}
              {selectedAddress.label && (
                <span className="ml-2 text-xs bg-white border border-green-200 text-green-700 rounded px-1.5 py-0.5">
                  {selectedAddress.label}
                </span>
              )}
            </p>
            <p className="text-gray-600 mt-1">{selectedAddress.addressLine}</p>
            {selectedAddress.phone && (
              <p className="text-gray-500 text-xs mt-1">📞 {selectedAddress.phone}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-amber-600">
            No delivery address selected — go back to Velora Minutes home to pick one.
          </p>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Coupon</h2>
        <div className="flex gap-2">
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Enter coupon code"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <button onClick={handleApplyCoupon} className="border border-green-600 text-green-700 rounded px-4 text-sm">
            Apply
          </button>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Payment method</h2>
        <div className="flex flex-col gap-2 text-sm">
          {["COD", "ONLINE", "WALLET"].map((method) => (
            <label key={method} className="flex items-center gap-2">
              <input
                type="radio"
                checked={paymentMethod === method}
                onChange={() => setPaymentMethod(method)}
              />
              {method === "COD" ? "Cash on Delivery" : method === "ONLINE" ? "Pay Online" : "Wallet"}
            </label>
          ))}
        </div>
      </section>

      <section className="mt-6 border-t border-gray-200 pt-4 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>₹{cartAmount}</span></div>
        <div className="flex justify-between"><span>Delivery fee</span><span>₹{deliveryFee}</span></div>
        {discount > 0 && (
          <div className="flex justify-between text-green-700"><span>Discount</span><span>-₹{discount}</span></div>
        )}
        <div className="flex justify-between font-semibold mt-1"><span>Total</span><span>₹{total}</span></div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <button
          onClick={handlePlaceOrder}
          disabled={placing}
          className="w-full bg-green-600 text-white rounded py-3 text-sm font-medium hover:bg-green-700 disabled:opacity-60"
        >
          {placing ? "Placing order..." : `Place order · ₹${total}`}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
