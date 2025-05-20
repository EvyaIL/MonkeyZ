import { useEffect, useState } from "react";
import ProductCard from "../components/product/ProductCard";
import ProductShowcase from "../components/product/ProductShowcase";
import { apiService } from "../lib/apiService";
import Spinner from "../components/Spinner";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";

const fallbackProducts = [
  {
    id: 1,
    name: { en: "MonkeyZ Pro Key", he: "מפתח פרו של MonkeyZ" },
    description: {
      en: "Unlock premium features with the MonkeyZ Pro Key. Perfect for power users and businesses.",
      he: "פתחו תכונות פרימיום עם מפתח הפרו של MonkeyZ. מושלם למשתמשים מתקדמים ולעסקים.",
    },
    image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
    price: 49.99,
  },
  {
    id: 2,
    name: { en: "MonkeyZ Cloud Storage", he: "אחסון ענן של MonkeyZ" },
    description: {
      en: "Secure, fast, and reliable cloud storage for all your important files.",
      he: "אחסון ענן מאובטח, מהיר ואמין לכל הקבצים החשובים שלך.",
    },
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
    price: 19.99,
  },
  {
    id: 3,
    name: { en: "MonkeyZ VPN", he: "VPN של MonkeyZ" },
    description: {
      en: "Browse safely and anonymously with our high-speed VPN service.",
      he: "גלשו בבטחה ובאנונימיות עם שירות ה-VPN המהיר שלנו.",
    },
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
    price: 9.99,
  },
  {
    id: 4,
    name: { en: "MonkeyZ Antivirus", he: "אנטי וירוס של MonkeyZ" },
    description: {
      en: "Protect your devices from malware and viruses with real-time protection.",
      he: "הגנו על המכשירים שלכם מתוכנות זדוניות ווירוסים עם הגנה בזמן אמת.",
    },
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80",
    price: 14.99,
  },
  {
    id: 5,
    name: { en: "MonkeyZ Office Suite", he: "חבילת אופיס של MonkeyZ" },
    description: {
      en: "All-in-one office suite for productivity and collaboration.",
      he: "חבילת אופיס כוללת לכלי פרודוקטיביות ושיתוף פעולה.",
    },
    image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
    price: 29.99,
  },
  {
    id: 6,
    name: { en: "MonkeyZ Password Manager", he: "מנהל סיסמאות של MonkeyZ" },
    description: {
      en: "Keep your passwords safe and secure with our easy-to-use manager.",
      he: "שמרו על הסיסמאות שלכם בטוחות ומאובטחות עם מנהל הסיסמאות הידידותי שלנו.",
    },
    image: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80",
    price: 7.99,
  },
  {
    id: 7,
    name: { en: "MonkeyZ Photo Editor", he: "עורך תמונות של MonkeyZ" },
    description: {
      en: "Edit your photos like a pro with advanced tools and filters.",
      he: "ערכו את התמונות שלכם כמו מקצוענים עם כלים ופילטרים מתקדמים.",
    },
    image: "https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=400&q=80",
    price: 12.99,
  },
  {
    id: 8,
    name: { en: "MonkeyZ Music Studio", he: "אולפן מוזיקה של MonkeyZ" },
    description: {
      en: "Create, mix, and share your music with our powerful studio suite.",
      he: "צרו, ערכו ושתפו מוזיקה עם חבילת האולפן העוצמתית שלנו.",
    },
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
    price: 24.99,
  },
];

const Home = () => {
  const [bestSellers, setBestSellers] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loadingBest, setLoadingBest] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [errorBest, setErrorBest] = useState("");
  const [errorRecent, setErrorRecent] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    getBestSellers();
    getRecent();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    document.title = t("home");
  }, [t]);

  const mergeUniqueProducts = (apiProducts, fallback) => {
    const ids = new Set(apiProducts.map((p) => p.id));
    return [...apiProducts, ...fallback.filter((p) => !ids.has(p.id))];
  };

  const getBestSellers = async () => {
    setLoadingBest(true);
    setErrorBest("");
    const { data, error } = await apiService.get("/product/best-sellers");
    if (error || !data || !Array.isArray(data) || data.length === 0) {
      setErrorBest(error ? t("failed_to_load_best_sellers") : "");
      setBestSellers(fallbackProducts);
    } else {
      setBestSellers(data);
    }
    setLoadingBest(false);
  };

  const getRecent = async () => {
    setLoadingRecent(true);
    setErrorRecent("");
    const params = { limit: 8 };
    const { data, error } = await apiService.get("/product/recent", params);
    if (error) {
      setErrorRecent("Failed to load recent products.");
      setRecent(fallbackProducts);
    } else {
      setRecent(mergeUniqueProducts(data || [], fallbackProducts));
    }
    setLoadingRecent(false);
  };

  return (
    <>
      <Helmet>
        <title>{`MonkeyZ - ${t("home")}`}</title>
        <meta name="description" content={t("home_meta_description") || "MonkeyZ offers premium products and services. Discover our unique selection and enjoy fast, reliable service."} />
        <meta property="og:title" content={`MonkeyZ - ${t("home")}`} />
        <meta property="og:description" content={t("home_meta_description") || "MonkeyZ offers premium products and services. Discover our unique selection and enjoy fast, reliable service."} />
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-primary dark:text-accent font-bold text-3xl mb-8" tabIndex={0}>
          {t("home")}
        </h1>

        <section className="w-full max-w-6xl mb-12" aria-label={t("best_sellers")}>
          {loadingBest ? (
            <div className="flex justify-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <Spinner />
            </div>
          ) : errorBest ? (
            <p className="text-error text-center bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700" role="alert">
              {errorBest}
            </p>
          ) : (
            <>
              <ProductShowcase products={bestSellers} title={t("best_sellers")} />
            </>
          )}
        </section>

        <section
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-6 w-full max-w-6xl mt-5"
          aria-label={t("new_products")}
        >
          <h2 className="text-center text-primary font-bold text-2xl mb-4">
            {t("new_products")}
          </h2>
          {loadingRecent ? (
            <Spinner />
          ) : errorRecent ? (
            <p className="text-error text-center" role="alert">
              {errorRecent}
            </p>
          ) : (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {recent.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default Home;
