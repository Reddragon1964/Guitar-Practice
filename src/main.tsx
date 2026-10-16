import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { TextScaleProvider } from "./context/TextScaleContext.tsx";
import { ColorSchemeProvider } from "./context/ColorSchemeContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ColorSchemeProvider>
      <TextScaleProvider>
        <App />
      </TextScaleProvider>
    </ColorSchemeProvider>
  </StrictMode>
);
