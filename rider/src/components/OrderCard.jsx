const OrderCard = ({ order }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-800">Order #{order._id.slice(-6)}</span>
        <span className="text-green-700 capitalize">{order.status.replaceAll("_", " ")}</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">{order.items.length} item(s) · ₹{order.amount}</p>
      <p className="text-xs text-gray-500 mt-1">Deliver to: {order.address?.addressLine}</p>
      <p className="text-xs text-gray-400 mt-1">Payment: {order.paymentMethod}</p>
    </div>
  );
};

export default OrderCard;
