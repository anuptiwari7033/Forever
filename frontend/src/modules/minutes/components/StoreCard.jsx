import { useNavigate } from "react-router-dom";

const StoreCard = ({ store }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/minutes/store/${store._id}`)}
      className="cursor-pointer border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
    >
      <img src={store.image} alt={store.name} className="w-full h-32 object-cover" />
      <div className="p-3">
        <p className="font-medium text-gray-800">{store.name}</p>
        <p className="text-xs text-gray-500 truncate">{store.address}</p>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
          <span>⭐ {store.rating}</span>
          {typeof store.distanceKm === "number" && (
            <span>{store.distanceKm.toFixed(1)} km away</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreCard;
