import React from "react";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import './PrivacyPolicy.css';

function PrivacyPolicy() {
  const { t } = useTranslation();
  
  useEffect(() => {
    document.title = t("privacy_policy");
  }, [t]);

  return (
    <>      <Helmet>
        <title>{`MonkeyZ - ${t("privacy_policy")}`}</title>
        <meta name="description" content={t("privacy_policy_meta_description") || "Privacy Policy for MonkeyZ - Learn how we collect, use and protect your personal information."} />
        <meta property="og:title" content={`MonkeyZ - ${t("privacy_policy")}`} />
        <meta property="og:description" content={t("privacy_policy_meta_description") || "Privacy Policy for MonkeyZ - Learn how we collect, use and protect your personal information."} />
      </Helmet>
      
      <div className="privacy-container">
        <div className="privacy-content">
          {/* Hero Section */}
          <div className="privacy-hero">
            <h1 className="privacy-title">
              <span className="privacy-icon">🔒</span>
              {t("privacy_policy")}
            </h1>
            <p className="privacy-subtitle">Learn how we collect, use and protect your personal information</p>
            <span className="privacy-updated">{t("last_updated")}: {t("may")} 19, 2025</span>
          </div>

          {/* Privacy Summary */}
          <div className="privacy-summary">
            <h2 className="privacy-summary-title">
              🛡️ Your Privacy Matters
            </h2>
            <p className="privacy-summary-text">
              At MonkeyZ, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This policy explains how we collect, use, and safeguard your data when you use our services.
            </p>
          </div>

          {/* Navigation */}
          <nav className="privacy-nav">
            <h2 className="privacy-nav-title">
              📖 Quick Navigation
            </h2>
            <ul className="privacy-nav-list">
              <li className="privacy-nav-item">
                <a href="#collection" className="privacy-nav-link">1. {t("information_collection")}</a>
              </li>
              <li className="privacy-nav-item">
                <a href="#usage" className="privacy-nav-link">2. {t("information_usage")}</a>
              </li>
              <li className="privacy-nav-item">
                <a href="#sharing" className="privacy-nav-link">3. {t("information_sharing")}</a>
              </li>
              <li className="privacy-nav-item">
                <a href="#cookies" className="privacy-nav-link">4. {t("cookies_policy")}</a>
              </li>
              <li className="privacy-nav-item">
                <a href="#security" className="privacy-nav-link">5. {t("data_security")}</a>
              </li>
              <li className="privacy-nav-item">
                <a href="#rights" className="privacy-nav-link">6. {t("user_rights")}</a>
              </li>
              <li className="privacy-nav-item">
                <a href="#contact" className="privacy-nav-link">7. {t("contact")}</a>
              </li>
            </ul>
          </nav>

          {/* Privacy Document */}
          <div className="privacy-document">
            <section id="collection" className="privacy-section">
              <h2 className="privacy-section-title">
                <div className="privacy-section-icon">📊</div>
                1. {t("information_collection")}
              </h2>
              <div className="privacy-section-content">
                <p>{t("privacy_info_collection_text")}</p>
                
                <div className="privacy-data-types">
                  <div className="privacy-data-type">
                    <span className="privacy-data-icon">👤</span>
                    <h3 className="privacy-data-title">Personal Information</h3>
                    <p className="privacy-data-description">{t("privacy_personal_info")}</p>
                  </div>
                  <div className="privacy-data-type">
                    <span className="privacy-data-icon">📈</span>
                    <h3 className="privacy-data-title">Usage Information</h3>
                    <p className="privacy-data-description">{t("privacy_usage_info")}</p>
                  </div>
                  <div className="privacy-data-type">
                    <span className="privacy-data-icon">💳</span>
                    <h3 className="privacy-data-title">Transaction Information</h3>
                    <p className="privacy-data-description">{t("privacy_transaction_info")}</p>
                  </div>
                  <div className="privacy-data-type">
                    <span className="privacy-data-icon">⚙️</span>
                    <h3 className="privacy-data-title">Technical Information</h3>
                    <p className="privacy-data-description">{t("privacy_technical_info")}</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="usage" className="privacy-section">
              <h2 className="privacy-section-title">
                <div className="privacy-section-icon">🎯</div>
                2. {t("information_usage")}
              </h2>
              <div className="privacy-section-content">
                <p>{t("privacy_usage_text")}</p>
                <ul className="privacy-list">
                  <li className="privacy-list-item">
                    <span className="privacy-list-icon">•</span>
                    <span className="privacy-list-text">{t("privacy_usage_improve")}</span>
                  </li>
                  <li className="privacy-list-item">
                    <span className="privacy-list-icon">•</span>
                    <span className="privacy-list-text">{t("privacy_usage_communicate")}</span>
                  </li>
                  <li className="privacy-list-item">
                    <span className="privacy-list-icon">•</span>
                    <span className="privacy-list-text">{t("privacy_usage_process")}</span>
                  </li>
                  <li className="privacy-list-item">
                    <span className="privacy-list-icon">•</span>
                    <span className="privacy-list-text">{t("privacy_usage_security")}</span>
                  </li>
                </ul>
              </div>
            </section>

            <section id="sharing" className="privacy-section">
              <h2 className="privacy-section-title">
                <div className="privacy-section-icon">🤝</div>
                3. {t("information_sharing")}
              </h2>
              <div className="privacy-section-content">
                <p>{t("privacy_sharing_text")}</p>
                <div className="privacy-highlight">
                  <strong>Important:</strong> We never sell your personal information to third parties. Any data sharing is done only when necessary for service provision and with your explicit consent.
                </div>
              </div>
            </section>

            <section id="cookies" className="privacy-section">
              <h2 className="privacy-section-title">
                <div className="privacy-section-icon">🍪</div>
                4. {t("cookies_policy")}
              </h2>
              <div className="privacy-section-content">
                <p>{t("privacy_cookies_text")}</p>
              </div>
            </section>

            <section id="security" className="privacy-section">
              <h2 className="privacy-section-title">
                <div className="privacy-section-icon">🛡️</div>
                5. {t("data_security")}
              </h2>
              <div className="privacy-section-content">
                <p>{t("privacy_security_text")}</p>
                <div className="privacy-highlight">
                  <strong>Security Measures:</strong> We use industry-standard encryption, secure servers, regular security audits, and access controls to protect your data.
                </div>
              </div>
            </section>

            <section id="rights" className="privacy-section">
              <h2 className="privacy-section-title">
                <div className="privacy-section-icon">⚖️</div>
                6. {t("user_rights")}
              </h2>
              <div className="privacy-section-content">
                <p>{t("privacy_rights_text")}</p>
                
                <div className="privacy-rights-grid">
                  <div className="privacy-right">
                    <span className="privacy-right-icon">👁️</span>
                    <h3 className="privacy-right-title">Access</h3>
                    <p className="privacy-right-description">View the personal data we have about you</p>
                  </div>
                  <div className="privacy-right">
                    <span className="privacy-right-icon">✏️</span>
                    <h3 className="privacy-right-title">Rectification</h3>
                    <p className="privacy-right-description">Correct inaccurate or incomplete data</p>
                  </div>
                  <div className="privacy-right">
                    <span className="privacy-right-icon">🗑️</span>
                    <h3 className="privacy-right-title">Erasure</h3>
                    <p className="privacy-right-description">Request deletion of your personal data</p>
                  </div>
                  <div className="privacy-right">
                    <span className="privacy-right-icon">📤</span>
                    <h3 className="privacy-right-title">Portability</h3>
                    <p className="privacy-right-description">Export your data in a readable format</p>
                  </div>
                  <div className="privacy-right">
                    <span className="privacy-right-icon">🚫</span>
                    <h3 className="privacy-right-title">Object</h3>
                    <p className="privacy-right-description">Object to processing of your data</p>
                  </div>
                  <div className="privacy-right">
                    <span className="privacy-right-icon">⏸️</span>
                    <h3 className="privacy-right-title">Restriction</h3>
                    <p className="privacy-right-description">Limit how we process your data</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="contact" className="privacy-section">
              <h2 className="privacy-section-title">
                <div className="privacy-section-icon">📞</div>
                7. {t("contact")}
              </h2>
              <div className="privacy-section-content">
                <p>
                  {t("privacy_contact_text")}{" "}
                  <a href="mailto:support@monkeyz.co.il" className="privacy-contact-link">
                    support@monkeyz.co.il
                  </a>
                </p>
              </div>
            </section>
          </div>

          {/* Contact Info */}
          <div className="privacy-contact-info">
            <h3 className="privacy-contact-title">Questions About Privacy?</h3>
            <p className="privacy-contact-text">
              If you have any questions about this Privacy Policy or how we handle your data, please contact our privacy team.
            </p>
            <a href="/contact" className="privacy-contact-link">
              Contact Privacy Team
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
