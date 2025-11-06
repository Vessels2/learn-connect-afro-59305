import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeOfflineSync } from "./services/offlineSync";

// Initialize offline sync monitoring
initializeOfflineSync();

createRoot(document.getElementById("root")!).render(<App />);
