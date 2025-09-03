import { useTranslation, Trans } from "react-i18next";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { addStructuredData, generateBreadcrumbSchema } from "../lib/seo-helper";
import { 
  StarIcon, 
  ShieldCheckIcon, 
  RocketLaunchIcon, 
  HeartIcon,
  CheckCircleIcon,
  UsersIcon,
  TrophyIcon,
  BuildingOfficeIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";
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
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <span>{t("trusted_by_thousands", "Trusted by thousands worldwide")}</span>
            </div>
            <h1 className="text-5xl font-bold text-slate-800 mb-6">
              {t("about_us_modern_title", "Building the Future of Digital Commerce")}
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              <Trans i18nKey="about_intro_modern">
                At <span className="text-blue-600 font-semibold">MonkeyZ</span>, we're passionate about providing innovative digital solutions that empower businesses and individuals worldwide.
              </Trans>
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">10K+</div>
                <div className="text-slate-600">{t("happy_customers", "Happy Customers")}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">99.9%</div>
                <div className="text-slate-600">{t("uptime", "Uptime")}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">24/7</div>
                <div className="text-slate-600">{t("support", "Support")}</div>
              </div>
            </div>
          </div>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <RocketLaunchIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">{t("our_mission", "Our Mission")}</h2>
              <p className="text-slate-600 leading-relaxed">
                {t("about_mission_modern", "To democratize access to premium digital products and services, making cutting-edge technology accessible to everyone through innovation, security, and exceptional customer service.")}
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <GlobeAltIcon className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">{t("our_vision", "Our Vision")}</h2>
              <p className="text-slate-600 leading-relaxed">
                {t("about_vision_modern", "To become the world's most trusted digital marketplace, where quality, security, and customer satisfaction drive every decision we make.")}
              </p>
            </div>
          </div>

          {/* Values Section */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">{t("our_values", "Our Core Values")}</h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                {t("values_description", "These principles guide everything we do and shape our commitment to excellence.")}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrophyIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t("quality_excellence", "Quality & Excellence")}</h3>
                <p className="text-slate-600 text-sm">
                  {t("quality_description", "We never compromise on quality. Every product meets the highest standards.")}
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheckIcon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t("security_trust", "Security & Trust")}</h3>
                <p className="text-slate-600 text-sm">
                  {t("security_description", "Your data and privacy are paramount with industry-leading security measures.")}
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <StarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t("innovation", "Innovation")}</h3>
                <p className="text-slate-600 text-sm">
                  {t("innovation_description", "We continuously evolve and embrace new technologies to serve you better.")}
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <HeartIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t("customer_success", "Customer Success")}</h3>
                <p className="text-slate-600 text-sm">
                  {t("customer_description", "Your success is our success. We're committed to helping you achieve your goals.")}
                </p>
              </div>
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">{t("why_choose_us", "Why Choose MonkeyZ?")}</h2>
              <p className="text-xl text-slate-600">
                {t("features_description", "Discover what makes us the preferred choice for digital products and services.")}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4">
                <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">{t("instant_delivery", "Instant Digital Delivery")}</h4>
                  <p className="text-slate-600 text-sm">{t("instant_delivery_desc", "Get your digital products immediately after purchase with automated delivery system.")}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">{t("verified_products", "100% Genuine Products")}</h4>
                  <p className="text-slate-600 text-sm">{t("verified_products_desc", "All our products are sourced from authorized distributors and verified for authenticity.")}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">{t("expert_support", "Expert Customer Support")}</h4>
                  <p className="text-slate-600 text-sm">{t("expert_support_desc", "Our knowledgeable support team is available 24/7 to assist you with any questions.")}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">{t("secure_payments", "Secure Payment Processing")}</h4>
                  <p className="text-slate-600 text-sm">{t("secure_payments_desc", "All transactions are protected with bank-level encryption and security protocols.")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">{t("our_team", "Our Dedicated Team")}</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              {t("team_description", "Behind MonkeyZ is a passionate team of technology enthusiasts, security experts, and customer service professionals who work tirelessly to deliver exceptional experiences.")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">{t("experienced", "Experienced")}</span>
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">{t("dedicated", "Dedicated")}</span>
              <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">{t("customer_focused", "Customer-Focused")}</span>
              <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">{t("innovative", "Innovative")}</span>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">{t("ready_to_start", "Ready to Get Started?")}</h2>
            <p className="text-xl mb-8 text-blue-100">
              {t("cta_description", "Join thousands of satisfied customers who trust MonkeyZ for their digital product needs.")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/products" 
                className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200"
              >
                {t("browse_products", "Browse Products")}
              </a>
              <a 
                href="/contact" 
                className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-200"
              >
                {t("contact_us", "Contact Us")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutUs;
