import React from "react";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

function TermsOfService() {
  const { t } = useTranslation();
  
  useEffect(() => {
    document.title = t("terms_of_service");
  }, [t]);

  return (
    <>      <Helmet>
        <title>{`MonkeyZ - ${t("terms_of_service")}`}</title>
        <meta name="description" content={t("terms_meta_description") || "Terms of Service for MonkeyZ - Please read these terms carefully before using our services."} />
        <meta property="og:title" content={`MonkeyZ - ${t("terms_of_service")}`} />
        <meta property="og:description" content={t("terms_meta_description") || "Terms of Service for MonkeyZ - Please read these terms carefully before using our services."} />
      </Helmet>
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col items-center p-6">
        <h1 className="text-accent font-bold text-3xl mb-6" tabIndex={0}>
          {t("terms_of_service")}
        </h1>
        <div className="bg-white dark:bg-gray-800 border border-accent/30 dark:border-accent/30 rounded-lg shadow-lg p-4 md:p-6 w-full max-w-4xl backdrop-blur-sm">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-accent mb-4">1. {t("acceptance_of_terms")}</h2>            <p className="text-gray-900 dark:text-white">
              {t("terms_acceptance_text")}
            </p>
          </section>          <section className="mb-8">
            <h2 className="text-xl font-semibold text-accent mb-4">2. {t("user_accounts")}</h2>
            <p className="text-gray-900 dark:text-white mb-4">
              {t("terms_accounts_text")}
            </p>
            <ul className="list-disc list-inside text-gray-900 dark:text-white ml-4 space-y-2">
              <li>{t("terms_accounts_accuracy")}</li>
              <li>{t("terms_accounts_security")}</li>
              <li>{t("terms_accounts_responsibility")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-accent mb-4">3. {t("products_and_services")}</h2>
            <p className="text-gray-900 dark:text-white mb-4">
              {t("terms_products_text")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-accent mb-4">4. {t("payment_and_billing")}</h2>            <p className="text-gray-900 dark:text-white mb-4">
              {t("terms_payment_text")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-accent mb-4">5. {t("refund_policy")}</h2>
            <p className="text-gray-900 dark:text-white mb-4">
              {t("terms_refund_text")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-accent mb-4">6. {t("intellectual_property")}</h2>
            <p className="text-gray-900 dark:text-white mb-4">
              {t("terms_intellectual_property_text")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-accent mb-4">7. {t("prohibited_activities")}</h2>
            <p className="text-gray-900 dark:text-white mb-4">
              {t("terms_prohibited_text")}
            </p>
            <ul className="list-disc list-inside text-gray-900 dark:text-white ml-4 space-y-2">
              <li>{t("terms_prohibited_illegal")}</li>
              <li>{t("terms_prohibited_harm")}</li>
              <li>{t("terms_prohibited_impersonation")}</li>
              <li>{t("terms_prohibited_data")}</li>
            </ul>
          </section>          <section className="mb-8">
            <h2 className="text-xl font-semibold text-accent mb-4">8. {t("limitation_of_liability")}</h2>
            <p className="text-gray-900 dark:text-white mb-4">
              {t("terms_liability_text")}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-accent mb-4">9. {t("contact")}</h2>
            <p className="text-gray-900 dark:text-white">
              {t("terms_contact_text")}{" "}
              <a href="mailto:support@monkeyz.co.il" className="text-accent hover:underline">
                support@monkeyz.co.il
              </a>.
            </p>
          </section>
          
          <p className="text-gray-900 dark:text-white mt-8 text-sm">
            {t("last_updated")}: {t("may")} 19, 2025
          </p>
        </div>
      </div>
    </>
  );
};

export default TermsOfService;
