import { useTranslation, Trans } from "react-i18next";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { addStructuredData, generateBreadcrumbSchema } from "../lib/seo-helper";

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
      
      {/* Hero Section */}
      <section className="bg-gradient-hero text-white py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="text-6xl mb-6">🐒</div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4" tabIndex={0}>
            {t("about_us", "About Us")}
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            {t("about_hero_subtitle", "Meet the team behind MonkeyZ and discover our mission to revolutionize digital products")}
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav className="bg-surface-secondary py-4 px-6">
        <div className="container mx-auto max-w-6xl">
          <ol className="flex items-center space-x-2 text-sm text-text-secondary">
            <li><a href="/" className="hover:text-brand-primary transition-colors">{t('home')}</a></li>
            <li><span className="mx-2">›</span></li>
            <li className="text-brand-primary font-medium">{t('about_us')}</li>
          </ol>
        </div>
      </nav>

      <main className="bg-gradient-surface py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          
          {/* Introduction Section */}
          <section className="card-modern p-8 lg:p-12 mb-12">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-6">
                {t("welcome_to_monkeyz", "Welcome to MonkeyZ")}
              </h2>
              <p className="text-xl text-text-secondary leading-relaxed">
                <Trans i18nKey="about_intro">
                  We are passionate about providing the best digital products and customer experience. 
                  At <span className="text-brand-primary font-semibold">MonkeyZ</span>, we believe in making premium software accessible to everyone.
                </Trans>
              </p>
            </div>
          </section>

          {/* Mission & Values Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            
            {/* Our Mission */}
            <section className="card-modern p-8">
              <div className="text-4xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-text-primary mb-4">{t("our_mission", "Our Mission")}</h2>
              <p className="text-text-secondary leading-relaxed">
                {t("about_mission", "To deliver high-quality, affordable digital products with fast support and a seamless shopping experience. We believe in transparency, trust, and putting our customers first.")}
              </p>
            </section>

            {/* Why Choose Us */}
            <section className="card-modern p-8">
              <div className="text-4xl mb-4">⭐</div>
              <h2 className="text-2xl font-bold text-text-primary mb-4">{t("why_choose_us", "Why Choose Us?")}</h2>
              <ul className="text-text-secondary space-y-3">
                <li className="flex items-start">
                  <span className="text-brand-primary mr-3">✓</span>
                  {t("about_why1", "Exclusive digital deals and software keys")}
                </li>
                <li className="flex items-start">
                  <span className="text-brand-primary mr-3">✓</span>
                  {t("about_why2", "Fast, friendly customer support")}
                </li>
                <li className="flex items-start">
                  <span className="text-brand-primary mr-3">✓</span>
                  {t("about_why3", "Secure checkout and data protection")}
                </li>
                <li className="flex items-start">
                  <span className="text-brand-primary mr-3">✓</span>
                  {t("about_why4", "Trusted by thousands of happy customers")}
                </li>
              </ul>
            </section>
          </div>

          {/* Team Section */}
          <section className="card-modern p-8 lg:p-12 mb-12">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">👥</div>
              <h2 className="text-3xl font-bold text-text-primary mb-4">{t("meet_the_team", "Meet the Team")}</h2>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                {t("about_team", "MonkeyZ is powered by a small, dedicated team of tech enthusiasts and customer service pros. We love what we do and it shows in every order!")}
              </p>
            </div>
          </section>

          {/* Stats Section */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-brand-primary mb-2">1000+</div>
              <div className="text-text-secondary">{t("happy_customers", "Happy Customers")}</div>
            </div>
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-brand-secondary mb-2">24/7</div>
              <div className="text-text-secondary">{t("support_available", "Support Available")}</div>
            </div>
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-brand-accent mb-2">100%</div>
              <div className="text-text-secondary">{t("secure_checkout", "Secure Checkout")}</div>
            </div>
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-brand-primary mb-2">5★</div>
              <div className="text-text-secondary">{t("customer_rating", "Customer Rating")}</div>
            </div>
          </section>

          {/* Contact CTA */}
          <section className="card-modern p-8 lg:p-12 text-center">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              {t("ready_to_get_started", "Ready to Get Started?")}
            </h2>
            <p className="text-xl text-text-secondary mb-8">
              {t("contact_cta_text", "Have questions? Want to learn more? We'd love to hear from you!")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.href = '/products'}
                className="btn-modern-primary text-lg px-8 py-4"
              >
                {t("browse_products", "Browse Products")}
              </button>
              <button 
                onClick={() => window.location.href = '/contact'}
                className="border-2 border-brand-primary text-brand-primary px-8 py-4 rounded-xl hover:bg-brand-primary hover:text-white transition-all duration-300"
              >
                {t("contact_us", "Contact Us")}
              </button>
            </div>
          </section>

          {/* Copyright */}
          <div className="text-center text-text-secondary text-sm mt-12">
            &copy; {new Date().getFullYear()} MonkeyZ. {t("all_rights_reserved", "All rights reserved.")}"
          </div>
        </div>
      </main>
    </>
  );
};

export default AboutUs;
