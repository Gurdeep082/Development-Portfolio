import React from "react";
import Admin from "./pages/Admin";
import Home from "./pages/Home";

function App() {
  return window.location.hash === "#admin"
    ? <Admin />
    : <Home />;
}

export default App;