import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchStore } from "../services/minutesApi";
import StoreCatalog from "../components/StoreCatalog";
import { useContext } from "react";
import { MinutesContext } from "../context/MinutesContext";

const StoreProducts = () => {
  const { storeId } = useParams();
  const { backendUrl } = useContext(MinutesContext);
  const [store, setStore] = useState(null);

  useEffect(() => {
    fetchStore(backendUrl, storeId).then(({ data }) => data.success && setStore(data.store));
  }, [storeId]);

  return (
    <div className="pb-24">
      {store && (
        <div className="mt-4">
          <h1 className="text-lg font-semibold text-gray-800">{store.name}</h1>
          <p className="text-xs text-gray-500">{store.address}</p>
        </div>
      )}

      <StoreCatalog storeId={storeId} storeName={store?.name} />
    </div>
  );
};

export default StoreProducts;
