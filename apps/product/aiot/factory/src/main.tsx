import { createRoot } from "react-dom/client";
import { setApiBaseUrl } from "@paapeli/api";
import App from "./App.tsx";
import { PAAPELI_API_BASE_URL } from "../config";
import "./index.css";

setApiBaseUrl(PAAPELI_API_BASE_URL);

createRoot(document.getElementById("root")!).render(<App />);
