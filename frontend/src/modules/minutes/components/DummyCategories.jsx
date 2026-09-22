
import dummyCategoryGroups from "../data/dummyCategories";

// Rendered whenever we don't yet have a confirmed, in-range address —
// either because the customer hasn't picked one yet (tone="info", shown
// behind the address-selection modal) or because their confirmed address
// genuinely has no store nearby (tone="error", the original behaviour).
// Purely visual either way — not clickable, not backed by real data.
const DummyCategories = ({
  message = "Sorry, our service is not available at your given location yet.",
  tone = "error",
  ctaLabel,
  onCta,
}) => {
  const toneClasses =
    tone === "info"
      ? "bg-blue-50 border-blue-200 text-blue-700"
      : "bg-red-50 border-red-200 text-red-700";

  return (
    <div className="mt-4">
      <div className={`border text-sm rounded-lg px-4 py-3 mb-6 flex items-center justify-between gap-3 ${toneClasses}`}>
        <span>{message}</span>
        {ctaLabel && onCta && (
          <button
            onClick={onCta}
            className="shrink-0 bg-white border border-current rounded px-3 py-1.5 text-xs font-medium"
          >
            {ctaLabel}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-8 opacity-90">
        {dummyCategoryGroups.map(({ group, items }) => (
          <div key={group}>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{group}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {items.map((item) => (
                <div key={item.name} className="flex flex-col items-center gap-2 cursor-default">
                  <img
                    src={`/dummy-categories/${item.file}`}
                    alt={item.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/dummy-categories/placeholder.svg";
                    }}
                    className="w-full aspect-square object-cover rounded-xl bg-gray-100"
                  />
                  <p className="text-sm font-medium text-gray-700 text-center">{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DummyCategories;