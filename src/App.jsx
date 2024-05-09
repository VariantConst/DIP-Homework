import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SharpeningFilter from "./pages/SharpeningFilter";
import MorphologicalTransform from "./pages/MorphologicalTransform";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sharpening" element={<SharpeningFilter />} />
        <Route path="/morphological" element={<MorphologicalTransform />} />
      </Routes>
    </Router>
  );
}

export default App;
