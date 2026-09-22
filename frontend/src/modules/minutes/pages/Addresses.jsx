import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { MinutesContext } from "../context/MinutesContext";
import { addAddress, removeAddress } from "../services/minutesApi";

const Addresses = () => {
  const { backendUrl, token, addresses, loadAddresses } = useContext(MinutesContext);
  const [form, setForm] = useState({ label: "Home", addressLine: "", lat: "", lng: "" });

  const handleUseCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setForm((prev) => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
      toast.success("Location captured");
    });
  };

  const handleAdd = async () => {
    if (!form.addressLine || !form.lat || !form.lng) {
      toast.error("Please fill address and capture location");
      return;
    }
    const { data } = await addAddress(backendUrl, token, form);
    if (data.success) {
      toast.success("Address added");
      setForm({ label: "Home", addressLine: "", lat: "", lng: "" });
      loadAddresses();
    } else {
      toast.error(data.message);
    }
  };

  const handleRemove = async (id) => {
    const { data } = await removeAddress(backendUrl, token, id);
    if (data.success) loadAddresses();
  };

  return (
    <div className="mt-4 pb-24 max-w-lg">
      <h1 className="text-lg font-semibold text-gray-800 mb-4">Saved addresses</h1>

      <div className="flex flex-col gap-3">
        {addresses.map((a) => (
          <div key={a._id} className="border border-gray-200 rounded p-3 flex justify-between items-start">
            <div>
              <p className="text-sm font-medium">{a.label} {a.isDefault && <span className="text-xs text-green-700">(default)</span>}</p>
              <p className="text-xs text-gray-500">{a.addressLine}</p>
            </div>
            <button onClick={() => handleRemove(a._id)} className="text-xs text-red-500">Remove</button>
          </div>
        ))}
      </div>

      <div className="mt-6 border border-gray-200 rounded p-3 flex flex-col gap-2">
        <p className="text-sm font-semibold text-gray-700">Add new address</p>
        <input
          placeholder="Label (Home, Work...)"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Full address"
          value={form.addressLine}
          onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <button onClick={handleUseCurrentLocation} className="text-xs text-green-700 self-start">
          📍 Use my current location {form.lat ? "✓" : ""}
        </button>
        <button onClick={handleAdd} className="bg-green-600 text-white rounded px-4 py-2 text-sm">
          Save address
        </button>
      </div>
    </div>
  );
};

export default Addresses;
