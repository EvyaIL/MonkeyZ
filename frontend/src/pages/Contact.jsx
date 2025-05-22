import React, { useRef, useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";
import { addStructuredData, generateBreadcrumbSchema } from "../lib/seo-helper";

const SERVICE_ID = "service_xheer8t"; 
const TEMPLATE_ID = "template_vmjo60f"; 
const PUBLIC_KEY = "OZANGbTigZyYpNfAT"; 

const Contact = () => {
  const { t } = useTranslation();
  const formRef = useRef();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Generate local business schema
    const localBusinessSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://monkeyz.co.il/#organization",
      "name": "MonkeyZ",
      "url": "https://monkeyz.co.il",
      "logo": "https://monkeyz.co.il/logo192.png",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+972-000-0000",
        "contactType": "customer service",
        "email": "support@monkeyz.co.il",
        "availableLanguage": ["Hebrew", "English"]
      }
    };
    
    // Generate breadcrumb schema
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: t('home'), url: 'https://monkeyz.co.il/' },
      { name: t('contact'), url: 'https://monkeyz.co.il/contact' }
    ]);
    
    // Add both schemas
    addStructuredData([localBusinessSchema, breadcrumbSchema]);
  }, [t]);

  const sendEmail = (e) => {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    emailjs
      .sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, PUBLIC_KEY)
      .then(
        (result) => {
          setStatus(t("success"));
          setLoading(false);
          formRef.current.reset();
        },
        (error) => {
          setStatus(t("fail"));
          setLoading(false);
        }
      );
  };

  return (
    <>
      <Helmet>
        <title>MonkeyZ - {t("contact")} | {t("contact_meta_title", "Get in Touch")}</title>
        <meta name="description" content={t("contact_meta_description") || "Contact MonkeyZ for support, questions, feedback, or collaboration opportunities. Our team is ready to assist you with all your digital product needs."} />
        <meta name="keywords" content="contact MonkeyZ, support, digital product help, technical assistance, customer service" />
        <link rel="canonical" href="https://monkeyz.co.il/contact" />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={`MonkeyZ - ${t("contact")}`} />
        <meta property="og:description" content={t("contact_meta_description") || "Contact MonkeyZ for support, questions, feedback, or collaboration opportunities. Our team is ready to assist you with all your digital product needs."} />
        <meta property="og:image" content="https://monkeyz.co.il/logo512.png" />
        <meta property="og:url" content="https://monkeyz.co.il/contact" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`MonkeyZ - ${t("contact")}`} />
        <meta name="twitter:description" content={t("contact_meta_description") || "Contact MonkeyZ for support, questions, feedback, or collaboration opportunities. Our team is ready to assist you with all your digital product needs."} />
        <meta name="twitter:image" content="https://monkeyz.co.il/logo512.png" />
      </Helmet>
      <main className="py-12 md:py-20 flex items-center justify-center">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="w-full max-w-2xl mx-auto mb-4 text-sm text-gray-500 dark:text-gray-400">
            <ol className="flex flex-wrap items-center space-x-1 rtl:space-x-reverse">
              <li><a href="/" className="hover:text-accent">{t('home')}</a></li>
              <li><span className="mx-1">›</span></li>
              <li className="text-accent font-medium">{t('contact')}</li>
            </ol>
          </nav>
          
          <section className="bg-white dark:bg-gray-800 border border-accent/30 dark:border-accent/30 rounded-lg shadow-lg p-4 md:p-6 w-full max-w-2xl mx-auto backdrop-blur-sm">
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-bold text-primary dark:text-accent mb-3">
                {t("contact")}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {t("contact_subtitle") || "We'd love to hear from you! Fill out the form below to get in touch."}
              </p>
            </div>
            <form ref={formRef} onSubmit={sendEmail} className="space-y-6" aria-label="Contact form">
              <div>
                <label htmlFor="from_name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 rtl:text-right">{t("username")}</label>
                <input id="from_name" name="from_name" type="text" placeholder={t("enter_your_username")} className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-accent transition rtl:text-right" required />
              </div>
              <div>
                <label htmlFor="reply_to" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 rtl:text-right">{t("email")}</label>
                <input id="reply_to" name="reply_to" type="email" placeholder={t("enter_your_email")} className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-accent transition rtl:text-right" required />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 rtl:text-right">{t("message")}</label>
                <textarea id="message" name="message" placeholder={t("contact_subtitle")} className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-accent transition rtl:text-right" rows={6} required />
              </div>
              <button type="submit" className="w-full bg-accent text-white font-semibold py-3 px-6 rounded-lg hover:bg-accent-dark focus:outline-none focus:ring-4 focus:ring-accent focus:ring-opacity-50 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed" disabled={loading}>
                {loading ? `${t("sending")}...` : t("send_message") || t("send")}
              </button>
            </form>
            {status && (
              <div className={`mt-6 p-3 rounded-md text-center font-medium ${status === t("success") ? 'bg-green-100 dark:bg-green-700 text-green-700 dark:text-green-100' : 'bg-red-100 dark:bg-red-700 text-red-700 dark:text-red-100'}`}>
                {status}
              </div>
            )}
            <div className="mt-8 text-center text-gray-600 dark:text-gray-400 text-sm rtl:text-right ltr:text-center">
              <span>{t("or_email_us_directly") || "Or email us directly at "}</span>
              {' '}
              <a href="mailto:support@monkeyz.co.il" className="text-accent hover:text-accent-dark dark:hover:text-accent-light underline font-medium transition inline-block rtl:mr-1">
                support@monkeyz.co.il
              </a>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default Contact;
