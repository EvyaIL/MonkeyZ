import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { useEffect } from "react";

const FAQ = () => {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = t("faq");
  }, [t]);

  const faqs = [
    { question: t("faq_q1"), answer: t("faq_a1") },
    { question: t("faq_q2"), answer: t("faq_a2") },
    { question: t("faq_q3"), answer: t("faq_a3") },
    { question: t("faq_q4"), answer: t("faq_a4") },
    { question: t("faq_q5"), answer: t("faq_a5") },
  ];

  return (
    <div className="bg-primary min-h-screen flex flex-col items-center p-6">
      <h1 className="text-accent font-bold text-3xl mb-6" tabIndex={0}>
        {t("faq")}
      </h1>
      <div className="bg-secondary border border-gray-700 rounded-lg shadow-lg p-6 w-full max-w-3xl">
        {faqs.map((faq, idx) => (
          <div key={idx} className="mb-6">
            <h2 className="text-lg font-semibold text-accent mb-2">{faq.question}</h2>
            <p className="text-white text-base">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
