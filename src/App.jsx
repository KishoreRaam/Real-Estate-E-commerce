import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./components/landing/Landing";
import Browse from "./components/marketplace/Browse";
import PlotDetail from "./components/marketplace/PlotDetail";
import Dashboard from "./components/relator/Dashboard";
import LayoutUpload from "./components/relator/LayoutUpload";
import ConfirmExtraction from "./components/relator/ConfirmExtraction";
import ProfileSetup from "./components/relator/ProfileSetup";
import Listings from "./components/relator/Listings";
import PublicProfile from "./components/relator/PublicProfile";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* buyer */}
        <Route path="/" element={<Landing />} />
        <Route path="/plots" element={<Browse />} />
        <Route path="/plots/:layoutId" element={<PlotDetail />} />
        <Route path="/agents/:relatorId" element={<PublicProfile />} />

        {/* relator */}
        <Route path="/relator" element={<Dashboard />} />
        <Route path="/relator/upload" element={<LayoutUpload />} />
        <Route path="/relator/listings" element={<Listings />} />
        <Route path="/relator/layouts/:layoutId/confirm" element={<ConfirmExtraction />} />
        <Route path="/relator/profile" element={<ProfileSetup />} />
      </Routes>
    </BrowserRouter>
  );
}
