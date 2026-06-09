import React from "react";
import Admin from "./pages/Admin";
import Home from "./pages/Home";

function App() {
  return window.location.pathname.startsWith("/admin") ? <Admin /> : <Home />;
}

export default App;
