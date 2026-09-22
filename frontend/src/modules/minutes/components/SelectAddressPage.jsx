import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { MinutesContext } from "../context/MinutesContext";
import { removeAddress, fetchNearbyStores } from "../services/minutesApi";
import distanceKm from "../utils/distance";

// Shown first, every time the customer opens Velora Minutes (see
// MinutesHome.jsx) — matches the reference screenshot: a pink "+ Add New"
// pill up top, then a "Saved addresses" list where the currently selected
// one carries a "Selected" badge.
const SelectAddressPage = ({ onAddNew, onConfirmed, currentLocation }) => {
  const { backendUrl, token, addresses, loadAddresses, selectedAddress, setSelectedAddress } =
    useContext(MinutesContext);
  const [checkingId, setCheckingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleSelect = async (address) => {
    setCheckingId(address._id);
    try {
      // Re-validate store range for this exact address every time it's
      // picked — a store's own delivery radius can change at any point,
      // so "was in range once" isn't good enough.
      await fetchNearbyStores(backendUrl, address.location.lat, address.location.lng);
      setSelectedAddress(address);
      onConfirmed(address);
    } catch (e) {
      console.log(e);
      toast.error("Could not check delivery availability, please try again.");
    } finally {
      setCheckingId(null);
    }
  };

  return (
    <div className="mt-4 pb-24 max-w-lg">
      <h1 className="text-xl font-bold text-gray-800 mb-8">Select delivery address</h1>
      <button
        onClick={onAddNew}
        className="w-full flex items-center justify-between bg-pink-50 text-pink-700 font-semibold rounded-xl px-4 py-3 mb-6"
      >
        <span>+ Add New</span>
        <span>›</span>
      </button>

      <h2 className="text-sm font-semibold text-gray-500 mb-3">Saved addresses</h2>

      <div className="flex flex-col gap-3">
        {addresses.map((a) => {
          const km = currentLocation ? distanceKm(currentLocation, a.location) : null;
          const isSelected = selectedAddress?._id === a._id;
          return (
            <div
              key={a._id}
              onClick={() => handleSelect(a)}
              className={`border rounded-xl p-3 flex gap-3 cursor-pointer ${
                isSelected ? "border-pink-300 bg-pink-50/40" : "border-gray-200"
              }`}
            >
              <div className="flex flex-col items-center gap-1 w-14 shrink-0">
                <div
                  className={`w-14 h-14 rounded-lg flex items-center justify-center text-xl ${
                    a.label === "Home" ? "bg-pink-50" : "bg-gray-100"
                  }`}
                >
                  {a.label === "Home" ? "🏠" : "📍"}
                </div>
                {km != null && (
                  <span className="text-[11px] bg-gray-100 rounded px-1.5 py-0.5 text-gray-600">
                    {km.toFixed(0)} km
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800 truncate">
                    {a.contactName || a.label}
                  </p>
                  {isSelected && (
                    <span className="text-[11px] bg-blue-100 text-blue-700 font-medium rounded px-2 py-0.5">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{a.addressLine}</p>
                {a.phone && (
                  <p className="text-sm text-gray-600 mt-1">📞 {a.phone}</p>
                )}
                {checkingId === a._id && (
                  <p className="text-xs text-gray-400 mt-1">Checking availability...</p>
                )}
              </div>

              <div className="relative shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === a._id ? null : a._id);
                  }}
                  className="text-gray-400 px-1"
                >
                  ⋮
                </button>
                {openMenuId === a._id && (
                  <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded shadow-md z-10 text-sm">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        await removeAddress(backendUrl, token, a._id);
                        loadAddresses();
                      }}
                      className="px-3 py-2 text-red-600 whitespace-nowrap hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {addresses.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-8">
            No saved addresses yet — tap "+ Add New" above.
          </p>
        )}
      </div>
    </div>
  );
};

export default SelectAddressPage;
