// Shown ONLY when no real store is in range for the customer's location.
// These are static/dummy — not backed by the database — purely so the
// page doesn't look empty and matches the reference design. Every image
// below is loaded from /dummy-categories/<file>.png in the frontend's
// public folder. Drop the matching image file there (same name) and it
// will show up automatically — no code change needed.
//
// Example: to set the image for "Vegetables & Fruits", save your image as
//   frontend/public/dummy-categories/vegetables-fruits.png
//
// If a file is missing, a generic placeholder icon is shown instead
// (see the onError fallback in DummyCategories.jsx).

const dummyCategoryGroups = [
  {
    group: "Grocery & Kitchen",
    items: [
      { name: "Vegetables & Fruits", file: "vegetables-fruits.png" },
      { name: "Atta, Rice & Dal", file: "atta-rice-dal.png" },
      { name: "Oil, Ghee & Masala", file: "oil-ghee-masala.png" },
      { name: "Dairy, Bread & Eggs", file: "dairy-bread-eggs.png" },
      { name: "Bakery & Biscuits", file: "bakery-biscuits.png" },
      { name: "Dry Fruits & Cereals", file: "dry-fruits-cereals.png" },
      { name: "Chicken, Meat & Fish", file: "chicken-meat-fish.png" },
      { name: "Kitchenware & Appliances", file: "kitchenware-appliances.png" },
    ],
  },
  {
    group: "Snacks & Drinks",
    items: [
      { name: "Chips & Namkeen", file: "chips-namkeen.png" },
      { name: "Sweets & Chocolates", file: "sweets-chocolates.png" },
      { name: "Drinks & Juices", file: "drinks-juices.png" },
      { name: "Tea, Coffee & Milk Drinks", file: "tea-coffee-milk-drinks.png" },
      { name: "Instant Food", file: "instant-food.png" },
      { name: "Sauces & Spreads", file: "sauces-spreads.png" },
      { name: "Mouth Fresheners", file: "mouth-fresheners.png" },
      { name: "Ice Cream & Frozen Desserts", file: "ice-cream-frozen-desserts.png" },
    ],
  },
  {
    group: "Beauty & Personal Care",
    items: [
      { name: "Bath & Body", file: "bath-body.png" },
      { name: "Hair", file: "hair.png" },
      { name: "Skin & Face", file: "skin-face.png" },
      { name: "Beauty & Cosmetics", file: "beauty-cosmetics.png" },
      { name: "Feminine Hygiene", file: "feminine-hygiene.png" },
      { name: "Baby Care", file: "baby-care.png" },
      { name: "Health & Pharma", file: "health-pharma.png" },
      { name: "Sexual Wellness", file: "sexual-wellness.png" },
    ],
  },
  {
    group: "Household Essentials",
    items: [
      { name: "Home & Lifestyle", file: "home-lifestyle.png" },
      { name: "Cleaners & Repellents", file: "cleaners-repellents.png" },
      { name: "Electronics", file: "electronics.png" },
      { name: "Stationery & Games", file: "stationery-games.png" },
    ],
  },
];

export default dummyCategoryGroups;
