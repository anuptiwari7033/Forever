import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { RiderContext } from "../context/RiderContext";
import { updateRiderProfile } from "../services/api";

const Profile = () => {
  const { backendUrl, token, rider, loadProfile } = useContext(RiderContext);
  const [form, setForm] = useState({
    name: rider?.name || "",
    phone: rider?.phone || "",
    vehicleType: rider?.vehicleType || "bike",
    vehicleNumber: rider?.vehicleNumber || "",
  });
  const [image, setImage] = useState(null);

  if (!rider) return null;

  const handleSave = async () => {
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    if (image) formData.append("image", image);

    const { data } = await updateRiderProfile(backendUrl, token, formData);
    if (data.success) {
      toast.success("Profile updated");
      loadProfile();
    } else {
      toast.error(data.message);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-6 px-4">
      <h1 className="text-lg font-semibold text-gray-800 mb-4">Your profile</h1>

      <div className="flex flex-col gap-3">
        {rider.profileImage && (
          <img src={rider.profileImage} alt="profile" className="w-20 h-20 rounded-full object-cover" />
        )}
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="text-sm" />

        <label className="text-xs text-gray-500">Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="px-3 py-2 text-sm"
        />

        <label className="text-xs text-gray-500">Phone</label>
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="px-3 py-2 text-sm"
        />

        <label className="text-xs text-gray-500">Vehicle type</label>
        <select
          value={form.vehicleType}
          onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
          className="px-3 py-2 text-sm"
        >
          <option value="bike">Bike</option>
          <option value="scooter">Scooter</option>
          <option value="bicycle">Bicycle</option>
        </select>

        <label className="text-xs text-gray-500">Vehicle number</label>
        <input
          value={form.vehicleNumber}
          onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
          className="px-3 py-2 text-sm"
        />

        {rider.storeId && (
          <div className="text-sm text-gray-600 mt-2">
            Riding for: <span className="font-medium">{rider.storeId.name}</span>
            <p className="text-xs text-gray-400">{rider.storeId.address}</p>
          </div>
        )}

        <div className="text-sm text-gray-600 mt-2">
          Rating: ⭐ {rider.rating} · Total deliveries: {rider.totalDeliveries}
        </div>

        <button onClick={handleSave} className="bg-green-600 text-white rounded py-2 text-sm font-medium mt-2">
          Save changes
        </button>
      </div>
    </div>
  );
};

export default Profile;
