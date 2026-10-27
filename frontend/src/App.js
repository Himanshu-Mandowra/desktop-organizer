import { useState } from "react";
import CanvasBoard from "./components/CanvasBoard";
import LandingPage from "./components/LandingPage";

function App() {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#09090b]">
      {showEditor ? (
        <CanvasBoard onGoHome={() => setShowEditor(false)} />
      ) : (
        <LandingPage onGetStarted={() => setShowEditor(true)} />
      )}
    </div>
  );
}

export default App;
