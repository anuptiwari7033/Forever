import axios from "axios";
import { useEffect, useState } from "react";
import { backendUrl } from "../../App";
import { toast } from "react-toastify";

// Admin management for Velora Minutes stores.
// Each store now also gets its own login (email/password) for the separate
// Store dashboard app — set here when the store is created.
const MinutesStores = ({ token }) => {
  const [stores, setStores] = useState([]);
  const [image, setImage] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    contactNumber: "",
    address: "",
    lat: "",
    lng: "",
    prepTimeMinutes: 10,
    radiusKm: 5,
  });

  const fetchStores = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/minutes/store/admin/list", {
        headers: { token },
      });
      if (response.data.success) setStores(response.data.stores);
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const addStore = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (image) formData.append("image", image);

      const response = await axios.post(backendUrl + "/api/minutes/store/add", formData, {
        headers: { token },
      });

      if (response.data.success) {
        toast.success("Store added — share the email/password with the store owner to log into the Store app");
        setForm({
          name: "",
          email: "",
          password: "",
          contactNumber: "",
          address: "",
          lat: "",
          lng: "",
          prepTimeMinutes: 10,
          radiusKm: 5,
        });
        setImage(false);
        fetchStores();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const toggleStatus = async (storeId) => {
    const response = await axios.post(
      backendUrl + "/api/minutes/store/toggle-status",
      { storeId },
      { headers: { token } }
    );
    if (response.data.success) fetchStores();
  };

  const removeStore = async (storeId) => {
    const response = await axios.post(
      backendUrl + "/api/minutes/store/remove",
      { storeId },
      { headers: { token } }
    );
    if (response.data.success) {
      toast.success("Store removed");
      fetchStores();
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  return (
    <div>
      <p className="mb-2 font-medium">Add Velora Minutes Store</p>
      <form onSubmit={addStore} className="flex flex-col gap-3 max-w-md mb-8">
        <label className="cursor-pointer w-24">
          <img
            className="w-20 border"
            src={image ? URL.createObjectURL(image) : "https://placehold.co/80x80?text=Image"}
            alt=""
          />
          <input onChange={(e) => setImage(e.target.files[0])} type="file" hidden />
        </label>

        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Store name"
          className="px-3 py-2"
          required
        />

        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Store login (for the separate Store dashboard app)
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Store login email"
              className="px-3 py-2 flex-1"
              required
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Store login password (min 8 chars)"
              className="px-3 py-2 flex-1"
              required
            />
          </div>
        </div>

        <input
          value={form.contactNumber}
          onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
          placeholder="Store contact number"
          className="px-3 py-2"
        />

        <input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Address"
          className="px-3 py-2"
          required
        />

        <div className="flex gap-2">
          <input
            value={form.lat}
            onChange={(e) => setForm({ ...form, lat: e.target.value })}
            placeholder="Latitude"
            className="px-3 py-2 flex-1"
            required
          />
          <input
            value={form.lng}
            onChange={(e) => setForm({ ...form, lng: e.target.value })}
            placeholder="Longitude"
            className="px-3 py-2 flex-1"
            required
          />
        </div>

        <input
          type="number"
          value={form.prepTimeMinutes}
          onChange={(e) => setForm({ ...form, prepTimeMinutes: e.target.value })}
          placeholder="Prep time (minutes)"
          className="px-3 py-2"
        />

        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Delivery radius (km) — customers outside this range won't see this store
          </label>
          <input
            type="number"
            min="1"
            value={form.radiusKm}
            onChange={(e) => setForm({ ...form, radiusKm: e.target.value })}
            placeholder="Delivery radius (km)"
            className="px-3 py-2 w-full"
            required
          />
        </div>

        <button className="bg-black text-white py-2 px-4 w-32">ADD STORE</button>
      </form>

      <p className="mb-2 font-medium">All Stores</p>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] gap-2 py-2 px-2 text-xs font-semibold text-gray-500">
          <p></p>
          <p>Name / Login email</p>
          <p>Status</p>
          <p>Radius</p>
          <p></p>
          <p></p>
        </div>
        {stores.map((store) => (
          <div
            key={store._id}
            className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] items-center gap-2 py-2 px-2 border text-sm"
          >
            <img src={store.image} alt="" className="w-12 h-12 object-cover" />
            <div>
              <p>{store.name}</p>
              <p className="text-xs text-gray-400">{store.email}</p>
            </div>
            <p>{store.isOpen ? "Open" : "Closed"}</p>
            <p>{store.radiusKm ?? 5} km</p>
            <button onClick={() => toggleStatus(store._id)} className="text-blue-600">
              Toggle
            </button>
            <button onClick={() => removeStore(store._id)} className="text-red-500">
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MinutesStores;
