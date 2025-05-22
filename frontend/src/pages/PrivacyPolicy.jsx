import React from "react";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Helmet } from "react-helmet";

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  
  useEffect(() => {
    document.title = t("privacy_policy");
  }, [t]);

  return (
    <>      <Helmet>
        <title>{`MonkeyZ - ${t("privacy_policy")}`}</title>
        <meta name="description" content={t("privacy_policy_meta_description") || "Privacy Policy for MonkeyZ - Learn how we collect, use and protect your personal information."} />
        <meta property="og:title" content={`MonkeyZ - ${t("privacy_policy")}`} />
        <meta property="og:description" content={t("privacy_policy_meta_description") || "Privacy Policy for MonkeyZ - Learn how we collect, use and protect your personal information."} />
      </Helmet>
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col items-center p-6">
        <h1 className="text-accent font-bold text-3xl mb-6" tabIndex={0}>
          {t("privacy_policy")}
        </h1>
        <div className="bg-white dark:bg-gray-800 border border-accent/30 dark:border-accent/30 rounded-lg shadow-lg p-4 md:p-6 w-full max-w-4xl backdrop-blur-sm">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-accent mb-4">1. {t("information_collection")}</h2>
            <p className="text-white mb-4">
              {t("privacy_info_collection_text")}
            </p>
            <ul className="list-disc list-inside text-white ml-4 space-y-2">
              <li>{t("privacy_personal_info")}</li>
              <li>{t("privacy_usage_info")}</li>
              <li>{t("privacy_transaction_info")}</li>
              <li>{t("privacy_technical_info")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-accent mb-4">2. {t("information_usage")}</h2>
            <p className="text-white mb-4">
              {t("privacy_usage_text")}
            </p>
            <ul className="list-disc list-inside text-white ml-4 space-y-2">
              <li>{t("privacy_usage_improve")}</li>
              <li>{t("privacy_usage_communicate")}</li>
              <li>{t("privacy_usage_process")}</li>
              <li>{t("privacy_usage_security")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-accent mb-4">3. {t("information_sharing")}</h2>
            <p className="text-white mb-4">
              {t("privacy_sharing_text")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-accent mb-4">4. {t("cookies_policy")}</h2>
            <p className="text-white mb-4">
              {t("privacy_cookies_text")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-accent mb-4">5. {t("data_security")}</h2>
            <p className="text-white mb-4">
              {t("privacy_security_text")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-accent mb-4">6. {t("user_rights")}</h2>
            <p className="text-white mb-4">
              {t("privacy_rights_text")}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-accent mb-4">7. {t("contact")}</h2>
            <p className="text-white">
              {t("privacy_contact_text")}{" "}
              <a href="mailto:support@monkeyz.co.il" className="text-accent hover:underline transition">
                support@monkeyz.co.il
              </a>.
            </p>
          </section>
          
          <p className="text-white mt-8 text-sm">
            {t("last_updated")}: {t("may")} 19, 2025
          </p>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
