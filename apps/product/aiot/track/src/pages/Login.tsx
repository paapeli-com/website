import { useState } from "react";
import { useNavigate } from "react-router-dom";
import paapeliLogo from "@paapeli/brand/logo.svg";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { PublicNav } from "@/components/layout/PublicNav";

/* Login intentionally mirrors the main Paapeli login (same public nav,  */
/* same card, same blue Sign-in accent, Google button and sign-up link)  */
/* so every product shares one unified sign-in experience.               */

const L = {
  en: {
    title: "Sign in to your account",
    email: "Email / Username",
    password: "Password",
    forgot: "Forgot password?",
    signin: "Sign in",
    or: "Or",
    google: "Continue with Google",
    noAccount: "Don't have an account? ",
    signup: "Sign up",
  },
  fa: {
    title: "ورود به حساب کاربری",
    email: "ایمیل / نام کاربری",
    password: "رمز عبور",
    forgot: "رمز عبور را فراموش کرده‌اید؟",
    signin: "ورود",
    or: "یا",
    google: "ادامه با Google",
    noAccount: "حساب ندارید؟ ",
    signup: "ثبت‌نام",
  },
  ar: {
    title: "تسجيل الدخول إلى حسابك",
    email: "البريد الإلكتروني / اسم المستخدم",
    password: "كلمة المرور",
    forgot: "هل نسيت كلمة المرور؟",
    signin: "تسجيل الدخول",
    or: "أو",
    google: "المتابعة مع Google",
    noAccount: "ليس لديك حساب؟ ",
    signup: "التسجيل",
  },
} as const;

export default function Login() {
  const { login } = useAuth();
  const { language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const tt = L[language];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email || "demo@paapeli.com", password);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]" dir={isRTL ? "rtl" : "ltr"}>
      <PublicNav />

      <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-lg border-0 bg-white p-8 shadow-lg">
            <div className="mb-8 text-center">
              <div className="mb-6 flex justify-center">
                <img src={paapeliLogo} alt="Paapeli" className="h-12 w-auto" />
              </div>
              <h1 className="text-2xl font-normal text-gray-800">{tt.title}</h1>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="email" className="text-sm font-normal text-gray-700">{tt.email}</label>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@host.com"
                  className="mt-1 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-[#4a90e2]"
                />
              </div>

              <div>
                <label htmlFor="password" className="text-sm font-normal text-gray-700">{tt.password}</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tt.password}
                  className="mt-1 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-[#4a90e2]"
                />
              </div>

              <div className="text-end">
                <button type="button" className="text-sm text-[#4a90e2] hover:underline">{tt.forgot}</button>
              </div>

              <button
                type="submit"
                className="h-10 w-full rounded-md bg-[#4a90e2] text-sm font-normal text-white transition-colors hover:bg-[#357abd]"
              >
                {tt.signin}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-300" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">{tt.or}</span></div>
              </div>

              <button
                type="button"
                onClick={submit}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white text-sm font-normal text-gray-700 transition-colors hover:bg-gray-50"
              >
                <svg className="size-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {tt.google}
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {tt.noAccount}
                  <button type="button" className="font-normal text-[#4a90e2] hover:underline">{tt.signup}</button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
