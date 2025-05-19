import React from "react";
// Remove ThemeSwitcher import
import { useTranslation } from "react-i18next"; // For potential future translations in footer

const Footer = () => {
  const { t } = useTranslation(); // For potential future translations

  return (
    <footer className="bg-secondary text-white py-8 px-4 mt-12 border-t border-gray-700">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <span className="text-accent font-bold text-xl">MonkeyZ</span> &copy; {new Date().getFullYear()}<br />
          <span className="text-gray-400 text-sm">Premium Products & Services</span>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-6 text-sm items-center">
          <a href="/about" className="hover:text-accent transition">About Us</a>
          <a href="/faq" className="hover:text-accent transition">FAQ</a>
          <a href="/contact" className="hover:text-accent transition">Contact</a>
          <a href="mailto:support@monkeyz.co.il" className="text-accent underline">support@monkeyz.co.il</a>
        </div>
        <div className="flex gap-4 mt-2 md:mt-0">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-accent transition"><i className="fab fa-facebook-f"></i>FB</a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-accent transition"><i className="fab fa-instagram"></i>IG</a>
        </div>
      </div>
      <div className="text-center text-xs text-gray-500 mt-4">
        This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.
      </div>
    </footer>
  );
};

export default Footer;
