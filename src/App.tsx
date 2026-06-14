import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Home from "@/pages/Home";
import Members from "@/pages/Members";
import Teams from "@/pages/Teams";
import Schedule from "@/pages/Schedule";
import Judging from "@/pages/Judging";
import Resources from "@/pages/Resources";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/members" element={<Members />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/judging" element={<Judging />} />
          <Route path="/resources" element={<Resources />} />
        </Route>
      </Routes>
    </Router>
  );
}
