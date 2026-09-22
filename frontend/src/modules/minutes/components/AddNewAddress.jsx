// import { useContext, useEffect, useRef, useState } from "react";
// import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";
// import { toast } from "react-toastify";
// import { MinutesContext } from "../context/MinutesContext";
// import { fetchNearbyStores, addAddress } from "../services/minutesApi";
// import { searchPlaces, reverseGeocode } from "../services/geocode";
// import distanceKm from "../utils/distance";

// const pinIcon = L.divIcon({
//   html: '<div style="font-size:32px;">📍</div>',
//   className: "",
//   iconSize: [32, 32],
//   iconAnchor: [16, 32],
// });

// const ClickToPick = ({ onPick }) => {
//   useMapEvents({
//     click(e) {
//       onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
//     },
//   });
//   return null;
// };

// // Re-centers the map whenever `center` changes from OUTSIDE the map (e.g.
// // picking a search suggestion or tapping "use current location") — plain
// // MapContainer center only applies once, on first mount.
// const RecenterMap = ({ center }) => {
//   const map = useMap();
//   useEffect(() => {
//     map.setView([center.lat, center.lng], map.getZoom() < 14 ? 15 : map.getZoom());
//   }, [center.lat, center.lng]);
//   return null;
// };

// const NotHereYetCard = ({ onUseCurrentLocation, onSearchAnother }) => (
//   <div className="border border-gray-200 rounded-xl p-6 text-center mt-4">
//     <div className="text-4xl mb-2">🚧</div>
//     <p className="font-semibold text-gray-800 mb-1">We're not here yet</p>
//     <p className="text-sm text-gray-500 mb-5">
//       We currently do not deliver at this location. We'll be there soon!
//     </p>
//     <button
//       onClick={onUseCurrentLocation}
//       className="w-full bg-blue-600 text-white rounded-lg py-3 text-sm font-medium mb-2"
//     >
//       Use current location
//     </button>
//     <button
//       onClick={onSearchAnother}
//       className="w-full border border-blue-600 text-blue-600 rounded-lg py-3 text-sm font-medium"
//     >
//       Search another location
//     </button>
//   </div>
// );

// /**
//  * Full "Add new address" flow:
//  *  1. map + search, pin defaults to device GPS, range checked immediately
//  *  2. "We're not here yet" OR "Deliver To" card depending on range
//  *  3. "Add address details" form (only reachable when in range)
//  *  4. Save -> POST address, select it, done
//  *
//  * Props: onSaved(address) — called once the address is created & selected.
//  *        onCancel() — go back to SelectAddressPage.
//  */
// const AddNewAddress = ({ onSaved, onCancel }) => {
//   const { backendUrl, token } = useContext(MinutesContext);

//   const [deviceLocation, setDeviceLocation] = useState(null); // real GPS, used for the "X km away" line + "use current location"
//   const [pin, setPin] = useState(null); // { lat, lng } — wherever the marker currently sits
//   const [resolvedAddress, setResolvedAddress] = useState("");
//   const [rangeStatus, setRangeStatus] = useState("checking"); // 'checking' | 'available' | 'unavailable'
//   const [query, setQuery] = useState("");
//   const [suggestions, setSuggestions] = useState([]);
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const [showForm, setShowForm] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const searchTimer = useRef(null);
//   const searchInputRef = useRef(null);

//   const [form, setForm] = useState({
//     houseNumber: "",
//     contactName: "",
//     phone: "",
//     alternatePhone: "",
//     type: "Home",
//   });

//   const checkRangeAndResolve = async (loc) => {
//     setRangeStatus("checking");
//     try {
//       const [{ data: storeData }, addressText] = await Promise.all([
//         fetchNearbyStores(backendUrl, loc.lat, loc.lng),
//         reverseGeocode(loc.lat, loc.lng),
//       ]);
//       setResolvedAddress(addressText);
//       setRangeStatus(storeData.success && storeData.stores.length > 0 ? "available" : "unavailable");
//     } catch (e) {
//       console.log(e);
//       toast.error("Could not check delivery availability");
//       setRangeStatus("unavailable");
//     }
//   };

//   const goToLocation = (loc) => {
//     setPin(loc);
//     setShowSuggestions(false);
//     checkRangeAndResolve(loc);
//   };

//   const useCurrentLocation = () => {
//     if (!navigator.geolocation) {
//       toast.error("Location not supported on this device");
//       return;
//     }
//     navigator.geolocation.getCurrentPosition(
//       (pos) => {
//         const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
//         setDeviceLocation(loc);
//         goToLocation(loc);
//       },
//       () => toast.error("Couldn't get your current location — search for it instead.")
//     );
//   };

