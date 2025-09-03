import React, { useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
// Corrected import: directly use blogPosts array
import { blogPosts } from '../data/BlogData'; 
import BlogPostPreview from '../components/blog/BlogPostPreview';
import { addStructuredData } from '../lib/seo-helper';
import "./BlogPage.css";

const BlogPage = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'he';
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Corrected usage: directly use the imported array
  const posts = blogPosts;
  
  const categories = useMemo(() => {
    const cats = ["all", ...new Set(posts.map(post => post.category).filter(Boolean))];
    return cats;
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let filtered = posts;
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(post => {
        const title = post.title[lang] || post.title.en || "";
        const summary = post.summary[lang] || post.summary.en || "";
        return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
               summary.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    return filtered;
  }, [posts, selectedCategory, searchTerm, lang]); 
  
  useEffect(() => {
    // Add structured data for blog page
    const blogSchema = {
      "@context": "https://schema.org",
      "@type": "Blog",
      "headline": lang === 'he' ? 'הבלוג של MonkeyZ' : 'MonkeyZ Blog',
      "description": lang === 'he' ? 'חדשות, עדכונים ומחשבות מצוות MonkeyZ.' : 'News, updates, and thoughts from the MonkeyZ team.',
      "url": "https://monkeyz.co.il/blog",
      "blogPosts": posts.map(post => ({
        "@type": "BlogPosting",
        "headline": post.title[lang] || post.title.en,
        "description": post.summary[lang] || post.summary.en,
        "image": post.image,
        "datePublished": post.date,
        "author": {
          "@type": "Person",
          "name": post.author
        },
        "url": `https://monkeyz.co.il/blog/${post.slug}`
      }))
    };
    
    addStructuredData(blogSchema);
    
    // Clean up when component unmounts
    return () => {
      const script = document.getElementById('structured-data');
      if (script) script.remove();
    };
  }, [lang, posts]);

  return (
    <>
      <Helmet>
        <title>{`MonkeyZ - ${t('blog_title') || (lang === 'he' ? 'בלוג' : 'Blog')} | Digital Product Insights`}</title>
        <meta 
          name="description" 
          content={t('blog_meta_description') || (lang === 'he' ? 'קראו את הפוסטים האחרונים בבלוג של MonkeyZ על אבטחת סייבר, אחסון בענן, VPN ופתרונות דיגיטליים.' : 'Read the latest posts from the MonkeyZ blog about cybersecurity, cloud storage, VPN, and digital solutions.')} 
        />
        <meta name="keywords" content="MonkeyZ blog, digital products, cybersecurity tips, VPN guides, cloud storage solutions, software tutorials" />
        <link rel="canonical" href="https://monkeyz.co.il/blog" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:title" content={`MonkeyZ - ${t('blog_title') || (lang === 'he' ? 'בלוג' : 'Blog')} | Digital Product Insights`} />
        <meta 
          property="og:description" 
          content={t('blog_meta_description') || (lang === 'he' ? 'קראו את הפוסטים האחרונים בבלוג של MonkeyZ.' : 'Read the latest posts from the MonkeyZ blog.')}/>
        <meta property="og:url" content="https://monkeyz.co.il/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://monkeyz.co.il/images/blog/blog-header.jpg" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`MonkeyZ - ${t('blog_title') || (lang === 'he' ? 'בלוג' : 'Blog')}`} />
        <meta 
          name="twitter:description" 
          content={t('blog_meta_description') || (lang === 'he' ? 'קראו את הפוסטים האחרונים בבלוג של MonkeyZ.' : 'Read the latest posts from the MonkeyZ blog.')}/>
        <meta name="twitter:image" content="https://monkeyz.co.il/images/blog/blog-header.jpg" />
      </Helmet>
      <div className="blog-container">
        <div className="blog-content">
          <div className="blog-header">
            <h1 className="blog-title">
              {t('blog_header') || (lang === 'he' ? 'הבלוג שלנו' : 'Our Blog')}
            </h1>
            <p className="blog-subtitle">
              {t('blog_subheader') || (lang === 'he' ? 'חדשות, עדכונים ומחשבות מצוות MonkeyZ.' : 'News, updates, and thoughts from the MonkeyZ team.')}
            </p>
          </div>

          <div className="blog-search">
            <input
              type="text"
              className="blog-search-input"
              placeholder={t("search_blog", "Search blog posts...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="blog-search-icon">🔍</div>
          </div>

          <div className="blog-categories">
            {categories.map(category => (
              <button
                key={category}
                className={`blog-category-filter ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category === "all" ? t("all_categories", "All") : category}
              </button>
            ))}
          </div>

          {filteredPosts.length > 0 ? (
            <div className="blog-grid">
              {filteredPosts.map(post => (
                <div key={post.id} className="blog-post-card">
                  <BlogPostPreview post={post} />
                </div>
              ))}
            </div>
          ) : (
            <div className="blog-no-posts">
              <h2 className="blog-no-posts-title">
                {t('blog_no_posts_title', 'No posts found')}
              </h2>
              <p className="blog-no-posts-text">
                {t('blog_no_posts') || (lang === 'he' ? 'אין פוסטים להצגה כרגע. חזרו בקרוב!' : 'No posts to display yet. Check back soon!')}
              </p>
            </div>
          )}

          <div className="blog-newsletter">
            <h2 className="blog-newsletter-title">
              {t("newsletter_title", "Stay Updated")}
            </h2>
            <p className="blog-newsletter-text">
              {t("newsletter_text", "Subscribe to our newsletter to get the latest updates and insights directly to your inbox.")}
            </p>
            <div className="blog-newsletter-form">
              <input
                type="email"
                className="blog-newsletter-input"
                placeholder={t("newsletter_email", "Enter your email")}
              />
              <button className="blog-newsletter-button">
                {t("subscribe", "Subscribe")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogPage;
