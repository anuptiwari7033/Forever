// const statusLabel = {
//   placed: "Placed",
//   searching_rider: "Waiting for rider",
//   accepted: "Rider on the way to store",
//   arrived_at_store: "Rider arrived at store",
//   picked_up: "Picked up",
//   out_for_delivery: "Out for delivery",
//   arrived_at_customer: "Rider at customer's door",
//   delivered: "Delivered",
//   cancelled: "Cancelled",
//   rejected: "Rejected",
// };

// const OrderRow = ({ order, onMarkPacked, marking }) => {
//   const rider = typeof order.riderId === "object" ? order.riderId : null;
//   const isFinal = ["delivered", "cancelled"].includes(order.status);

//   return (
//     <div className="border border-gray-200 rounded-lg p-4">
//       <div className="flex justify-between items-start">
//         <div>
//           <p className="font-medium text-gray-800">Order #{order._id.slice(-6)}</p>
//           <p className="text-xs text-gray-500 mt-1">
//             {order.items.length} item(s) · ₹{order.amount} · {order.paymentMethod}
//           </p>
//         </div>
//         <span className="text-xs font-medium text-green-700">
//           {statusLabel[order.status] || order.status}
//         </span>
//       </div>

//       <div className="mt-3 border-t border-gray-100 pt-3">
//         <p className="font-medium text-gray-700">Items to pack</p>
//         <ul className="text-sm text-gray-600 list-disc pl-4 mt-1">
//           {order.items.map((item, i) => (
//             <li key={i}>
//               {item.quantity} × {item.name}
//             </li>
//           ))}
//         </ul>
//       </div>

//       <div className="mt-3 border-t border-gray-100 pt-3 text-sm">
//         {rider ? (
//           <div>
//             <p className="font-medium text-gray-700">Rider assigned</p>
//             <p className="text-gray-600">
//               {rider.name} · {rider.phone} · {rider.vehicleType} · ⭐ {rider.rating}
//             </p>
//           </div>
//         ) : order.status === "searching_rider" ? (
//           <p className="text-amber-600 font-medium">🔎 Waiting for a rider to accept...</p>
//         ) : isFinal ? (
//           <p className="text-gray-400">—</p>
//         ) : (
//           <p className="text-amber-600 font-medium">🔎 Waiting for a rider to accept...</p>
//         )}
//       </div>

//       {!isFinal && (
//         <div className="mt-4">
//           {order.packedByStore ? (
//             <span className="inline-block bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded">
//               ✓ Packed
//             </span>
//           ) : (
//             <button
//               onClick={() => onMarkPacked(order._id)}
//               disabled={marking}
//               className="bg-green-600 text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
//             >
//               {marking ? "Marking..." : "Mark as packed"}
//             </button>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default OrderRow;

