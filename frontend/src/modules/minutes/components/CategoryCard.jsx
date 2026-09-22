import { useNavigate } from "react-router-dom";

const CategoryCard = ({ category }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/minutes/category/${category.name}`)}
      className="cursor-pointer flex flex-col items-center gap-2"
    >
      <img
        src={category.image}
        alt={category.name}
        className="w-16 h-16 object-cover rounded-full border border-gray-200"
      />
      <p className="text-xs text-gray-700 text-center">{category.name}</p>
    </div>
  );
};

export default CategoryCard;
