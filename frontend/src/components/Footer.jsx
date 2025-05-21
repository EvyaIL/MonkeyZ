import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white py-8 px-4 mt-12 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Brand and copyright */}
        <div className="text-center md:text-start">
          <span className="text-primary dark:text-accent font-bold text-xl">MonkeyZ</span> &copy; {currentYear}
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{t("premium_services")}</p>
        </div>

        {/* Navigation links */}
        <nav className="flex flex-col md:flex-row gap-4 md:gap-8 text-sm items-center" aria-label="Footer Navigation">
          <Link to="/about" className="hover:text-accent transition-colors">{t("about_us")}</Link>
          <Link to="/faq" className="hover:text-accent transition-colors">{t("faq")}</Link>
          <Link to="/contact" className="hover:text-accent transition-colors">{t("contact")}</Link>
          <a href="mailto:support@monkeyz.co.il" className="text-accent hover:text-accent/80 transition-colors underline">
            support@monkeyz.co.il
          </a>
        </nav>
        
        {/* Social media and verification links */}
        <div className="flex gap-6 mt-2 md:mt-0">
          <a 
            href="https://discord.gg/3MZzKkd7qR" 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="Discord" 
            className="hover:text-accent transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.608 1.2495-1.8447-.2762-3.6828-.2762-5.4899 0-.1634-.3933-.4056-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
            </svg>
          </a>
          <a 
            href="https://instagram.com/monkeyzofficial" 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="Instagram" 
            className="hover:text-accent transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
          <a 
            href="https://www.zap.co.il/monkeyz" 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="Zap" 
            className="hover:text-accent transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.47 12.24L9.53 3.47L20.53 10.24L14.47 19.01L3.47 12.24Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12L16 14.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <a 
            href="https://www.trustpilot.com/review/monkeyz.co.il" 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="Trustpilot" 
            className="hover:text-accent transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
          </a>
        </div>
      </div>
      {/* Legal */}
      <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-8 max-w-7xl mx-auto">
        <p>{`${t("copyright_prefix", "All rights reserved")} © ${currentYear} MonkeyZ`}</p>
        <p className="mt-2">
          {t("protected_by_recaptcha")} 
          <Link to="/privacy-policy" className="text-accent hover:underline mx-1">
            {t("privacy_policy")}
          </Link> 
          {t("and")} 
          <Link to="/terms-of-service" className="text-accent hover:underline mx-1">
            {t("terms_of_service")}
          </Link>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
