import React from "react";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import './TermsOfService.css';

function TermsOfService() {
  const { t } = useTranslation();
  
  useEffect(() => {
    document.title = t("terms_of_service");
  }, [t]);

  return (
    <>      <Helmet>
        <title>{`MonkeyZ - ${t("terms_of_service")}`}</title>
        <meta name="description" content={t("terms_meta_description") || "Terms of Service for MonkeyZ - Please read these terms carefully before using our services."} />
        <meta property="og:title" content={`MonkeyZ - ${t("terms_of_service")}`} />
        <meta property="og:description" content={t("terms_meta_description") || "Terms of Service for MonkeyZ - Please read these terms carefully before using our services."} />
      </Helmet>
      
      <div className="terms-container">
        <div className="terms-content">
          {/* Hero Section */}
          <div className="terms-hero">
            <h1 className="terms-title">
              <span className="terms-icon">📋</span>
              {t("terms_of_service")}
            </h1>
            <p className="terms-subtitle">Please read these terms carefully before using our services</p>
            <span className="terms-updated">{t("last_updated")}: {t("may")} 19, 2025</span>
          </div>

          {/* Navigation */}
          <nav className="terms-nav">
            <h2 className="terms-nav-title">
              📑 Table of Contents
            </h2>
            <ul className="terms-nav-list">
              <li className="terms-nav-item">
                <a href="#acceptance" className="terms-nav-link">1. {t("acceptance_of_terms")}</a>
              </li>
              <li className="terms-nav-item">
                <a href="#accounts" className="terms-nav-link">2. {t("user_accounts")}</a>
              </li>
              <li className="terms-nav-item">
                <a href="#products" className="terms-nav-link">3. {t("products_and_services")}</a>
              </li>
              <li className="terms-nav-item">
                <a href="#payment" className="terms-nav-link">4. {t("payment_and_billing")}</a>
              </li>
              <li className="terms-nav-item">
                <a href="#refunds" className="terms-nav-link">5. {t("refund_policy")}</a>
              </li>
              <li className="terms-nav-item">
                <a href="#intellectual" className="terms-nav-link">6. {t("intellectual_property")}</a>
              </li>
              <li className="terms-nav-item">
                <a href="#prohibited" className="terms-nav-link">7. {t("prohibited_activities")}</a>
              </li>
              <li className="terms-nav-item">
                <a href="#liability" className="terms-nav-link">8. {t("limitation_of_liability")}</a>
              </li>
              <li className="terms-nav-item">
                <a href="#contact" className="terms-nav-link">9. {t("contact")}</a>
              </li>
            </ul>
          </nav>

          {/* Terms Document */}
          <div className="terms-document">
            <section id="acceptance" className="terms-section">
              <h2 className="terms-section-title">
                <div className="terms-section-icon">✅</div>
                1. {t("acceptance_of_terms")}
              </h2>
              <div className="terms-section-content">
                <p>{t("terms_acceptance_text")}</p>
                <div className="terms-highlight">
                  <strong>Important:</strong> By accessing or using MonkeyZ services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                </div>
              </div>
            </section>

            <section id="accounts" className="terms-section">
              <h2 className="terms-section-title">
                <div className="terms-section-icon">👤</div>
                2. {t("user_accounts")}
              </h2>
              <div className="terms-section-content">
                <p>{t("terms_accounts_text")}</p>
                <ul className="terms-list">
                  <li className="terms-list-item">
                    <span className="terms-list-icon">•</span>
                    <span className="terms-list-text">{t("terms_accounts_accuracy")}</span>
                  </li>
                  <li className="terms-list-item">
                    <span className="terms-list-icon">•</span>
                    <span className="terms-list-text">{t("terms_accounts_security")}</span>
                  </li>
                  <li className="terms-list-item">
                    <span className="terms-list-icon">•</span>
                    <span className="terms-list-text">{t("terms_accounts_responsibility")}</span>
                  </li>
                </ul>
              </div>
            </section>

            <section id="products" className="terms-section">
              <h2 className="terms-section-title">
                <div className="terms-section-icon">🛍️</div>
                3. {t("products_and_services")}
              </h2>
              <div className="terms-section-content">
                <p>{t("terms_products_text")}</p>
              </div>
            </section>

            <section id="payment" className="terms-section">
              <h2 className="terms-section-title">
                <div className="terms-section-icon">💳</div>
                4. {t("payment_and_billing")}
              </h2>
              <div className="terms-section-content">
                <p>{t("terms_payment_text")}</p>
                <div className="terms-highlight">
                  <strong>Payment Security:</strong> All payments are processed through secure, encrypted channels. We do not store your complete payment information on our servers.
                </div>
              </div>
            </section>

            <section id="refunds" className="terms-section">
              <h2 className="terms-section-title">
                <div className="terms-section-icon">💰</div>
                5. {t("refund_policy")}
              </h2>
              <div className="terms-section-content">
                <p>{t("terms_refund_text")}</p>
              </div>
            </section>

            <section id="intellectual" className="terms-section">
              <h2 className="terms-section-title">
                <div className="terms-section-icon">⚖️</div>
                6. {t("intellectual_property")}
              </h2>
              <div className="terms-section-content">
                <p>{t("terms_intellectual_property_text")}</p>
              </div>
            </section>

            <section id="prohibited" className="terms-section">
              <h2 className="terms-section-title">
                <div className="terms-section-icon">🚫</div>
                7. {t("prohibited_activities")}
              </h2>
              <div className="terms-section-content">
                <p>{t("terms_prohibited_text")}</p>
                <ul className="terms-list">
                  <li className="terms-list-item">
                    <span className="terms-list-icon">×</span>
                    <span className="terms-list-text">{t("terms_prohibited_illegal")}</span>
                  </li>
                  <li className="terms-list-item">
                    <span className="terms-list-icon">×</span>
                    <span className="terms-list-text">{t("terms_prohibited_harm")}</span>
                  </li>
                  <li className="terms-list-item">
                    <span className="terms-list-icon">×</span>
                    <span className="terms-list-text">{t("terms_prohibited_impersonation")}</span>
                  </li>
                  <li className="terms-list-item">
                    <span className="terms-list-icon">×</span>
                    <span className="terms-list-text">{t("terms_prohibited_data")}</span>
                  </li>
                </ul>
              </div>
            </section>

            <section id="liability" className="terms-section">
              <h2 className="terms-section-title">
                <div className="terms-section-icon">🛡️</div>
                8. {t("limitation_of_liability")}
              </h2>
              <div className="terms-section-content">
                <p>{t("terms_liability_text")}</p>
              </div>
            </section>

            <section id="contact" className="terms-section">
              <h2 className="terms-section-title">
                <div className="terms-section-icon">📞</div>
                9. {t("contact")}
              </h2>
              <div className="terms-section-content">
                <p>
                  {t("terms_contact_text")}{" "}
                  <a href="mailto:support@monkeyz.co.il" className="terms-contact-link">
                    support@monkeyz.co.il
                  </a>
                </p>
              </div>
            </section>
          </div>

          {/* Contact Info */}
          <div className="terms-contact-info">
            <h3 className="terms-contact-title">Questions About These Terms?</h3>
            <p className="terms-contact-text">
              If you have any questions about these Terms of Service, please don't hesitate to contact us.
            </p>
            <a href="/contact" className="terms-contact-link">
              Contact Support Team
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsOfService;
