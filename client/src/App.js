import React, { useEffect, useState } from "react";
import Admin from "./pages/Admin";
import Home from "./pages/Home";

function App() {
  const [isAdmin, setIsAdmin] = useState(
    window.location.hash === "#admin"
  );

  useEffect(() => {
    const onHashChange = () => {
      setIsAdmin(window.location.hash === "#admin");
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return isAdmin ? <Admin /> : <Home />;
}

export default App;