const statusLabel = {
  placed: "Placed",
  searching_rider: "Waiting for rider",
  accepted: "Rider on the way to store",
  arrived_at_store: "Rider arrived at store",
  picked_up: "Picked up",
  out_for_delivery: "Out for delivery",
  arrived_at_customer: "Rider at customer's door",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

const OrderRow = ({ order, onMarkPacked, marking }) => {
  const rider =
    order?.riderId && typeof order.riderId === "object"
      ? order.riderId
      : null;

  const isFinal = ["delivered", "cancelled"].includes(order.status);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-gray-800">
            Order #{order?._id?.slice(-6)}
          </p>

          <p className="text-xs text-gray-500 mt-1">
            {order?.items?.length || 0} item(s) · ₹{order.amount} ·{" "}
            {order.paymentMethod}
          </p>
        </div>

        <span className="text-xs font-medium text-green-700">
          {statusLabel[order.status] || order.status}
        </span>
      </div>

      <div className="mt-3 border-t border-gray-100 pt-3">
        <p className="font-medium text-gray-700">Items to pack</p>

        <ul className="text-sm text-gray-600 list-disc pl-4 mt-1">
          {order?.items?.map((item, i) => (
            <li key={i}>
              {item.quantity} × {item.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 border-t border-gray-100 pt-3 text-sm">
        {rider ? (
          <div>
            <p className="font-medium text-gray-700">Rider assigned</p>

            <p className="text-gray-600">
              {rider.name} · {rider.phone} · {rider.vehicleType} · ⭐{" "}
              {rider.rating ?? "N/A"}
            </p>
          </div>
        ) : isFinal ? (
          <p className="text-gray-400">—</p>
        ) : (
          <p className="text-amber-600 font-medium">
            🔎 Waiting for a rider to accept...
          </p>
        )}
      </div>

      {!isFinal && (
        <div className="mt-4">
          {order.packedByStore ? (
            <span className="inline-block bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded">
              ✓ Packed
            </span>
          ) : (
            <button
              onClick={() => onMarkPacked(order._id)}
              disabled={marking}
              className="bg-green-600 text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {marking ? "Marking..." : "Mark as packed"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderRow;
// const statusLabel = {
//   placed: "Placed",
//   searching_rider: "Waiting for rider",
//   accepted: "Rider on the way to store",
//   arrived_at_store: "Rider arrived at store",
//   picked_up: "Picked up",
//   out_for_delivery: "Out for delivery",
//   arrived_at_customer: "Rider at customer's door",
//   delivered: "Delivered",
//   cancelled: "Cancelled",
//   rejected: "Rejected",
// };

// const OrderRow = ({ order, onMarkPacked, marking }) => {
//   console.log("======================================");
//   console.log("ORDER ID:", order?._id);
//   console.log("STATUS:", order?.status);
//   console.log("PACKED:", order?.packedByStore);
//   console.log("RIDER ID:", order?.riderId);
//   console.log("TYPE OF RIDER ID:", typeof order?.riderId);
//   console.log("FULL ORDER:", order);

//   const rider =
//     order?.riderId && typeof order.riderId === "object"
//       ? order.riderId
//       : null;

//   console.log("RIDER OBJECT:", rider);

//   const isFinal = ["delivered", "cancelled"].includes(order.status);

//   return (
//     <div className="border border-gray-200 rounded-lg p-4">
//       <div className="flex justify-between items-start">
//         <div>
//           <p className="font-medium text-gray-800">
//             Order #{order?._id?.slice(-6)}
//           </p>

//           <p className="text-xs text-gray-500 mt-1">
//             {order?.items?.length || 0} item(s) · ₹{order?.amount} ·{" "}
//             {order?.paymentMethod}
//           </p>
//         </div>

//         <span className="text-xs font-medium text-green-700">
//           {statusLabel[order.status] || order.status}
//         </span>
//       </div>

//       <div className="mt-3 border-t border-gray-100 pt-3">
//         <p className="font-medium text-gray-700">Items to pack</p>

//         <ul className="text-sm text-gray-600 list-disc pl-4 mt-1">
//           {order?.items?.map((item, i) => (
//             <li key={i}>
//               {item.quantity} × {item.name}
//             </li>
//           ))}
//         </ul>
//       </div>

//       <div className="mt-3 border-t border-gray-100 pt-3 text-sm">
//         {console.log("===== RIDER RENDER =====")}
//         {console.log({
//           status: order?.status,
//           packed: order?.packedByStore,
//           riderId: order?.riderId,
//           rider,
//         })}

//         {rider ? (
//           <div>
//             <p className="font-medium text-gray-700">Rider assigned</p>

//             <p className="text-gray-600">
//               {rider.name} · {rider.phone} · {rider.vehicleType} · ⭐{" "}
//               {rider.rating ?? "N/A"}
//             </p>
//           </div>
//         ) : isFinal ? (
//           <p className="text-gray-400">—</p>
//         ) : (
//           <p className="text-amber-600 font-medium">
//             🔎 Waiting for a rider to accept...
//           </p>
//         )}
//       </div>

//       {!isFinal && (
//         <div className="mt-4">
//           {order.packedByStore ? (
//             <span className="inline-block bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded">
//               ✓ Packed
//             </span>
//           ) : (
//             <button
//               onClick={() => {
//                 console.log("MARK PACKED CLICKED");
//                 console.log("ORDER BEFORE PACK:", order);
//                 onMarkPacked(order._id);
//               }}
//               disabled={marking}
//               className="bg-green-600 text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
//             >
//               {marking ? "Marking..." : "Mark as packed"}
//             </button>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default OrderRow;