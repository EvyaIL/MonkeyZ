import { useTranslation, Trans } from "react-i18next";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { addStructuredData, generateBreadcrumbSchema } from "../lib/seo-helper";
import './AboutUs.css';

const AboutUs = () => {
  const { t } = useTranslation();

  useEffect(() => {
    // Generate organization schema
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://monkeyz.co.il/#organization",
      "name": "MonkeyZ",
      "url": "https://monkeyz.co.il",
      "logo": "https://monkeyz.co.il/logo192.png",
      "description": t("about_meta_description") || "MonkeyZ is a leading provider of digital products with a focus on cybersecurity and digital tools.",
      "foundingDate": "2022",
      "founders": [
        {
          "@type": "Person",
          "name": "MonkeyZ Team"
        }
      ],
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "IL"
      },
      "sameAs": [
        "https://facebook.com/monkeyz.co.il",
        "https://instagram.com/monkeyz.co.il",
        "https://twitter.com/monkeyz_co_il"
      ]
    };
    
    // Generate breadcrumb schema
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: t('home'), url: 'https://monkeyz.co.il/' },
      { name: t('about_us'), url: 'https://monkeyz.co.il/about' }
    ]);
    
    // Add both schemas
    addStructuredData([organizationSchema, breadcrumbSchema]);
  }, [t]);

  return (
    <>
      <Helmet>
        <title>MonkeyZ - {t("about_us")} | {t("about_meta_title", "Our Story and Mission")}</title>
        <meta name="description" content={t("about_meta_description") || "Learn more about MonkeyZ, our mission, values, and team. Discover how we're revolutionizing digital products for our global community."} />
        <meta name="keywords" content="MonkeyZ, digital products, cybersecurity company, about us, our team, company mission, company values" />
        <link rel="canonical" href="https://monkeyz.co.il/about" />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={`MonkeyZ - ${t("about_us")}`} />
        <meta property="og:description" content={t("about_meta_description") || "Learn more about MonkeyZ, our mission, values, and team. Discover how we're revolutionizing digital products for our global community."} />
        <meta property="og:image" content="https://monkeyz.co.il/logo512.png" />
        <meta property="og:url" content="https://monkeyz.co.il/about" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`MonkeyZ - ${t("about_us")}`} />
        <meta name="twitter:description" content={t("about_meta_description") || "Learn more about MonkeyZ, our mission, values, and team. Discover how we're revolutionizing digital products for our global community."} />
        <meta name="twitter:image" content="https://monkeyz.co.il/logo512.png" />
      </Helmet>
      
      <div className="about-container">
        <div className="about-content">
          {/* Hero Section */}
          <div className="about-hero">
            <h1 className="about-title">
              <span className="about-emoji">🐒</span>
              {t("about_us")}
            </h1>
            <p className="about-intro">
              <Trans i18nKey="about_intro">
                Welcome to <span className="about-brand">MonkeyZ</span>! We are passionate about providing the best digital products and customer experience.
              </Trans>
            </p>
          </div>

          {/* About Sections */}
          <div className="about-sections">
            <div className="about-section">
              <div className="about-section-icon">🎯</div>
              <h2 className="about-section-title">{t("our_mission")}</h2>
              <div className="about-section-content">
                <p>{t("about_mission")}</p>
              </div>
            </div>

            <div className="about-section">
              <div className="about-section-icon">⭐</div>
              <h2 className="about-section-title">{t("why_choose_us")}</h2>
              <div className="about-section-content">
                <ul className="about-values-list">
                  <li className="about-value-item">
                    <span className="about-value-icon">✓</span>
                    <span className="about-value-text">{t("about_why1")}</span>
                  </li>
                  <li className="about-value-item">
                    <span className="about-value-icon">✓</span>
                    <span className="about-value-text">{t("about_why2")}</span>
                  </li>
                  <li className="about-value-item">
                    <span className="about-value-icon">✓</span>
                    <span className="about-value-text">{t("about_why3")}</span>
                  </li>
                  <li className="about-value-item">
                    <span className="about-value-icon">✓</span>
                    <span className="about-value-text">{t("about_why4")}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="about-section">
              <div className="about-section-icon">🚀</div>
              <h2 className="about-section-title">Our Vision</h2>
              <div className="about-section-content">
                <p>To revolutionize the digital marketplace by providing innovative, secure, and user-friendly solutions that empower our customers to achieve their goals.</p>
              </div>
            </div>

            <div className="about-section">
              <div className="about-section-icon">🤝</div>
              <h2 className="about-section-title">Our Values</h2>
              <div className="about-section-content">
                <ul className="about-values-list">
                  <li className="about-value-item">
                    <span className="about-value-icon">�</span>
                    <span className="about-value-text">Quality First - We never compromise on excellence</span>
                  </li>
                  <li className="about-value-item">
                    <span className="about-value-icon">🔒</span>
                    <span className="about-value-text">Security & Trust - Your data and privacy are our priority</span>
                  </li>
                  <li className="about-value-item">
                    <span className="about-value-icon">🌟</span>
                    <span className="about-value-text">Innovation - Continuously improving and evolving</span>
                  </li>
                  <li className="about-value-item">
                    <span className="about-value-icon">❤️</span>
                    <span className="about-value-text">Customer Success - Your satisfaction drives our success</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="about-stats">
            <div className="about-stat">
              <span className="about-stat-number">10K+</span>
              <span className="about-stat-label">Happy Customers</span>
            </div>
            <div className="about-stat">
              <span className="about-stat-number">500+</span>
              <span className="about-stat-label">Digital Products</span>
            </div>
            <div className="about-stat">
              <span className="about-stat-number">99.9%</span>
              <span className="about-stat-label">Uptime</span>
            </div>
            <div className="about-stat">
              <span className="about-stat-number">24/7</span>
              <span className="about-stat-label">Support</span>
            </div>
          </div>

          {/* Team Section */}
          <div className="about-team">
            <h2 className="about-team-title">{t("meet_the_team")}</h2>
            <div className="about-team-grid">
              <div className="about-team-member">
                <div className="about-team-avatar">🐒</div>
                <h3 className="about-team-name">MonkeyZ Team</h3>
                <p className="about-team-role">Founders & Developers</p>
                <p className="about-team-bio">{t("about_team")}</p>
              </div>
              <div className="about-team-member">
                <div className="about-team-avatar">🛡️</div>
                <h3 className="about-team-name">Security Team</h3>
                <p className="about-team-role">Cybersecurity Experts</p>
                <p className="about-team-bio">Dedicated to keeping your data safe and secure with cutting-edge security protocols.</p>
              </div>
              <div className="about-team-member">
                <div className="about-team-avatar">💬</div>
                <h3 className="about-team-name">Support Team</h3>
                <p className="about-team-role">Customer Success</p>
                <p className="about-team-bio">Always here to help you succeed with 24/7 support and personalized assistance.</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="about-cta">
            <h2 className="about-cta-title">Ready to Join Our Community?</h2>
            <p className="about-cta-text">
              Discover our amazing digital products and become part of the MonkeyZ family. 
              Experience quality, security, and innovation like never before.
            </p>
            <div className="about-cta-buttons">
              <a href="/products" className="about-cta-button primary">
                🛍️ Browse Products
              </a>
              <a href="/contact" className="about-cta-button secondary">
                💬 Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutUs;
