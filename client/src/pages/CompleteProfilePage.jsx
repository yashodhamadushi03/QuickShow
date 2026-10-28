import React from "react";
import { useNavigate } from "react-router-dom";
import OnboardingModal from "../components/OnboardingModal";

const CompleteProfilePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative">
      <OnboardingModal
        isOpen={true}
        onClose={() => navigate("/", { replace: true })}
      />
    </div>
  );
};

export default CompleteProfilePage;
