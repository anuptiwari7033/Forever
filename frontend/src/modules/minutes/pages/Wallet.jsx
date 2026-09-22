import { useContext } from "react";
import { MinutesContext } from "../context/MinutesContext";

const Wallet = () => {
  const { wallet } = useContext(MinutesContext);

  return (
    <div className="mt-4 pb-24 max-w-lg">
      <h1 className="text-lg font-semibold text-gray-800 mb-2">Velora Minutes Wallet</h1>
      <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
        <p className="text-xs text-gray-600">Balance</p>
        <p className="text-2xl font-semibold text-green-700">₹{wallet.balance}</p>
      </div>

      <h2 className="text-sm font-semibold text-gray-700 mb-2">Transactions</h2>
      <div className="flex flex-col gap-2">
        {(wallet.transactions || []).slice().reverse().map((t, i) => (
          <div key={i} className="flex justify-between text-sm border-b border-gray-100 pb-1">
            <span className="text-gray-600">{t.description || t.type}</span>
            <span className={t.type === "credit" ? "text-green-700" : "text-red-500"}>
              {t.type === "credit" ? "+" : "-"}₹{t.amount}
            </span>
          </div>
        ))}
        {(!wallet.transactions || wallet.transactions.length === 0) && (
          <p className="text-xs text-gray-400">No transactions yet.</p>
        )}
      </div>
    </div>
  );
};

export default Wallet;
