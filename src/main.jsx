import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

console.log('Main.jsx: Starting execution...');
try {
    const rootElement = document.getElementById("root");
    console.log('Main.jsx: Root element found:', rootElement);
    if (!rootElement) throw new Error("Root element not found");

    createRoot(rootElement).render(<App />);
    console.log('Main.jsx: Render called');
} catch (error) {
    console.error('Main.jsx Error:', error);
}
