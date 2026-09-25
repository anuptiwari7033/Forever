import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import RiderContextProvider from "./context/RiderContext.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <RiderContextProvider>
      <App />
    </RiderContextProvider>
  </BrowserRouter>
);
