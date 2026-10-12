import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { TextScaleProvider } from "./context/TextScaleContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TextScaleProvider>
      <App />
    </TextScaleProvider>
  </StrictMode>
);