//   // First open: try GPS immediately, exactly like a search-suggestion pick.
//   useEffect(() => {
//     useCurrentLocation();
//   }, []);

//   const handleQueryChange = (value) => {
//     setQuery(value);
//     setShowSuggestions(true);
//     if (searchTimer.current) clearTimeout(searchTimer.current);
//     if (value.trim().length < 3) {
//       setSuggestions([]);
//       return;
//     }
//     searchTimer.current = setTimeout(async () => {
//       const results = await searchPlaces(value);
//       setSuggestions(results);
//     }, 500); // gentle debounce — Nominatim's free tier asks for ~1 req/sec
//   };

//   const handlePickSuggestion = (s) => {
//     setQuery(s.label);
//     goToLocation({ lat: s.lat, lng: s.lng });
//   };

//   const handleSearchAnother = () => {
//     setShowForm(false);
//     searchInputRef.current?.focus();
//   };

//   const handleSaveAddress = async () => {
//     if (!form.houseNumber.trim()) return toast.error("Enter your flat/house/building name");
//     if (!form.contactName.trim()) return toast.error("Enter your full name");
//     if (!/^\d{10}$/.test(form.phone.trim())) return toast.error("Enter a valid 10-digit mobile number");

//     setSaving(true);
//     try {
//       const { data } = await addAddress(backendUrl, token, {
//         label: form.type,
//         houseNumber: form.houseNumber.trim(),
//         area: resolvedAddress,
//         addressLine: `${form.houseNumber.trim()}, ${resolvedAddress}`,
//         contactName: form.contactName.trim(),
//         phone: form.phone.trim(),
//         alternatePhone: form.alternatePhone.trim(),
//         lat: pin.lat,
//         lng: pin.lng,
//       });
//       if (data.success) {
//         toast.success("Address saved");
//         onSaved(data.address);
//       } else {
//         toast.error(data.message);
//       }
//     } catch (e) {
//       console.log(e);
//       toast.error("Could not save address");
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (!pin) {
//     return <p className="mt-8 text-sm text-gray-400 text-center">Getting your location...</p>;
//   }

//   return (
//     <div className="mt-2 pb-24 max-w-lg">
//       <button onClick={onCancel} className="text-sm text-gray-500 mb-3">
//         ← Back
//       </button>

//       <div className="relative">
//         <input
//           ref={searchInputRef}
//           value={query}
//           onChange={(e) => handleQueryChange(e.target.value)}
//           onFocus={() => setShowSuggestions(true)}
//           placeholder="Search by area, name, street..."
//           className="w-full border border-gray-300 rounded-full px-4 py-3 text-sm outline-none focus:border-blue-500"
//         />
//         {showSuggestions && suggestions.length > 0 && (
//          <div className="absolute left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-[9999] max-h-72 overflow-y-auto"> 
//             {suggestions.map((s, i) => (
//               <button
//                 key={i}
//                 onClick={() => handlePickSuggestion(s)}
//                 className="w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 flex gap-2"
//               >
//                 <span className="text-gray-400">📍</span>
//                 <span className="min-w-0">
//                   <span className="block font-medium text-gray-800 truncate">{s.label}</span>
//                   <span className="block text-xs text-gray-500 truncate">{s.sublabel}</span>
//                 </span>
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       <div className="mt-3 rounded-xl overflow-hidden">
//         <MapContainer
//           center={[pin.lat, pin.lng]}
//           zoom={15}
//           style={{ height: "260px", width: "100%" }}
//         >
//           <TileLayer
//             attribution="&copy; OpenStreetMap contributors"
//             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           />
//           <Marker position={[pin.lat, pin.lng]} icon={pinIcon} />
//           <RecenterMap center={pin} />
//           <ClickToPick onPick={goToLocation} />
//         </MapContainer>
//       </div>

//       <button onClick={useCurrentLocation} className="text-sm text-blue-600 font-medium mt-3">
//         🎯 Use my current location
//       </button>

//       {rangeStatus === "checking" && (
//         <p className="text-sm text-gray-400 mt-4 text-center">Checking this location...</p>
//       )}

//       {rangeStatus === "unavailable" && (
//         <NotHereYetCard onUseCurrentLocation={useCurrentLocation} onSearchAnother={handleSearchAnother} />
//       )}

//       {rangeStatus === "available" && !showForm && (
//         <div className="border border-gray-200 rounded-xl p-4 mt-4">
//           <p className="text-xs text-gray-400 mb-1">Deliver To</p>
//           <div className="flex items-start justify-between gap-2">
//             <p className="font-medium text-gray-800 text-sm">{resolvedAddress}</p>
//             <button
//               onClick={handleSearchAnother}
//               className="text-blue-600 text-sm font-medium border border-blue-200 rounded px-2 py-0.5 shrink-0"
//             >
//               Change
//             </button>
//           </div>

//           {deviceLocation && (
//             <p className="text-xs bg-yellow-50 text-yellow-700 rounded px-2 py-1.5 mt-3">
//               {distanceKm(deviceLocation, pin).toFixed(1)} kms away from your current location
//             </p>
//           )}

//           <button
//             onClick={() => setShowForm(true)}
//             className="w-full bg-blue-600 text-white rounded-lg py-3 text-sm font-medium mt-3"
//           >
//             Add address Details
//           </button>
//         </div>
//       )}

//       {rangeStatus === "available" && showForm && (
//         <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
//           <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
//             <div className="flex items-center justify-between mb-3">
//               <h2 className="text-base font-semibold text-gray-800">Deliver To</h2>
//               <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
//             </div>

//             <div className="bg-amber-50 text-amber-700 text-xs rounded-lg px-3 py-2 mb-4">
//               Ensure your address details are accurate for a smooth delivery experience
//             </div>

//             <label className="block text-xs font-medium text-blue-600 mb-1">
//               Flat/House/building name *
//             </label>
//             <input
//               value={form.houseNumber}
//               onChange={(e) => setForm({ ...form, houseNumber: e.target.value })}
//               className="w-full border border-blue-300 rounded-lg px-3 py-2.5 text-sm mb-4 outline-none"
//               autoFocus
//             />

//             <div className="flex items-start justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2.5 mb-4">
//               <div className="min-w-0">
//                 <p className="text-xs text-gray-400 mb-0.5">Area / Sector / Locality</p>
//                 <p className="text-sm font-medium text-gray-800">{resolvedAddress}</p>
//               </div>
//               <button
//                 onClick={() => {
//                   setShowForm(false);
//                   handleSearchAnother();
//                 }}
//                 className="text-blue-600 text-sm font-medium border border-blue-200 rounded px-2 py-0.5 shrink-0"
//               >
//                 Change
//               </button>
//             </div>

//             <label className="block text-xs text-gray-400 mb-1">Enter your full name *</label>
//             <input
//               value={form.contactName}
//               onChange={(e) => setForm({ ...form, contactName: e.target.value })}
//               className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-blue-500"
//             />

//             <label className="block text-xs text-gray-400 mb-1">10-digit mobile number *</label>
//             <input
//               value={form.phone}
//               onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
//               className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-blue-500"
//             />

//             <input
//               value={form.alternatePhone}
//               onChange={(e) =>
//                 setForm({ ...form, alternatePhone: e.target.value.replace(/\D/g, "").slice(0, 10) })
//               }
//               placeholder="Alternate phone number (Optional)"
//               className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-blue-500"
//             />

//             <p className="text-xs text-gray-400 mb-2">Type of address</p>
//             <div className="flex gap-2 mb-6">
//               {["Home", "Work"].map((t) => (
//                 <button
//                   key={t}
//                   onClick={() => setForm({ ...form, type: t })}
//                   className={`flex-1 border rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 ${
//                     form.type === t ? "border-blue-600 text-blue-600 bg-blue-50" : "border-gray-300 text-gray-600"
//                   }`}
//                 >
//                   {t === "Home" ? "🏠" : "💼"} {t}
//                 </button>
//               ))}
//             </div>

//             <button
//               onClick={handleSaveAddress}
//               disabled={saving}
//               className="w-full bg-blue-600 text-white rounded-lg py-3 text-sm font-medium disabled:opacity-60"
//             >
//               {saving ? "Saving..." : "Save address"}
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AddNewAddress;
import { useContext, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "react-toastify";
import { MinutesContext } from "../context/MinutesContext";
import { fetchNearbyStores, addAddress } from "../services/minutesApi";
import { searchPlaces, reverseGeocode } from "../services/geocode";
import distanceKm from "../utils/distance";

const pinIcon = L.divIcon({
  html: '<div style="font-size:32px;">📍</div>',
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const ClickToPick = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

// Re-centers the map whenever `center` changes from OUTSIDE the map (e.g.
// picking a search suggestion or tapping "use current location") — plain
// MapContainer center only applies once, on first mount.
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom() < 14 ? 15 : map.getZoom());
  }, [center.lat, center.lng]);
  return null;
};

