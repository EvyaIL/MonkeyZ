import { useTranslation, Trans } from "react-i18next";
import { useEffect } from "react";
import { Helmet } from "react-helmet";

const AboutUs = () => {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t("about_us");
  }, [t]);

  return (
    <>
      <Helmet>
        <title>MonkeyZ - {t("about_us")}</title>
        <meta name="description" content={t("about_meta_description") || "Learn more about MonkeyZ, our mission, and our team."} />
        <meta property="og:title" content="MonkeyZ - {t('about_us')}" />
        <meta property="og:description" content={t("about_meta_description") || "Learn more about MonkeyZ, our mission, and our team."} />
      </Helmet>
      <main className="flex flex-col items-center justify-center min-h-screen text-center bg-primary">
        <section className="bg-secondary p-8 rounded-lg shadow-lg w-full max-w-2xl">
          <h1
            className="text-4xl font-bold text-accent mb-4 flex items-center gap-2"
            tabIndex={0}
            aria-label="About Us Page"
          >
            <span role="img" aria-label="Monkey">🐒</span> {t("about_us")}
          </h1>
          <p className="text-white text-lg mb-4">
            <Trans i18nKey="about_intro">
              Welcome to <span className="text-accent font-semibold">MonkeyZ</span>! We are passionate about providing the best digital products and customer experience.
            </Trans>
          </p>
          <div className="mb-4">
            <h2 className="text-accent text-xl font-semibold mb-2">{t("our_mission")}</h2>
            <p className="text-gray-300">{t("about_mission")}</p>
          </div>
          <div className="mb-4">
            <h2 className="text-accent text-xl font-semibold mb-2">{t("why_choose_us")}</h2>
            <ul className="text-gray-300 list-disc list-inside text-left mx-auto max-w-lg">
              <li>{t("about_why1")}</li>
              <li>{t("about_why2")}</li>
              <li>{t("about_why3")}</li>
              <li>{t("about_why4")}</li>
            </ul>
          </div>
          <div className="mb-4">
            <h2 className="text-accent text-xl font-semibold mb-2">{t("meet_the_team")}</h2>
            <p className="text-gray-300">{t("about_team")}</p>
          </div>
          <p className="text-gray-400 text-sm mt-6">
            &copy; {new Date().getFullYear()} MonkeyZ. All rights reserved.
          </p>
        </section>
      </main>
    </>
  );
};

export default AboutUs;
