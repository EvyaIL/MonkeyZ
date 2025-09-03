import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { addStructuredData, generateFAQSchema, generateBreadcrumbSchema } from "../lib/seo-helper";
import { ChevronDownIcon, MagnifyingGlassIcon, QuestionMarkCircleIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import "./FAQ.css";

const FAQ = () => {
  const { t } = useTranslation();
  const [openItem, setOpenItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const faqs = useMemo(() => [
    { 
      question: t("faq_q1", "How do I purchase digital products?"), 
      answer: t("faq_a1", "You can purchase digital products by browsing our catalog, adding items to your cart, and completing the secure checkout process. Digital licenses are delivered instantly via email."),
      category: "purchasing"
    },
    { 
      question: t("faq_q2", "What payment methods do you accept?"), 
      answer: t("faq_a2", "We accept PayPal, major credit cards (Visa, MasterCard, American Express), and other secure payment methods. All transactions are processed securely."),
      category: "payment"
    },
    { 
      question: t("faq_q3", "How do I receive my digital license?"), 
      answer: t("faq_a3", "After successful payment, your digital license key will be sent to your registered email address within minutes. Please check your spam folder if you don't see it."),
      category: "delivery"
    },
    { 
      question: t("faq_q4", "Can I get a refund on digital products?"), 
      answer: t("faq_a4", "Refunds are available within 7 days of purchase for digital products that haven't been activated. Please contact our support team with your order details."),
      category: "refunds"
    },
    { 
      question: t("faq_q5", "Do you provide technical support?"), 
      answer: t("faq_a5", "Yes, we provide comprehensive technical support for all our products. You can contact us via email, phone, or our online support chat during business hours."),
      category: "support"
    },
    { 
      question: t("faq_q6", "Are your products genuine and legal?"), 
      answer: t("faq_a6", "Absolutely! All our digital products are genuine, legal licenses sourced directly from authorized distributors and software vendors."),
      category: "legitimacy"
    },
    { 
      question: t("faq_q7", "How secure is my personal information?"), 
      answer: t("faq_a7", "We use industry-standard encryption and security measures to protect your personal and payment information. Your data is never shared with third parties."),
      category: "security"
    },
    { 
      question: t("faq_q8", "Can I download my products multiple times?"), 
      answer: t("faq_a8", "Yes, you can access your purchased products from your account dashboard and download them multiple times as needed."),
      category: "downloads"
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
      <div className="modern-faq-container">
        <div className="modern-faq-content">
          {/* Hero Section */}
          <div className="modern-faq-hero">
            <div className="modern-faq-hero-icon">
              <QuestionMarkCircleIcon className="h-16 w-16" />
            </div>
            <h1 className="modern-faq-title" tabIndex={0}>
              {t("faq", "Frequently Asked Questions")}
            </h1>
            <p className="modern-faq-subtitle">
              {t("faq_subtitle", "Find answers to common questions about our products and services")}
            </p>
            <div className="modern-faq-stats">
              <div className="faq-stat">
                <span className="faq-stat-number">{faqs.length}</span>
                <span className="faq-stat-label">{t("questions_answered", "Questions Answered")}</span>
              </div>
              <div className="faq-stat">
                <span className="faq-stat-number">24/7</span>
                <span className="faq-stat-label">{t("support_available", "Support Available")}</span>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="modern-faq-search">
            <div className="modern-faq-search-wrapper">
              <MagnifyingGlassIcon className="search-icon" />
              <input
                type="text"
                className="modern-faq-search-input"
                placeholder={t("search_faqs", "Search frequently asked questions...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* FAQ Items */}
          <div className="modern-faq-grid">
            {filteredFaqs.map((faq, idx) => (
              <div key={idx} className={`modern-faq-item ${openItem === idx ? 'open' : ''}`}>
                <div 
                  className="modern-faq-question" 
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
                  <span className="modern-faq-question-text">{faq.question}</span>
                  <ChevronDownIcon className={`modern-faq-chevron ${openItem === idx ? 'rotated' : ''}`} />
                </div>
                <div className="modern-faq-answer">
                  <div className="modern-faq-answer-content">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="modern-faq-no-results">
              <QuestionMarkCircleIcon className="h-16 w-16 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {t("no_faqs_found", "No FAQs found matching your search.")}
              </h3>
              <p className="text-gray-500">
                {t("try_different_search", "Try using different keywords or browse all questions above.")}
              </p>
            </div>
          )}

          {/* Contact CTA */}
          <div className="modern-faq-contact">
            <div className="modern-faq-contact-content">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-blue-600 mb-4" />
              <h2 className="modern-faq-contact-title">
                {t("still_have_questions", "Still have questions?")}
              </h2>
              <p className="modern-faq-contact-text">
                {t("contact_support_text", "Our support team is here to help you with any questions or issues you may have.")}
              </p>
              <div className="modern-faq-contact-buttons">
                <a href="/contact" className="modern-faq-contact-button primary">
                  {t("contact_support", "Contact Support")}
                </a>
                <a href="mailto:support@monkeyz.co.il" className="modern-faq-contact-button secondary">
                  {t("email_us", "Email Us")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQ;
