import { useGlobalProvider } from "../context/GlobalProvider";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../components/buttons/PrimaryButton";
import { useTranslation } from "react-i18next";

const Profile = () => {
  const { user, logout, isLoading } = useGlobalProvider();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-accent text-xl">{t("loading_profile", "Loading your profile...")}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-3xl font-bold text-accent mb-4">{t("account_required", "Account Required")}</h1>
        <p className="text-gray-300 mb-4">{t("must_be_signed_in", "You must be signed in to view your profile.")}</p>
        <PrimaryButton title={t("sign_in", "Sign In")} onClick={() => navigate("/sign-in")}/>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center py-10">
      <div className="p-6">
        <section className="bg-white dark:bg-secondary p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold text-accent mb-4" tabIndex={0} aria-label="Profile Page">
            👤 {t("my_account", "My Account")}
          </h1>
          <div className="text-base-content dark:text-white text-left mb-6">
            <div className="mb-2"><span className="font-semibold text-accent">{t("username_label", "Username:")}</span> {user.username}</div>
            <div className="mb-2"><span className="font-semibold text-accent">{t("email_label", "Email:")}</span> {user.email}</div>
            {user.phone_number && (
              <div className="mb-2"><span className="font-semibold text-accent">{t("phone_label", "Phone:")}</span> {user.phone_number}</div>
            )}
          </div>
          <PrimaryButton title={t("logout", "Logout")} onClick={logout} otherStyle="w-full" />
        </section>
      </div>
    </main>
  );
};

export default Profile;
