import { useTranslation, Trans } from "react-i18next";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { addStructuredData, generateBreadcrumbSchema } from "../lib/seo-helper";

const AboutUs = () => {
  const { t } = useTranslation();

  useEffect(() => {
    // Generate organization schema
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://monkeyz.co.il/#organization",
      "name": "MonkeyZ",
      "url": "https://monkeyz.co.il",
      "logo": "https://monkeyz.co.il/logo192.png",
      "description": t("about_meta_description") || "MonkeyZ is a leading provider of digital products with a focus on cybersecurity and digital tools.",
      "foundingDate": "2022",
      "founders": [
        {
          "@type": "Person",
          "name": "MonkeyZ Team"
        }
      ],
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "IL"
      },
      "sameAs": [
        "https://facebook.com/monkeyz.co.il",
        "https://instagram.com/monkeyz.co.il",
        "https://twitter.com/monkeyz_co_il"
      ]
    };
    
    // Generate breadcrumb schema
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: t('home'), url: 'https://monkeyz.co.il/' },
      { name: t('about_us'), url: 'https://monkeyz.co.il/about' }
    ]);
    
    // Add both schemas
    addStructuredData([organizationSchema, breadcrumbSchema]);
  }, [t]);

  return (
    <>
      <Helmet>
        <title>MonkeyZ - {t("about_us")} | {t("about_meta_title", "Our Story and Mission")}</title>
        <meta name="description" content={t("about_meta_description") || "Learn more about MonkeyZ, our mission, values, and team. Discover how we're revolutionizing digital products for our global community."} />
        <meta name="keywords" content="MonkeyZ, digital products, cybersecurity company, about us, our team, company mission, company values" />
        <link rel="canonical" href="https://monkeyz.co.il/about" />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={`MonkeyZ - ${t("about_us")}`} />
        <meta property="og:description" content={t("about_meta_description") || "Learn more about MonkeyZ, our mission, values, and team. Discover how we're revolutionizing digital products for our global community."} />
        <meta property="og:image" content="https://monkeyz.co.il/logo512.png" />
        <meta property="og:url" content="https://monkeyz.co.il/about" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`MonkeyZ - ${t("about_us")}`} />
        <meta name="twitter:description" content={t("about_meta_description") || "Learn more about MonkeyZ, our mission, values, and team. Discover how we're revolutionizing digital products for our global community."} />
        <meta name="twitter:image" content="https://monkeyz.co.il/logo512.png" />
      </Helmet>
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        {/* Breadcrumb */}
        <nav className="w-full max-w-2xl mb-4 text-sm text-gray-500 dark:text-gray-400">
          <ol className="flex flex-wrap items-center space-x-1 rtl:space-x-reverse">
            <li><a href="/" className="hover:text-accent">{t('home')}</a></li>
            <li><span className="mx-1">›</span></li>
            <li className="text-accent font-medium">{t('about_us')}</li>
          </ol>
        </nav>
        <section className="bg-white dark:bg-gray-800 border border-accent/30 dark:border-accent/30 rounded-lg shadow-lg p-4 md:p-6 w-full max-w-2xl backdrop-blur-sm">
          <h1
            className="text-4xl font-bold text-accent mb-4 flex items-center gap-2"
            tabIndex={0}
            aria-label="About Us Page"
          >
            <span role="img" aria-label="Monkey">🐒</span> {t("about_us")}
          </h1>
          <p className="text-base-content dark:text-white text-lg mb-4">
            <Trans i18nKey="about_intro">
              Welcome to <span className="text-accent font-semibold">MonkeyZ</span>! We are passionate about providing the best digital products and customer experience.
            </Trans>
          </p>
          <div className="mb-4">
            <h2 className="text-accent text-xl font-semibold mb-2">{t("our_mission")}</h2>
            <p className="text-base-content dark:text-gray-300">{t("about_mission")}</p>
          </div>
          <div className="mb-4">
            <h2 className="text-accent text-xl font-semibold mb-2">{t("why_choose_us")}</h2>
            <ul className="text-base-content dark:text-gray-300 list-disc rtl:list-inside ltr:list-inside rtl:text-right ltr:text-left mx-auto max-w-lg">
              <li>{t("about_why1")}</li>
              <li>{t("about_why2")}</li>
              <li>{t("about_why3")}</li>
              <li>{t("about_why4")}</li>
            </ul>
          </div>
          <div className="mb-4">
            <h2 className="text-accent text-xl font-semibold mb-2">{t("meet_the_team")}</h2>
            <p className="text-base-content dark:text-gray-300">{t("about_team")}</p>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-6">
            &copy; {new Date().getFullYear()} MonkeyZ. All rights reserved.
          </p>
        </section>
      </main>
    </>
  );
};

export default AboutUs;
