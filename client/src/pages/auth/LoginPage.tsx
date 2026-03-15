import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import {
  apiBootConfig,
  apiGoogleLogin,
  apiGithubLogin,
  apiLockAccount,
  apiRequestLockOTP,
  apiRequestUnlockOTP,
  apiUnlockAccount,
} from "../../services/api";
import { useDispatch } from "react-redux";
import { setUser } from "../../store/userSlice";
import { message } from "antd";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

type FormMode = "login" | "lock" | "unlock";

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formMode, setFormMode] = useState<FormMode>("login");
  const [step, setStep] = useState<1 | 2>(1);

  const [userCode, setUserCode] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );

  const toggleDark = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }, []);

  const resetForm = useCallback((mode: FormMode) => {
    setFormMode(mode);
    setStep(1);
    setError(null);
    setTwoFactorCode("");
    setOtp("");
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
        if (formMode === "login") {
          const result = await apiBootConfig(
            userCode.trim(),
            step === 2 ? twoFactorCode.trim() : undefined,
          );

          if (result.twoFactorRequired) {
            setStep(2);
            setLoading(false);
            return;
          }

          if (result.sessionToken) {
            localStorage.setItem("2fa_session", result.sessionToken);
          }

          dispatch(
            setUser({ ...result, accessCode: userCode.trim().toUpperCase() }),
          );
          localStorage.setItem("accessCode", userCode.trim().toUpperCase());
          sessionStorage.setItem("chief_user", JSON.stringify(result));
          navigate("/dashboard");
        } else if (formMode === "lock") {
          if (step === 1) {
            const res = await apiRequestLockOTP(email.trim());
            message.success(res.message);
            setStep(2);
          } else {
            const res = await apiLockAccount(
              email.trim(),
              otp.trim(),
              twoFactorCode.trim(),
            );
            message.success(res.message);
            resetForm("login");
          }
        } else if (formMode === "unlock") {
          if (step === 1) {
            const res = await apiRequestUnlockOTP(email.trim());
            message.success(res.message);
            setStep(2);
          } else {
            const res = await apiUnlockAccount(
              email.trim(),
              otp.trim(),
              twoFactorCode.trim(),
            );
            message.success(res.message);
            resetForm("login");
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed");
      } finally {
        setLoading(false);
      }
    },
    [
      userCode,
      twoFactorCode,
      step,
      navigate,
      dispatch,
      formMode,
      email,
      otp,
      resetForm,
    ],
  );

  const handleTwoFactorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/[^0-9]/g, "");
      setTwoFactorCode(val);
      setError(null);
    },
    [],
  );
  
  const handleGoogleSuccess = useCallback(
    async (credentialResponse: CredentialResponse) => {
      if (!credentialResponse.credential) return;
      setLoading(true);
      setError(null);
      try {
        const result = await apiGoogleLogin(credentialResponse.credential);
        dispatch(
          setUser({ ...result, accessCode: result.accessCode }),
        );
        localStorage.setItem("accessCode", result.accessCode);
        sessionStorage.setItem("chief_user", JSON.stringify(result));
        navigate("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google login failed");
      } finally {
        setLoading(false);
      }
    },
    [navigate, dispatch],
  );

  const handleGithubLogin = useCallback(() => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = window.location.origin + "/login";
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      const loginWithGithub = async () => {
        setLoading(true);
        setError(null);
        try {
          const redirectUri = window.location.origin + "/login";
          const result = await apiGithubLogin(code, redirectUri);
          dispatch(setUser({ ...result, accessCode: result.accessCode }));
          localStorage.setItem("accessCode", result.accessCode);
          sessionStorage.setItem("chief_user", JSON.stringify(result));
          
          // Clear URL params
          window.history.replaceState({}, document.title, window.location.pathname);
          
          navigate("/dashboard");
        } catch (err) {
          setError(err instanceof Error ? err.message : "GitHub login failed");
        } finally {
          setLoading(false);
        }
      };
      loginWithGithub();
    }
  }, [navigate, dispatch]);

  const renderInputs = () => {
    if (formMode === "login") {
      return step === 1 ? (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
            User Code
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <span className="material-symbols-outlined text-[20px]">key</span>
            </div>
            <input
              type="text"
              value={userCode}
              onChange={(e) => {
                setUserCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="AI-XXXX-XXXX"
              className="block w-full pl-11 pr-4 py-4 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary outline-none font-mono tracking-widest uppercase"
              required
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
            Authenticator Code
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <span className="material-symbols-outlined text-[20px]">
                lock
              </span>
            </div>
            <input
              type="text"
              value={twoFactorCode}
              onChange={handleTwoFactorChange}
              placeholder="6-digit code"
              maxLength={6}
              className="block w-full pl-11 pr-4 py-4 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary text-center font-mono tracking-[0.5em] outline-none"
              required
              autoFocus
            />
          </div>
        </div>
      );
    }

    if (formMode === "lock") {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
              User Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <span className="material-symbols-outlined text-[20px]">
                  mail
                </span>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="email@example.com"
                className="block w-full pl-11 pr-4 py-4 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary outline-none"
                required
                disabled={step === 2}
              />
            </div>
          </div>
          {step === 2 && (
            <>
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Email OTP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">
                      chat_bubble
                    </span>
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="OTP from email"
                    className="block w-full pl-11 pr-4 py-4 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary text-center outline-none"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  2FA Code (If enabled)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">
                      security
                    </span>
                  </div>
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={handleTwoFactorChange}
                    placeholder="6-digit code"
                    maxLength={6}
                    className="block w-full pl-11 pr-4 py-4 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary text-center font-mono tracking-[0.5em] outline-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    if (formMode === "unlock") {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
              User Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <span className="material-symbols-outlined text-[20px]">
                  mail
                </span>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="email@example.com"
                className="block w-full pl-11 pr-4 py-4 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary outline-none"
                required
                disabled={step === 2}
              />
            </div>
          </div>
          {step === 2 && (
            <>
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Email OTP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">
                      chat_bubble
                    </span>
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="OTP from email"
                    className="block w-full pl-11 pr-4 py-4 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary text-center outline-none"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  2FA Code (If enabled)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">
                      security
                    </span>
                  </div>
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={handleTwoFactorChange}
                    placeholder="6-digit code"
                    maxLength={6}
                    className="block w-full pl-11 pr-4 py-4 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary text-center font-mono tracking-[0.5em] outline-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      );
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <div className="layout-container flex h-full grow flex-col">
        <AppHeader />

        <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-[420px] space-y-6 sm:space-y-8 animate-slide-up">
            <div className="text-center space-y-2">
              <h1 className="text-slate-900 dark:text-slate-100 text-2xl sm:text-3xl font-bold tracking-tight capitalize">
                {formMode === "login" ? "Welcome back" : `${formMode} Account`}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base px-2">
                {formMode === "login"
                  ? "Enter your unique access code to continue"
                  : formMode === "lock"
                    ? "Temporarily disable access to your account"
                    : "Verify your identity to regain access"}
              </p>
            </div>

            <div className="bg-white dark:bg-card-dark/50 p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm mx-2 sm:mx-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                {renderInputs()}

                {error && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mt-1">
                    <span className="material-symbols-outlined text-[16px]">
                      error
                    </span>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">
                      progress_activity
                    </span>
                  ) : (
                    <>
                      <span>
                        {formMode === "login"
                          ? step === 1
                            ? "Login to Dashboard"
                            : "Verify & Continue"
                          : formMode === "lock"
                            ? step === 1
                              ? "Lock Account"
                              : "Confirm Lock"
                            : step === 1
                              ? "Send Unlock OTP"
                              : "Unlock Account"}
                      </span>
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>

                {formMode === "login" && step === 1 && (
                  <>
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-border-dark"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-card-dark text-slate-500">Or continue with</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                      <div className="google-login-container">
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={() => setError("Google Login Failed")}
                          theme={darkMode ? "filled_black" : "outline"}
                          shape="pill"
                          size="large"
                          width="100%"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleGithubLogin}
                        className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-slate-900 hover:bg-black text-white rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                        </svg>
                        <span>Continue with GitHub</span>
                      </button>
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-3 pt-2 text-center">
                  {formMode === "login" ? (
                    <div className="flex justify-center items-center gap-3 text-[11px] sm:text-xs text-slate-400 border-t border-slate-100 dark:border-border-dark pt-6 mt-2">
                      <button
                        type="button"
                        onClick={() => navigate("/forgot-access-code")}
                        className="text-slate-500 hover:text-primary transition-colors underline-offset-4 hover:underline"
                      >
                        Forgot access code?
                      </button>
                      <span className="opacity-50">|</span>
                      <button
                        type="button"
                        onClick={() => resetForm("lock")}
                        className="font-bold hover:text-rose-500 transition-colors"
                      >
                        Lock Account
                      </button>
                      <span className="opacity-50">|</span>
                      <button
                        type="button"
                        onClick={() => resetForm("unlock")}
                        className="font-bold hover:text-emerald-500 transition-colors"
                      >
                        Unlock Account
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => resetForm("login")}
                      className="text-sm font-bold text-primary hover:underline"
                    >
                      Back to Login
                    </button>
                  )}
                </div>
              </form>

              {formMode === "login" && (
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-border-dark text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Don't have an access code?{" "}
                    <button
                      onClick={() => navigate("/signup")}
                      className="text-primary font-semibold hover:underline"
                    >
                      Request a code
                    </button>
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-6 text-slate-400 dark:text-slate-600">
              <span className="material-symbols-outlined hover:text-primary cursor-pointer transition-colors">
                help_outline
              </span>
              <span className="material-symbols-outlined hover:text-primary cursor-pointer transition-colors">
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

export default LoginPage;
