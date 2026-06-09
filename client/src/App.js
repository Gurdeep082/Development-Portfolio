import React, { useEffect, useState } from "react";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import LoadingScreen from "./components/LoadingScreen";

function App() {
  const [isAdmin, setIsAdmin] = useState(
    window.location.hash === "#admin"
  );

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onHashChange = () => {
      setIsAdmin(window.location.hash === "#admin");
    };

    window.addEventListener("hashchange", onHashChange);

    const isPWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (isPWA) {
      setLoading(true);

      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return isAdmin ? <Admin /> : <Home />;
}

export default App;