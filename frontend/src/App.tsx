import { Routes, Route } from "react-router-dom";
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";
import Disclaimer from "./components/Layout/Disclaimer";
import HomePage from "./pages/HomePage";
import WalletCenterPage from "./pages/WalletCenterPage";
import SendMoneyPage from "./pages/SendMoneyPage";
import RiskAnalysisPage from "./pages/RiskAnalysisPage";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors">
      <Header />
      <Disclaimer />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/wallet" element={<WalletCenterPage />} />
          <Route path="/send" element={<SendMoneyPage />} />
          <Route path="/risk" element={<RiskAnalysisPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
