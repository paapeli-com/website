import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { Label } from "@/features/factory/components/ui/label";
import { useToast } from "@/features/factory/hooks/use-toast";
import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { authService } from "@paapeli/api";
import paapeliLogo from "@/features/factory/assets/paapeli-logo.svg";

/* Sign-in on this product goes through the gateway (authService.login), so the
   reset does too — the Cognito pool this page used to call is no longer the
   account store behind the login it links back to. */
const ForgotPassword = () => {
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmNewPassword, setConfirmNewPassword] = React.useState("");
  const [step, setStep] = React.useState<"email" | "reset">("email");
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const errorTitle = language === 'en' ? 'Error' : language === 'ar' ? 'خطأ' : 'خطا';
  const apiMessage = (error: any) => error?.response?.data?.message as string | undefined;

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.requestPasswordReset({ email });
      setStep("reset");
      /* The gateway answers identically whether the account exists, is
         inactive, or the request was throttled — so this says only what holds
         in every one of those cases. */
      toast({
        title: language === 'en' ? 'Code sent' : language === 'ar' ? 'تم إرسال الرمز' : 'کد ارسال شد',
        description: language === 'en'
          ? 'If that account exists, a reset code is on its way by email.'
          : language === 'ar'
          ? 'إذا كان الحساب موجوداً، فسيصلك رمز إعادة التعيين عبر البريد الإلكتروني.'
          : 'اگر این حساب وجود داشته باشد، کد بازیابی به ایمیل شما ارسال می‌شود.',
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: errorTitle,
        description: apiMessage(error) || (language === 'en'
          ? 'That email address doesn\'t look right.'
          : language === 'ar'
          ? 'يبدو أن البريد الإلكتروني غير صحيح.'
          : 'به نظر می‌رسد این ایمیل درست نیست.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      toast({
        variant: "destructive",
        title: errorTitle,
        description: language === 'en'
          ? "Passwords don't match."
          : language === 'ar'
          ? 'كلمتا المرور غير متطابقتين.'
          : 'رمزهای عبور مطابقت ندارند.',
      });
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword({
        code,
        password: newPassword,
        passwordConfirm: confirmNewPassword,
      });
      toast({
        title: language === 'en' ? 'Success!' : language === 'ar' ? 'نجح!' : 'موفق!',
        description: language === 'en'
          ? 'Password reset successful. You can now sign in with your new password.'
          : language === 'ar'
          ? 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.'
          : 'بازیابی رمز عبور موفقیت‌آمیز بود. اکنون می‌توانید با رمز عبور جدید وارد شوید.',
      });
      navigate("/login");
    } catch (error: any) {
      /* Submitting a code spends it even when the update fails, so every error
         here ends the same way: that code is gone, ask for another. */
      const reason = error?.response?.status === 404
        ? (language === 'en'
            ? 'That code is invalid or has already been used.'
            : language === 'ar'
            ? 'هذا الرمز غير صالح أو تم استخدامه بالفعل.'
            : 'این کد نامعتبر است یا قبلاً استفاده شده است.')
        : apiMessage(error) || (language === 'en'
            ? 'Password reset failed.'
            : language === 'ar'
            ? 'فشلت إعادة تعيين كلمة المرور.'
            : 'بازیابی رمز عبور ناموفق بود.');
      const retry = language === 'en'
        ? 'Request a new code to try again.'
        : language === 'ar'
        ? 'اطلب رمزاً جديداً للمحاولة مرة أخرى.'
        : 'برای تلاش دوباره کد جدیدی درخواست کنید.';
      toast({
        variant: "destructive",
        title: errorTitle,
        description: `${reason} ${retry}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f5f5]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
            <img
              src={paapeliLogo}
              alt="Paapeli"
              className="h-12 mx-auto mb-6"
            />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">
            {language === 'en' ? 'Reset Password' : language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'بازیابی رمز عبور'}
          </h1>
          <p className="text-gray-600">
            {step === "email" 
              ? (language === 'en' 
                  ? 'Enter your email to receive a password reset code'
                  : language === 'ar'
                  ? 'أدخل بريدك الإلكتروني لتلقي رمز إعادة تعيين كلمة المرور'
                  : 'ایمیل خود را وارد کنید تا کد بازیابی دریافت کنید')
              : (language === 'en'
                  ? 'Enter the code and your new password'
                  : language === 'ar'
                  ? 'أدخل الرمز وكلمة المرور الجديدة'
                  : 'کد و رمز عبور جدید را وارد کنید')
            }
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg border-0">
          {step === "email" ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-normal">
                  {language === 'en' ? 'Email' : language === 'ar' ? 'البريد الإلكتروني' : 'ایمیل'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-white border-gray-300"
                />
              </div>
              <Button type="submit" className="w-full bg-[#4a90e2] hover:bg-[#357abd] text-white font-normal" disabled={isLoading}>
                {isLoading 
                  ? (language === 'en' ? 'Please wait...' : language === 'ar' ? 'يرجى الانتظار...' : 'لطفاً صبر کنید...')
                  : (language === 'en' ? 'Send Reset Code' : language === 'ar' ? 'إرسال رمز إعادة التعيين' : 'ارسال کد بازیابی')
                }
              </Button>
              <div className="text-center">
                <Link to="/login" className="text-sm text-[#4a90e2] hover:underline">
                  {language === 'en' ? 'Back to login' : language === 'ar' ? 'العودة لتسجيل الدخول' : 'بازگشت به ورود'}
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-gray-700 font-normal">
                  {language === 'en' ? 'Verification Code' : language === 'ar' ? 'رمز التحقق' : 'کد تأیید'}
                </Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-white border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-700 font-normal">
                  {language === 'en' ? 'New Password' : language === 'ar' ? 'كلمة المرور الجديدة' : 'رمز عبور جدید'}
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-white border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword" className="text-gray-700 font-normal">
                  {language === 'en' ? 'Confirm New Password' : language === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'تأیید رمز عبور جدید'}
                </Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-white border-gray-300"
                />
              </div>
              <Button type="submit" className="w-full bg-[#4a90e2] hover:bg-[#357abd] text-white font-normal" disabled={isLoading}>
                {isLoading 
                  ? (language === 'en' ? 'Please wait...' : language === 'ar' ? 'يرجى الانتظار...' : 'لطفاً صبر کنید...')
                  : (language === 'en' ? 'Reset Password' : language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'بازیابی رمز عبور')
                }
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-sm text-[#4a90e2] hover:underline"
                  disabled={isLoading}
                >
                  {language === 'en' ? 'Back to email' : language === 'ar' ? 'العودة إلى البريد الإلكتروني' : 'بازگشت به ایمیل'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
