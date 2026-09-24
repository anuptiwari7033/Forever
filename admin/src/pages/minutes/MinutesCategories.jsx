import axios from "axios";
import { useEffect, useState } from "react";
import { backendUrl } from "../../App";
import { toast } from "react-toastify";

// Admin management for Velora Minutes categories. `group` is the section
// header (e.g. "Grocery & Kitchen") and `name` is the actual tile shown
// under it (e.g. "Vegetables & Fruits") — this name must match the
// `category` value used on products for the store's category tiles to
// pick them up.
const MinutesCategories = ({ token }) => {
  const [categories, setCategories] = useState([]);
  const [image, setImage] = useState(false);
  const [name, setName] = useState("");
  const [group, setGroup] = useState("");

  const fetchCategories = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/minutes/category/list");
      if (response.data.success) setCategories(response.data.categories);
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("group", group);
      if (image) formData.append("image", image);

      const response = await axios.post(backendUrl + "/api/minutes/category/add", formData, {
        headers: { token },
      });

      if (response.data.success) {
        toast.success("Category added");
        setName("");
        setGroup("");
        setImage(false);
        fetchCategories();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const removeCategory = async (categoryId) => {
    const response = await axios.post(
      backendUrl + "/api/minutes/category/remove",
      { categoryId },
      { headers: { token } }
    );
    if (response.data.success) {
      toast.success("Category removed");
      fetchCategories();
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div>
      <p className="mb-2 font-medium">Add Category</p>
      <form onSubmit={addCategory} className="flex flex-col gap-3 max-w-md mb-8">
        <label className="cursor-pointer w-24">
          <img
            className="w-20 border"
            src={image ? URL.createObjectURL(image) : "https://placehold.co/80x80?text=Image"}
            alt=""
          />
          <input onChange={(e) => setImage(e.target.files[0])} type="file" hidden />
        </label>

        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Section header (e.g. "Grocery & Kitchen", "Snacks & Drinks")
          </label>
          <input
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="Section header"
            className="px-3 py-2 w-full"
            required
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Category name (e.g. "Vegetables & Fruits") — must exactly match the
            category you type on products in Minutes Products
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="px-3 py-2 w-full"
            required
          />
        </div>

        <button className="bg-black text-white py-2 px-4 w-32">ADD CATEGORY</button>
      </form>

      <p className="mb-2 font-medium">All Categories</p>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[1fr_2fr_2fr_1fr] gap-2 py-2 px-2 text-xs font-semibold text-gray-500">
          <p></p>
          <p>Section</p>
          <p>Category name</p>
          <p></p>
        </div>
        {categories.map((cat) => (
          <div
            key={cat._id}
            className="grid grid-cols-[1fr_2fr_2fr_1fr] items-center gap-2 py-2 px-2 border text-sm"
          >
            <img src={cat.image} alt="" className="w-12 h-12 object-cover" />
            <p>{cat.group}</p>
            <p>{cat.name}</p>
            <button onClick={() => removeCategory(cat._id)} className="text-red-500">
              Remove
            </button>
          </div>
        ))}
        {categories.length === 0 && <p className="text-sm text-gray-400">No categories yet.</p>}
      </div>
    </div>
  );
};

export default MinutesCategories;
