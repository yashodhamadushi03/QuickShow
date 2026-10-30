import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SignUp } from "@clerk/clerk-react";
import { ArrowLeft } from "lucide-react";

const SignUpPage = () => {
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("redirect_url") || "/";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 py-16 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Return Link */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to QuickShow Home
        </Link>
        <span className="text-xs font-mono text-slate-400">QuickShow LK Sign Up</span>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-black text-rose-500 tracking-tight">
              QuickShow<span className="text-white text-base font-semibold ml-1">LK</span>
            </h1>
          </Link>
          <p className="text-slate-300 text-sm mt-1">
            Create an account to book cinema tickets and manage bookings
          </p>
        </div>

        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl={returnUrl}
          forceRedirectUrl={returnUrl}

          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-transparent shadow-none p-0 w-full",
              headerTitle: "text-white text-xl font-bold",
              headerSubtitle: "text-slate-400 text-xs",
              socialButtonsBlockButton:
                "bg-slate-950 border border-slate-800 hover:bg-slate-800 text-white font-semibold text-sm",
              socialButtonsBlockButtonText: "text-white text-xs",
              dividerLine: "bg-slate-800",
              dividerText: "text-slate-500 text-xs",
              formFieldLabel: "text-slate-300 text-xs uppercase font-bold",
              formFieldInput:
                "bg-slate-950 border border-slate-800 text-white rounded-xl focus:border-rose-500 text-sm",
              formButtonPrimary:
                "bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 py-3 text-sm",
              footerActionLink: "text-rose-400 hover:text-rose-300 font-bold",
              identityPreviewText: "text-slate-300",
              identityPreviewEditButtonIcon: "text-rose-400",
            },
          }}
        />
      </div>
    </div>
  );
};

export default SignUpPage;