const NotHereYetCard = ({ onUseCurrentLocation, onSearchAnother }) => (
  <div className="border border-gray-200 rounded-xl p-1 text-center mt-2">
    <div className="text-4xl mb-2">🚧</div>
    <p className="font-semibold text-gray-800 mb-1">We're not here yet</p>
    <p className="text-sm text-gray-500 mb-5">
      We currently do not deliver at this location. We'll be there soon!
    </p>
    <button
      onClick={onUseCurrentLocation}
      className="w-full bg-blue-600 text-white rounded-lg py-3 text-sm font-medium mb-2"
    >
      Use current location
    </button>
    <button
      onClick={onSearchAnother}
      className="w-full border border-blue-600 text-blue-600 rounded-lg py-3 text-sm font-medium"
    >
      Search another location
    </button>
  </div>
);

/**
 * Full "Add new address" flow:
 *  1. map + search, pin defaults to device GPS, range checked immediately
 *  2. "We're not here yet" OR "Deliver To" card depending on range
 *  3. "Add address details" form (only reachable when in range)
 *  4. Save -> POST address, select it, done
 *
 * Props: onSaved(address) — called once the address is created & selected.
 *        onCancel() — go back to SelectAddressPage.
 */
const AddNewAddress = ({ onSaved, onCancel }) => {
  const { backendUrl, token } = useContext(MinutesContext);

  const [deviceLocation, setDeviceLocation] = useState(null); // real GPS, used for the "X km away" line + "use current location"
  const [pin, setPin] = useState(null); // { lat, lng } — wherever the marker currently sits
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [rangeStatus, setRangeStatus] = useState("checking"); // 'checking' | 'available' | 'unavailable'
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchTimer = useRef(null);
  const searchInputRef = useRef(null);

  const [form, setForm] = useState({
    houseNumber: "",
    contactName: "",
    phone: "",
    alternatePhone: "",
    type: "Home",
  });

  const checkRangeAndResolve = async (loc) => {
    setRangeStatus("checking");
    try {
      const [{ data: storeData }, addressText] = await Promise.all([
        fetchNearbyStores(backendUrl, loc.lat, loc.lng),
        reverseGeocode(loc.lat, loc.lng),
      ]);
      setResolvedAddress(addressText);
      setRangeStatus(storeData.success && storeData.stores.length > 0 ? "available" : "unavailable");
    } catch (e) {
      console.log(e);
      toast.error("Could not check delivery availability");
      setRangeStatus("unavailable");
    }
  };

  const goToLocation = (loc) => {
    setPin(loc);
    setShowSuggestions(false);
    checkRangeAndResolve(loc);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location not supported on this device");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDeviceLocation(loc);
        goToLocation(loc);
      },
      () => toast.error("Couldn't get your current location — search for it instead.")
    );
  };

  // First open: try GPS immediately, exactly like a search-suggestion pick.
  useEffect(() => {
    useCurrentLocation();
  }, []);

  const handleQueryChange = (value) => {
    setQuery(value);
    setShowSuggestions(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      const results = await searchPlaces(value);
      setSuggestions(results);
    }, 500); // gentle debounce — Nominatim's free tier asks for ~1 req/sec
  };

  const handlePickSuggestion = (s) => {
    setQuery(s.label);
    goToLocation({ lat: s.lat, lng: s.lng });
  };

  const handleSearchAnother = () => {
    setShowForm(false);
    searchInputRef.current?.focus();
  };

  const handleSaveAddress = async () => {
    if (!form.houseNumber.trim()) return toast.error("Enter your flat/house/building name");
    if (!form.contactName.trim()) return toast.error("Enter your full name");
    if (!/^\d{10}$/.test(form.phone.trim())) return toast.error("Enter a valid 10-digit mobile number");

    setSaving(true);
    try {
      const { data } = await addAddress(backendUrl, token, {
        label: form.type,
        houseNumber: form.houseNumber.trim(),
        area: resolvedAddress,
        addressLine: `${form.houseNumber.trim()}, ${resolvedAddress}`,
        contactName: form.contactName.trim(),
        phone: form.phone.trim(),
        alternatePhone: form.alternatePhone.trim(),
        lat: pin.lat,
        lng: pin.lng,
      });
      if (data.success) {
        toast.success("Address saved");
        onSaved(data.address);
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      console.log(e);
      toast.error("Could not save address");
    } finally {
      setSaving(false);
    }
  };

  if (!pin) {
    return <p className="mt-8 text-sm text-gray-400 text-center">Getting your location...</p>;
  }

  return (
    <div className="-mt-6 pb-24 max-w-lg">
      <button onClick={onCancel} className="text-sm text-gray-500 mb-3">
        ← Back
      </button>

      {!showForm && (
        <>
          <div className="relative">
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search by area, name, street..."
              className="w-full border border-gray-300 rounded-full px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-[9999] max-h-72 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handlePickSuggestion(s)}
                    className="w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 flex gap-2"
                  >
                    <span className="text-gray-400">📍</span>
                    <span className="min-w-0">
                      <span className="block font-medium text-gray-800 truncate">{s.label}</span>
                      <span className="block text-xs text-gray-500 truncate">{s.sublabel}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 rounded-xl overflow-hidden">
            <MapContainer
              center={[pin.lat, pin.lng]}
              zoom={15}
              style={{ height: "260px", width: "100%" }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[pin.lat, pin.lng]} icon={pinIcon} />
              <RecenterMap center={pin} />
              <ClickToPick onPick={goToLocation} />
            </MapContainer>
          </div>

          <button onClick={useCurrentLocation} className="text-sm text-blue-600 font-medium mt-3">
            🎯 Use my current location
          </button>

          {rangeStatus === "checking" && (
            <p className="text-sm text-gray-400 mt-4 text-center">Checking this location...</p>
          )}

          {rangeStatus === "unavailable" && (
            <NotHereYetCard onUseCurrentLocation={useCurrentLocation} onSearchAnother={handleSearchAnother} />
          )}

          {rangeStatus === "available" && (
            <div className="border border-gray-200 rounded-xl p-4 mt-4">
              <p className="text-xs text-gray-400 mb-1">Deliver To</p>
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-gray-800 text-sm">{resolvedAddress}</p>
                <button
                  onClick={handleSearchAnother}
                  className="text-blue-600 text-sm font-medium border border-blue-200 rounded px-2 py-0.5 shrink-0"
                >
                  Change
                </button>
              </div>

              {deviceLocation && (
                <p className="text-xs bg-yellow-50 text-yellow-700 rounded px-2 py-1.5 mt-3">
                  {distanceKm(deviceLocation, pin).toFixed(1)} kms away from your current location
                </p>
              )}

              <button
                onClick={() => setShowForm(true)}
                className="w-full bg-blue-600 text-white rounded-lg py-3 text-sm font-medium mt-3"
              >
                Add address Details
              </button>
            </div>
          )}
        </>
      )}

      {rangeStatus === "available" && showForm && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">Deliver To</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>

            <div className="bg-amber-50 text-amber-700 text-xs rounded-lg px-3 py-2 mb-4">
              Ensure your address details are accurate for a smooth delivery experience
            </div>

            <label className="block text-xs font-medium text-blue-600 mb-1">
              Flat/House/building name *
            </label>
            <input
              value={form.houseNumber}
              onChange={(e) => setForm({ ...form, houseNumber: e.target.value })}
              className="w-full border border-blue-300 rounded-lg px-3 py-2.5 text-sm mb-4 outline-none"
              autoFocus
            />

            <div className="flex items-start justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2.5 mb-4">
              <div className="min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">Area / Sector / Locality</p>
                <p className="text-sm font-medium text-gray-800">{resolvedAddress}</p>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  handleSearchAnother();
                }}
                className="text-blue-600 text-sm font-medium border border-blue-200 rounded px-2 py-0.5 shrink-0"
              >
                Change
              </button>
            </div>

            <label className="block text-xs text-gray-400 mb-1">Enter your full name *</label>
            <input
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-blue-500"
            />

            <label className="block text-xs text-gray-400 mb-1">10-digit mobile number *</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-blue-500"
            />

            <input
              value={form.alternatePhone}
              onChange={(e) =>
                setForm({ ...form, alternatePhone: e.target.value.replace(/\D/g, "").slice(0, 10) })
              }
              placeholder="Alternate phone number (Optional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-blue-500"
            />

            <p className="text-xs text-gray-400 mb-2">Type of address</p>
            <div className="flex gap-2 mb-6">
              {["Home", "Work"].map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t })}
                  className={`flex-1 border rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 ${
                    form.type === t ? "border-blue-600 text-blue-600 bg-blue-50" : "border-gray-300 text-gray-600"
                  }`}
                >
                  {t === "Home" ? "🏠" : "💼"} {t}
                </button>
              ))}
            </div>

            <button
              onClick={handleSaveAddress}
              disabled={saving}
              className="w-full bg-blue-600 text-white rounded-lg py-3 text-sm font-medium disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save address"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddNewAddress;