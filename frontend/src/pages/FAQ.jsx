import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { addStructuredData, generateFAQSchema, generateBreadcrumbSchema } from "../lib/seo-helper";
import "./FAQ.css";

const FAQ = () => {
  const { t } = useTranslation();
  const [openItem, setOpenItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const faqs = useMemo(() => [
    { 
      question: t("faq_q1", "How do I purchase digital products?"), 
      answer: t("faq_a1", "You can purchase digital products by browsing our catalog, adding items to your cart, and completing the secure checkout process. Digital licenses are delivered instantly via email.")
    },
    { 
      question: t("faq_q2", "What payment methods do you accept?"), 
      answer: t("faq_a2", "We accept PayPal, major credit cards (Visa, MasterCard, American Express), and other secure payment methods. All transactions are processed securely.")
    },
    { 
      question: t("faq_q3", "How do I receive my digital license?"), 
      answer: t("faq_a3", "After successful payment, your digital license key will be sent to your registered email address within minutes. Please check your spam folder if you don't see it.")
    },
    { 
      question: t("faq_q4", "Can I get a refund on digital products?"), 
      answer: t("faq_a4", "Refunds are available within 7 days of purchase for digital products that haven't been activated. Please contact our support team with your order details.")
    },
    { 
      question: t("faq_q5", "Do you provide technical support?"), 
      answer: t("faq_a5", "Yes, we provide comprehensive technical support for all our products. You can contact us via email, phone, or our online support chat during business hours.")
    },
    { 
      question: t("faq_q6", "Are your products genuine and legal?"), 
      answer: t("faq_a6", "Absolutely! All our digital products are genuine, legal licenses sourced directly from authorized distributors and software vendors.")
    }
  ], [t]);

  const filteredFaqs = useMemo(() => {
    if (!searchTerm) return faqs;
    return faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [faqs, searchTerm]);

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

  const toggleItem = (index) => {
    setOpenItem(openItem === index ? null : index);
  };

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
      <div className="faq-container">
        <div className="faq-content">
          <div className="faq-header">
            <h1 className="faq-title" tabIndex={0}>
              {t("faq", "Frequently Asked Questions")}
            </h1>
            <p className="faq-subtitle">
              {t("faq_subtitle", "Find answers to common questions about our products and services")}
            </p>
          </div>

          <div className="faq-search">
            <input
              type="text"
              className="faq-search-input"
              placeholder={t("search_faqs", "Search frequently asked questions...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="faq-search-icon">🔍</div>
          </div>

          <div className="faq-list">
            {filteredFaqs.map((faq, idx) => (
              <div key={idx} className={`faq-item ${openItem === idx ? 'open' : ''}`}>
                <div 
                  className="faq-question" 
                  onClick={() => toggleItem(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleItem(idx);
                    }
                  }}
                  aria-expanded={openItem === idx}
                >
                  <span className="faq-question-text">{faq.question}</span>
                  <div className="faq-icon">+</div>
                </div>
                <div className="faq-answer">
                  <div className="faq-answer-content">{faq.answer}</div>
                </div>
              </div>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {t("no_faqs_found", "No FAQs found matching your search.")}
            </div>
          )}

          <div className="faq-contact-cta">
            <h2 className="faq-contact-title">
              {t("still_have_questions", "Still have questions?")}
            </h2>
            <p className="faq-contact-text">
              {t("contact_support_text", "Our support team is here to help you with any questions or issues you may have.")}
            </p>
            <a href="/contact" className="faq-contact-button">
              {t("contact_support", "Contact Support")} →
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQ;
