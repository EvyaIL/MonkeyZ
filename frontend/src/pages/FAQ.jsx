import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { addStructuredData, generateFAQSchema, generateBreadcrumbSchema } from "../lib/seo-helper";

const FAQ = () => {
  const { t } = useTranslation();

  const faqs = useMemo(() => [
    { question: t("faq_q1"), answer: t("faq_a1") },
    { question: t("faq_q2"), answer: t("faq_a2") },
    { question: t("faq_q3"), answer: t("faq_a3") },
    { question: t("faq_q4"), answer: t("faq_a4") },
    { question: t("faq_q5"), answer: t("faq_a5") },
  ], [t]);

  useEffect(() => {
    // Generate FAQ Schema
    const faqSchema = generateFAQSchema(faqs);
    
    // Generate breadcrumb schema
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: t('home'), url: 'https://monkeyz.co.il/' },
      { name: t('faq'), url: 'https://monkeyz.co.il/faq' }
    ]);
    
    // Add both schemas
    addStructuredData([faqSchema, breadcrumbSchema]);
  }, [t, faqs]);

  return (
    <>
      <Helmet>
        <title>MonkeyZ - {t("faq")} | {t("faq_meta_title", "Frequently Asked Questions")}</title>
        <meta name="description" content={t("faq_meta_description") || "Get answers to frequently asked questions about MonkeyZ products, services, digital licenses, support, and more."} />
        <meta name="keywords" content="MonkeyZ FAQ, digital product help, software licenses, cybersecurity questions, MonkeyZ support" />
        <link rel="canonical" href="https://monkeyz.co.il/faq" />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={`MonkeyZ - ${t("faq")}`} />
        <meta property="og:description" content={t("faq_meta_description") || "Get answers to frequently asked questions about MonkeyZ products, services, digital licenses, support, and more."} />
        <meta property="og:image" content="https://monkeyz.co.il/logo512.png" />
        <meta property="og:url" content="https://monkeyz.co.il/faq" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`MonkeyZ - ${t("faq")}`} />
        <meta name="twitter:description" content={t("faq_meta_description") || "Get answers to frequently asked questions about MonkeyZ products, services, digital licenses, support, and more."} />
        <meta name="twitter:image" content="https://monkeyz.co.il/logo512.png" />
      </Helmet>      
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        {/* Breadcrumb */}
        <nav className="w-full max-w-3xl mb-4 text-sm text-gray-500 dark:text-gray-400">
          <ol className="flex flex-wrap items-center space-x-1 rtl:space-x-reverse">
            <li><a href="/" className="hover:text-accent">{t('home')}</a></li>
            <li><span className="mx-1">›</span></li>
            <li className="text-accent font-medium">{t('faq')}</li>
          </ol>
        </nav>
        
        <h1 className="text-accent font-bold text-3xl mb-6" tabIndex={0}>
          {t("faq")}
        </h1>
        <div className="bg-white dark:bg-gray-800 border border-accent/30 dark:border-accent/30 rounded-lg shadow-lg p-4 md:p-6 w-full max-w-3xl backdrop-blur-sm">
          {faqs.map((faq, idx) => (
            <div key={idx} className="mb-6">
              <h2 className="text-lg font-semibold text-accent mb-2">{faq.question}</h2>
              <p className="text-base-content dark:text-white text-base">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default FAQ;
