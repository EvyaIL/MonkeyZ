import React, { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";

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
        <meta property="og:title" content="MonkeyZ - {t('contact')}" />
        <meta property="og:description" content={t("contact_meta_description") || "Contact MonkeyZ for support, questions, or feedback."} />
      </Helmet>
      <main className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <section className="bg-secondary p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold text-accent mb-4 flex items-center gap-2" tabIndex={0} aria-label={t("contact") + " Page"}>
            <span role="img" aria-label="Contact">📬</span> {t("contact")}
          </h1>
          <form ref={formRef} onSubmit={sendEmail} className="space-y-5" aria-label="Contact form">
            <input name="from_name" type="text" placeholder={t("username")} className="w-full p-2 rounded bg-gray-900 text-white" required />
            <input name="reply_to" type="email" placeholder={t("email")} className="w-full p-2 rounded bg-gray-900 text-white" required />
            <textarea name="message" placeholder={t("message")} className="w-full p-2 rounded bg-gray-900 text-white" rows={5} required />
            <button type="submit" className="w-full bg-accent text-white font-bold py-2 rounded hover:bg-accent/90 transition" disabled={loading}>
              {loading ? t("send") + "..." : t("send")}
            </button>
          </form>
          {status && <div className="mt-4 text-white text-center">{status}</div>}
          <div className="mt-6 text-gray-400 text-sm">
            {t("or_email") || "או שלח לנו מייל ישירות ל-"}
            <a href="mailto:support@monkeyz.co.il" className="text-accent underline">support@monkeyz.co.il</a>
          </div>
        </section>
      </main>
    </>
  );
};

export default Contact;
