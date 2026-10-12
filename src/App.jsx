import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./components/landing/Landing";
import Browse from "./components/marketplace/Browse";
import PlotDetail from "./components/marketplace/PlotDetail";
import Plot3DPage from "./components/map/Plot3DPage";
import DocumentHistory from "./components/marketplace/DocumentHistory";
import Dashboard from "./components/relator/Dashboard";
import LayoutUpload from "./components/relator/LayoutUpload";
import ConfirmExtraction from "./components/relator/ConfirmExtraction";
import UploadDocument from "./components/relator/UploadDocument";
import ConfirmTimeline from "./components/relator/ConfirmTimeline";
import ProfileSetup from "./components/relator/ProfileSetup";
import Listings from "./components/relator/Listings";
import PublicProfile from "./components/relator/PublicProfile";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import RequireRelatorAuth from "./components/shared/RequireRelatorAuth";
import ScrollToTop from "./components/shared/ScrollToTop";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* buyer */}
        <Route path="/" element={<Landing />} />
        <Route path="/plots" element={<Browse />} />
        <Route path="/plots/:layoutId" element={<PlotDetail />} />
        <Route path="/plots/:layoutId/history" element={<DocumentHistory />} />
        <Route path="/plots/:layoutId/3d" element={<Plot3DPage />} />
        <Route path="/agents/:relatorId" element={<PublicProfile />} />

        {/* auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* relator — gated behind a mock relator session */}
        <Route element={<RequireRelatorAuth />}>
          <Route path="/relator" element={<Dashboard />} />
          <Route path="/relator/upload" element={<LayoutUpload />} />
          <Route path="/relator/listings" element={<Listings />} />
          <Route path="/relator/layouts/:layoutId/confirm" element={<ConfirmExtraction />} />
          <Route path="/relator/documents/upload" element={<UploadDocument />} />
          <Route path="/relator/layouts/:layoutId/history" element={<ConfirmTimeline />} />
          <Route path="/relator/profile" element={<ProfileSetup />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
