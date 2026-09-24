// import axios from "axios";
// import { useEffect, useState } from "react";
// import { backendUrl } from "../../App";
// import { toast } from "react-toastify";

// const statusColor = {
//   online: "text-green-600",
//   offline: "text-gray-400",
//   on_delivery: "text-amber-600",
// };

// const Riders = ({ token }) => {
//   const [riders, setRiders] = useState([]);

//   const fetchRiders = async () => {
//     try {
//       const response = await axios.get(backendUrl + "/api/rider/admin/list", {
//         headers: { token },
//       });
//       if (response.data.success) setRiders(response.data.riders);
//     } catch (error) {
//       console.log(error);
//       toast.error(error.message);
//     }
//   };

//   useEffect(() => {
//     fetchRiders();
//   }, []);

//   return (
//     <div>
//       <p className="mb-2 font-medium">Riders</p>
//       <div className="flex flex-col gap-2">
//         <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr] gap-2 py-2 px-2 text-xs font-semibold text-gray-500">
//           <p>Name</p>
//           <p>Store</p>
//           <p>Phone</p>
//           <p>Vehicle</p>
//           <p>Status</p>
//           <p>Deliveries</p>
//         </div>
//         {riders.map((r) => (
//           <div key={r._id} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr] gap-2 py-2 px-2 border text-sm items-center">
//             <p>{r.name}</p>
//             <p>{r.storeId?.name || "—"}</p>
//             <p>{r.phone}</p>
//             <p>{r.vehicleType}</p>
//             <p className={statusColor[r.status]}>{r.status.replaceAll("_", " ")}</p>
//             <p>{r.totalDeliveries}</p>
//           </div>
//         ))}
//         {riders.length === 0 && <p className="text-sm text-gray-400">No riders yet.</p>}
//       </div>
//     </div>
//   );
// };

// export default Riders;
import axios from "axios";
import { useEffect, useState } from "react";
import { backendUrl } from "../../App";
import { toast } from "react-toastify";

const statusColor = {
  online: "text-green-600",
  offline: "text-gray-400",
  on_delivery: "text-amber-600",
};

const Riders = ({ token }) => {
  const [riders, setRiders] = useState([]);
  const [stores, setStores] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    vehicleType: "bike",
    vehicleNumber: "",
    storeId: "",
  });
  const [adding, setAdding] = useState(false);

  const fetchRiders = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/rider/admin/list", {
        headers: { token },
      });
      if (response.data.success) setRiders(response.data.riders);
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

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

  const addRider = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const response = await axios.post(backendUrl + "/api/rider/admin/add", form, {
        headers: { token },
      });
      if (response.data.success) {
        toast.success("Rider added — share the email/password with them to log into the Rider app");
        setForm({
          name: "",
          email: "",
          password: "",
          phone: "",
          vehicleType: "bike",
          vehicleNumber: "",
          storeId: "",
        });
        fetchRiders();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setAdding(false);
    }
  };

  const removeRider = async (riderId) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/rider/admin/remove",
        { riderId },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Rider removed");
        fetchRiders();
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchRiders();
    fetchStores();
  }, []);

  return (
    <div>
      <p className="mb-2 font-medium">Add Rider</p>
      <form onSubmit={addRider} className="flex flex-col gap-3 max-w-md mb-8">
        <input
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="px-3 py-2"
          required
        />

        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Login email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="px-3 py-2 flex-1"
            required
          />
          <input
            type="password"
            placeholder="Login password (min 8 chars)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="px-3 py-2 flex-1"
            required
          />
        </div>

        <input
          placeholder="Phone number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="px-3 py-2"
          required
        />

        <select
          value={form.storeId}
          onChange={(e) => setForm({ ...form, storeId: e.target.value })}
          className="px-3 py-2"
          required
        >
          <option value="">Which store does this rider ride for?</option>
          {stores.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <select
            value={form.vehicleType}
            onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
            className="px-3 py-2 flex-1"
          >
            <option value="bike">Bike</option>
            <option value="scooter">Scooter</option>
            <option value="bicycle">Bicycle</option>
          </select>
          <input
            placeholder="Vehicle number"
            value={form.vehicleNumber}
            onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
            className="px-3 py-2 flex-1"
          />
        </div>

        <button disabled={adding} className="bg-black text-white py-2 px-4 w-32 disabled:opacity-60">
          {adding ? "Adding..." : "ADD RIDER"}
        </button>
      </form>

      <p className="mb-2 font-medium">All Riders</p>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 py-2 px-2 text-xs font-semibold text-gray-500">
          <p>Name</p>
          <p>Store</p>
          <p>Phone</p>
          <p>Vehicle</p>
          <p>Status</p>
          <p>Deliveries</p>
          <p></p>
        </div>
        {riders.map((r) => (
          <div
            key={r._id}
            className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 py-2 px-2 border text-sm items-center"
          >
            <p>{r.name}</p>
            <p>{r.storeId?.name || "—"}</p>
            <p>{r.phone}</p>
            <p>{r.vehicleType}</p>
            <p className={statusColor[r.status]}>{r.status.replaceAll("_", " ")}</p>
            <p>{r.totalDeliveries}</p>
            <button onClick={() => removeRider(r._id)} className="text-red-500">
              Remove
            </button>
          </div>
        ))}
        {riders.length === 0 && <p className="text-sm text-gray-400">No riders yet.</p>}
      </div>
    </div>
  );
};

export default Riders;