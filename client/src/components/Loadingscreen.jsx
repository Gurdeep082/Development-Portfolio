import "./Loadingscreen.css";
export default function LoadingScreen() {
  return (
        <div className="loading-screen">
        <div className="spinner"></div>

        <div className="loading-title">
            Gurdeep Portfolio
        </div>

        <div className="loading-text">
            Loading<span className="dots"></span>
        </div>
        </div>
  );
}