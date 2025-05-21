import React from "react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 dark:bg-gray-950 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold">MonkeyZ</h3>
            <p className="text-gray-300 text-sm mt-1">
              {t('footer.tagline', 'Premium products and services')}
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 mb-4 md:mb-0">
            <a href="/" className="text-gray-300 hover:text-white transition">
              {t('footer.home', 'Home')}
            </a>
            <a href="/products" className="text-gray-300 hover:text-white transition">
              {t('footer.products', 'Products')}
            </a>
            <a href="/contact" className="text-gray-300 hover:text-white transition">
              {t('footer.contact', 'Contact')}
            </a>
          </div>
          
          <div className="text-gray-400 text-sm">
            <p>© {year} MonkeyZ. {t('footer.rights', 'All rights reserved.')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
