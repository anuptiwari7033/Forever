import axios from "axios";
import { useEffect, useState } from "react";
import { backendUrl } from "../../App";
import { toast } from "react-toastify";

const MinutesProducts = ({ token }) => {
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [image, setImage] = useState(false);
  const [form, setForm] = useState({
    storeId: "",
    name: "",
    description: "",
    price: "",
    mrp: "",
    unit: "",
    category: "",
    stock: 100,
  });

  const fetchStores = async () => {
    const response = await axios.get(backendUrl + "/api/minutes/store/admin/list", {
      headers: { token },
    });
    if (response.data.success) setStores(response.data.stores);
  };

  // Categories come from the Categories page (admin-created) — the product
  // form picks from this list instead of free text, so a product's
  // category can never fail to match a category tile due to a typo.
  const fetchCategories = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/minutes/category/list");
      if (response.data.success) setCategories(response.data.categories);
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/minutes/product/admin/list", {
        headers: { token },
      });
      if (response.data.success) setProducts(response.data.products);
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();

    if (categories.length === 0) {
      toast.error("Please add at least one category first, on the Categories page");
      return;
    }

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (image) formData.append("image", image);

      const response = await axios.post(backendUrl + "/api/minutes/product/add", formData, {
        headers: { token },
      });

      if (response.data.success) {
        toast.success("Product added");
        setForm({
          storeId: "",
          name: "",
          description: "",
          price: "",
          mrp: "",
          unit: "",
          category: "",
          stock: 100,
        });
        setImage(false);
        fetchProducts();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const removeProduct = async (productId) => {
    const response = await axios.post(
      backendUrl + "/api/minutes/product/remove",
      { productId },
      { headers: { token } }
    );
    if (response.data.success) {
      toast.success("Product removed");
      fetchProducts();
    }
  };

  useEffect(() => {
    fetchStores();
    fetchCategories();
    fetchProducts();
  }, []);

  return (
    <div>
      <p className="mb-2 font-medium">Add Velora Minutes Product</p>

      {categories.length === 0 && (
        <p className="text-xs text-amber-600 mb-3">
          No categories exist yet — go to the <b>Categories</b> page first and add at least
          one (e.g. "Vegetables & Fruits" under "Grocery & Kitchen") before adding products.
        </p>
      )}

      <form onSubmit={addProduct} className="flex flex-col gap-3 max-w-md mb-8">
        <label className="cursor-pointer w-24">
          <img
            className="w-20 border"
            src={image ? URL.createObjectURL(image) : "https://placehold.co/80x80?text=Image"}
            alt=""
          />
          <input onChange={(e) => setImage(e.target.files[0])} type="file" hidden />
        </label>

        <select
          value={form.storeId}
          onChange={(e) => setForm({ ...form, storeId: e.target.value })}
          className="px-3 py-2"
          required
        >
          <option value="">Select store</option>
          {stores.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Product name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="px-3 py-2"
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="px-3 py-2"
        />
        <div className="flex gap-2">
          <input
            placeholder="Price"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="px-3 py-2 flex-1"
            required
          />
          <input
            placeholder="MRP"
            type="number"
            value={form.mrp}
            onChange={(e) => setForm({ ...form, mrp: e.target.value })}
            className="px-3 py-2 flex-1"
            required
          />
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Unit (e.g. 500 g)"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className="px-3 py-2 flex-1"
            required
          />

          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="px-3 py-2 flex-1"
            required
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>
                {c.group} → {c.name}
              </option>
            ))}
          </select>
        </div>
        <input
          placeholder="Stock"
          type="number"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
          className="px-3 py-2"
        />

        <button className="bg-black text-white py-2 px-4 w-32">ADD PRODUCT</button>
      </form>

      <p className="mb-2 font-medium">All Products</p>
      <div className="flex flex-col gap-2">
        {products.map((p) => (
          <div
            key={p._id}
            className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr] items-center gap-2 py-2 px-2 border text-sm"
          >
            <img src={p.image} alt="" className="w-12 h-12 object-cover" />
            <p>{p.name}</p>
            <p>₹{p.price}</p>
            <p>{p.category}</p>
            <button onClick={() => removeProduct(p._id)} className="text-red-500">
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MinutesProducts;
