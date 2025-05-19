import React, { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";
import { sendAutoReply } from "../lib/autoReply";

// 1. הכנס כאן את המפתחות שלך מ-EmailJS (https://www.emailjs.com/):
//    SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY
const SERVICE_ID = "service_xheer8t"; // Service ID שלך
const TEMPLATE_ID = "template_vmjo60f"; // Template ID שלך
const PUBLIC_KEY = "OZANGbTigZyYpNfAT"; // זהו ה-Public Key שלך מ-EmailJS

const Contact = () => {
  const { t } = useTranslation();
  const formRef = useRef();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    from_name: '',
    reply_to: '',
    message: ''
  });

  // Send email and auto-reply
  const sendEmail = async (e) => {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    
    try {
      // Send the main contact form email
      await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, PUBLIC_KEY);
      
      // Send auto-reply email
      try {
        await sendAutoReply({
          to_name: formData.from_name,
          to_email: formData.reply_to,
          subject: t("auto_reply_subject") || "Thank you for contacting MonkeyZ"
        });
        setStatus(t("message_sent") + ' ' + t("auto_reply_sent"));
      } catch (err) {
        console.error("Error sending auto-reply:", err);
        setStatus(t("success"));
      }
      
      // Reset form
      formRef.current.reset();
      setFormData({
        from_name: '',
        reply_to: '',
        message: ''
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      setStatus(t("fail"));
    } finally {
      setLoading(false);
    }
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
                <label htmlFor="from_name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t("username")}</label>
                <input id="from_name" name="from_name" type="text" placeholder={t("username_placeholder") || t("username")} className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-accent transition" required />
              </div>
              <div>
                <label htmlFor="reply_to" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t("email")}</label>
                <input id="reply_to" name="reply_to" type="email" placeholder={t("email_placeholder") || t("email")} className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-accent transition" required />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t("message")}</label>
                <textarea id="message" name="message" placeholder={t("message_placeholder") || t("message")} className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-accent transition" rows={6} required />
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
            <div className="mt-8 text-center text-gray-600 dark:text-gray-400 text-sm">
              {t("or_email_us_directly") || "Or email us directly at "}
              <a href="mailto:support@monkeyz.co.il" className="text-accent hover:text-accent-dark dark:hover:text-accent-light underline font-medium transition">
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
