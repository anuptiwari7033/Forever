import { useContext, useEffect, useState } from "react";
import { StoreContext } from "../context/StoreContext";
import { getDailySales, getMonthlySales } from "../services/api";

const todayStr = () => new Date().toISOString().slice(0, 10);

const Sales = () => {
  const { backendUrl, token } = useContext(StoreContext);
  const [date, setDate] = useState(todayStr());
  const [daily, setDaily] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [loadingDaily, setLoadingDaily] = useState(false);

  const loadDaily = async (d) => {
    setLoadingDaily(true);
    try {
      const { data } = await getDailySales(backendUrl, token, d);
      if (data.success) setDaily(data);
    } finally {
      setLoadingDaily(false);
    }
  };

  const loadMonthly = async () => {
    const { data } = await getMonthlySales(backendUrl, token);
    if (data.success) setMonthly(data);
  };

  useEffect(() => {
    loadDaily(date);
    loadMonthly();
  }, []);

  const handleDateChange = (e) => {
    const d = e.target.value;
    setDate(d);
    loadDaily(d);
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 px-4 pb-16">
      <h1 className="text-lg font-semibold text-gray-800 mb-4">Sales</h1>

      {/* Single-day breakdown */}
      <section className="border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Sales on a specific day</h2>
          <input
            type="date"
            value={date}
            max={todayStr()}
            onChange={handleDateChange}
            className="px-2 py-1 text-sm"
          />
        </div>

        {loadingDaily ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : daily ? (
          <>
            <p className="text-2xl font-semibold text-green-700 mb-3">₹{daily.total}</p>

            {daily.products.length > 0 ? (
              <div className="flex flex-col gap-1 text-sm mb-3">
                <p className="font-medium text-gray-700">Products sold</p>
                {daily.products.map((p, i) => (
                  <div key={i} className="flex justify-between text-gray-600">
                    <span>
                      {p.name} × {p.quantity}
                    </span>
                    <span>₹{p.revenue}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-3">No sales on this day.</p>
            )}

            <p className="text-xs text-gray-400">{daily.orders.length} order(s) delivered</p>
          </>
        ) : null}
      </section>

      {/* Month-to-date totals */}
      <section className="border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          This month so far (1st to today)
        </h2>

        {monthly ? (
          <>
            <div className="flex flex-col gap-1 text-sm mb-3">
              {monthly.days.map((d) => (
                <div key={d.date} className="flex justify-between text-gray-600">
                  <span>{new Date(d.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                  <span>₹{d.total}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-semibold border-t border-gray-100 pt-2">
              <span>Total (1st – today)</span>
              <span className="text-green-700">₹{monthly.grandTotal}</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400">Loading...</p>
        )}
      </section>
    </div>
  );
};

export default Sales;
