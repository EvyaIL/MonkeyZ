import React, { useRef, useState, useEffect } from "react";
// EmailJS removed. Please use backend API for all email sending.
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { addStructuredData, generateBreadcrumbSchema } from "../lib/seo-helper";
import "./Contact.css";

// EmailJS config removed

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
        "telephone": "+972-5391-88641",
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

  const sendEmail = async (e) => {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      const formData = new FormData(formRef.current);
      const contactData = {
        name: formData.get("from_name"),
        email: formData.get("reply_to"),
        message: formData.get("message")
      };

      // Use proxy configuration to route to backend
      const response = await fetch("/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactData)
      });

      const result = await response.json();
      
      if (response.ok) {
        setStatus(t("success") || "Message sent successfully! We'll get back to you soon.");
        formRef.current.reset();
      } else {
        setStatus(result.detail || t("fail") || "Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Contact form error:", error);
      setStatus(t("fail") || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
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
      <div className="contact-container">
        <div className="contact-content">
          <div className="contact-header">
            <h1 className="contact-title">
              {t("contact")}
            </h1>
            <p className="contact-subtitle">
              {t("contact_subtitle") || "We'd love to hear from you! Fill out the form below to get in touch."}
            </p>
          </div>

          <div className="contact-main">
            <div className="contact-info">
              <div className="contact-info-card">
                <h2 className="info-title">{t("get_in_touch", "Get in Touch")}</h2>
                <div className="info-items">
                  <div className="info-item">
                    <div className="info-icon">
                      📧
                    </div>
                    <div className="info-content">
                      <div className="info-label">{t("email", "Email")}</div>
                      <div className="info-value">
                        <a href="mailto:support@monkeyz.co.il" className="info-link">
                          support@monkeyz.co.il
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-icon">
                      📞
                    </div>
                    <div className="info-content">
                      <div className="info-label">{t("phone", "Phone")}</div>
                      <div className="info-value">
                        <a href="tel:+972-5391-88641" className="info-link">
                          +972-5391-88641
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-icon">
                      🌐
                    </div>
                    <div className="info-content">
                      <div className="info-label">{t("discord", "Discord")}</div>
                      <div className="info-value">
                        <a href="https://discord.com/invite/3MZzKkd7qR" className="info-link">
                          Our Discord Community
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="business-hours">
                <h3 className="hours-title">{t("business_hours", "Business Hours")}</h3>
                <div className="hours-list">
                  <div className="hours-item">
                    <span className="hours-day">{t("sunday_thursday", "Sunday - Thursday")}</span>
                    <span className="hours-time">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="hours-item">
                    <span className="hours-day">{t("friday", "Friday")}</span>
                    <span className="hours-time">9:00 AM - 2:00 PM</span>
                  </div>
                  <div className="hours-item">
                    <span className="hours-day">{t("saturday", "Saturday")}</span>
                    <span className="hours-time">{t("closed", "Closed")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-form-container">
              <div className="contact-form">
                <h2 className="form-title">{t("send_message", "Send us a Message")}</h2>
                <form ref={formRef} onSubmit={sendEmail} className="form-fields" aria-label="Contact form">
                  <div className="form-group">
                    <label htmlFor="from_name" className="form-label">{t("username")}</label>
                    <input 
                      id="from_name" 
                      name="from_name" 
                      type="text" 
                      placeholder={t("enter_your_username")} 
                      className="form-input" 
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="reply_to" className="form-label">{t("email")}</label>
                    <input 
                      id="reply_to" 
                      name="reply_to" 
                      type="email" 
                      placeholder={t("enter_your_email")} 
                      className="form-input" 
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="message" className="form-label">{t("message")}</label>
                    <textarea 
                      id="message" 
                      name="message" 
                      placeholder={t("enter_your_message", "Tell us how we can help you...")} 
                      className="form-input form-textarea" 
                      rows={6} 
                      required 
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className={`form-button ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? `${t("sending")}...` : t("send_message") || t("send")}
                  </button>
                </form>
                
                {status && (
                  <div className={`form-status ${status === t("success") || status.includes("successfully") ? 'success' : 'error'}`}>
                    {status}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
