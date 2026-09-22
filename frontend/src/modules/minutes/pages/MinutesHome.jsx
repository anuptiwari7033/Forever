import { useContext, useEffect, useState } from "react";
import { fetchNearbyStores } from "../services/minutesApi";
import StoreCatalog from "../components/StoreCatalog";
import DummyCategories from "../components/DummyCategories";
import SelectAddressPage from "../components/SelectAddressPage";
import AddNewAddress from "../components/AddNewAddress";
import { MinutesContext } from "../context/MinutesContext";

const MinutesHome = () => {
  const {
    backendUrl,
    selectedAddress,
    addressConfirmed,
    confirmAddress,
    loadAddresses,
  } = useContext(MinutesContext);

  const [stores, setStores] = useState([]);
  const [storesLoaded, setStoresLoaded] = useState(false);
  const [mode, setMode] = useState("select"); // 'select' | 'addNew'
  const [deviceLocation, setDeviceLocation] = useState(null);

  const [modalOpen, setModalOpen] = useState(!addressConfirmed);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setDeviceLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const loadStoresFor = (address) => {
    setStoresLoaded(false);
    fetchNearbyStores(backendUrl, address.location.lat, address.location.lng)
      .then(({ data }) => {
        if (data.success) setStores(data.stores);
      })
      .catch(console.log)
      .finally(() => setStoresLoaded(true));
  };

  // Resumed session: an address was already confirmed earlier (persisted in
  // localStorage), so skip straight to loading that store's page — no modal.
  useEffect(() => {
    if (addressConfirmed && selectedAddress) {
      loadStoresFor(selectedAddress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddressConfirmed = (address) => {
    confirmAddress(address);
    setMode("select");
    setModalOpen(false);
    loadStoresFor(address);
  };

  const selectedStore = stores[0] || null;

  return (
    <div className="pb-24">
      {addressConfirmed && storesLoaded && selectedStore ? (
        <>
          <div className="flex items-center justify-between mt-4">
            {/* <h1 className="text-xl font-semibold text-gray-800">Velora Minutes</h1> */}
          </div>

          <div className="flex items-center justify-between mt-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <span className="text-gray-600 truncate">
              📍 Delivering to:{" "}
              <span className="font-medium text-gray-800">
                {selectedAddress?.addressLine || "your address"}
              </span>
            </span>
            <button
              onClick={() => setModalOpen(true)}
              className="text-green-700 font-medium shrink-0 ml-2"
            >
              Change
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Delivering from</p>
                <p className="font-medium text-gray-800">{selectedStore.name}</p>
              </div>
              {typeof selectedStore.distanceKm === "number" && (
                <span className="text-xs text-gray-500">
                  {selectedStore.distanceKm.toFixed(1)} km away
                </span>
              )}
            </div>

            <StoreCatalog storeId={selectedStore._id} storeName={selectedStore.name} />
          </div>
        </>
      ) : addressConfirmed && storesLoaded && !selectedStore ? (
        <DummyCategories
          tone="error"
          message="Sorry, our service is not available at your given location yet."
          ctaLabel="Try another address"
          onCta={() => setModalOpen(true)}
        />
      ) : addressConfirmed && !storesLoaded ? (
        <DummyCategories tone="info" message="Loading your store..." />
      ) : (
        <DummyCategories
          tone="info"
          message="Select a delivery address to see what's available near you."
          ctaLabel="Select address"
          onCta={() => setModalOpen(true)}
        />
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-sm"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="p-5 pt-14">
              {mode === "addNew" ? (
                <AddNewAddress
                  onSaved={(address) => {
                    loadAddresses();
                    handleAddressConfirmed(address);
                  }}
                  onCancel={() => setMode("select")}
                />
              ) : (
                <SelectAddressPage
                  currentLocation={deviceLocation}
                  onAddNew={() => setMode("addNew")}
                  onConfirmed={handleAddressConfirmed}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinutesHome;