import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import ProgressBar from "../../components/ProgressBar";
import { useSignup } from "../../context/useSignup";

const SignupStep1Page = ({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) => {
  const navigate = useNavigate();
  const { step1, setStep1 } = useSignup();
  const [form, setForm] = useState(step1);
  const [darkMode, setDarkMode] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false,
  );

  const toggleDark = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleNext = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setStep1(form);
      onNext();
    },
    [form, setStep1, onNext],
  );

  const handleGoToLogin = useCallback(() => navigate("/login"), [navigate]);

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display antialiased">
      <div className="fixed bottom-0 right-0 p-8 opacity-10 pointer-events-none hidden lg:block">
        <span className="material-symbols-outlined text-[240px] text-primary">
          hub
        </span>
      </div>

      <div className="layout-container flex h-full grow flex-col">
        <AppHeader />

        <main className="flex flex-1 justify-center py-6 sm:py-10 px-4">
          <div className="flex flex-col max-w-[520px] w-full flex-1 gap-6 sm:gap-8 animate-slide-up">
            <ProgressBar step={1} totalSteps={3} label="Account Creation" />

            <div className="flex flex-col gap-2">
              <h1 className="text-slate-900 dark:text-slate-100 text-2xl sm:text-3xl font-black leading-tight tracking-tight">
                Create your account
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-normal">
                Start your journey into AI leadership with a professional
                profile.
              </p>
            </div>

            <form onSubmit={handleNext} className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                {/* Full Name */}
                <label className="flex flex-col w-full">
                  <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold pb-2">
                    Full Name
                  </p>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                      person
                    </span>
                    <input
                      name="fullName"
                      type="text"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Alex Rivera"
                      required
                      className="flex w-full rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark focus:border-primary focus:ring-2 focus:ring-primary/20 h-14 pl-12 pr-4 text-slate-900 dark:text-slate-100 text-sm sm:text-base placeholder:text-slate-400 transition-all outline-none"
                    />
                  </div>
                </label>

                {/* Email */}
                <label className="flex flex-col w-full">
                  <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold pb-2">
                    Email Address
                  </p>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                      mail
                    </span>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="name@company.com"
                      required
                      className="flex w-full rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark focus:border-primary focus:ring-2 focus:ring-primary/20 h-14 pl-12 pr-4 text-slate-900 dark:text-slate-100 text-sm sm:text-base placeholder:text-slate-400 transition-all outline-none"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    We'll use this for your AI strategy reports.
                  </p>
                </label>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 cursor-pointer items-center justify-center rounded-xl h-14 border border-slate-200 dark:border-border-dark text-slate-600 dark:text-slate-400 text-base font-bold leading-normal transition-all hover:bg-slate-50 dark:hover:bg-card-dark"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex flex-[2] cursor-pointer items-center justify-center gap-2 rounded-xl h-14 bg-primary text-white text-base font-bold leading-normal tracking-tight hover:bg-primary/90 transition-all font-display"
                >
                  <span>Next: AI Preferences</span>
                  <span className="material-symbols-outlined text-[18px] translate-y-[1px]">
                    arrow_forward
                  </span>
                </button>
              </div>
            </form>

            <div className="flex justify-center border-t border-slate-200 dark:border-border-dark pt-6">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Already have an account?{" "}
                <button
                  onClick={handleGoToLogin}
                  className="text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer"
                >
                  Log in
                </button>
              </p>
            </div>

            <div className="flex justify-center gap-6 mt-8 text-slate-400 dark:text-slate-600">
              <span
                onClick={() =>
                  window.open(
                    "https://get-nexora-ai.netlify.app/use-cases",
                    "_blank",
                  )
                }
                className="material-symbols-outlined hover:text-primary cursor-pointer transition-colors"
                title="Use Cases"
              >
                help_outline
              </span>
              <span
                onClick={() =>
                  window.open("https://get-nexora-ai.netlify.app/", "_blank")
                }
                className="material-symbols-outlined hover:text-primary cursor-pointer transition-colors"
                title="Website"
              >
                language
              </span>
              <span
                onClick={toggleDark}
                className="material-symbols-outlined hover:text-primary cursor-pointer transition-colors"
                title="Toggle dark mode"
              >
                {darkMode ? "light_mode" : "dark_mode"}
              </span>
            </div>
          </div>
        </main>

        <footer className="py-8 px-6 text-center mt-auto">
          <p className="text-xs text-slate-400 dark:text-slate-600 uppercase tracking-widest px-4">
            © 2026 Nexora • Secure Intelligence Workspace
          </p>
        </footer>
      </div>
    </div>
  );
};

export default SignupStep1Page;
