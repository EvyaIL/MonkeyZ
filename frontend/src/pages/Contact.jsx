import React, { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";

const SERVICE_ID = "service_xheer8t"; 
const TEMPLATE_ID = "template_vmjo60f"; 
const PUBLIC_KEY = "OZANGbTigZyYpNfAT"; 

const Contact = () => {
  const { t } = useTranslation();
  const formRef = useRef();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

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
        <title>MonkeyZ - {t("contact")}</title>
        <meta name="description" content={t("contact_meta_description") || "Contact MonkeyZ for support, questions, or feedback."} />
        <meta property="og:title" content={`MonkeyZ - ${t('contact')}`} />
        <meta property="og:description" content={t("contact_meta_description") || "Contact MonkeyZ for support, questions, or feedback."} />
      </Helmet>
      <main className="py-12 md:py-20 flex items-center justify-center">
        <div className="container mx-auto px-4">
          <section className="bg-white dark:bg-secondary p-8 md:p-12 rounded-lg shadow-lg w-full max-w-2xl mx-auto border border-base-300 dark:border-gray-700">
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
                <input id="from_name" name="from_name" type="text" placeholder={t("name_field_placeholder") || "Enter your name"} className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-accent transition rtl:text-right" required />
              </div>
              <div>
                <label htmlFor="reply_to" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 rtl:text-right">{t("email")}</label>
                <input id="reply_to" name="reply_to" type="email" placeholder={t("email_field_placeholder") || "Enter your email address"} className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-accent transition rtl:text-right" required />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 rtl:text-right">{t("message")}</label>
                <textarea id="message" name="message" placeholder={t("message_field_placeholder") || "Type your message here..."} className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-accent transition rtl:text-right" rows={6} required />
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
              <span>{t("or_email_us_directly") || "Or email us directly at"} </span>
              <a href="mailto:support@monkeyz.co.il" className="text-accent hover:text-accent-dark dark:hover:text-accent-light underline font-medium transition inline-block mx-1">
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
