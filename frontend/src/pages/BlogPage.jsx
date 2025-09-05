import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
// Corrected import: directly use blogPosts array
import { blogPosts } from '../data/BlogData'; 
import BlogPostPreview from '../components/blog/BlogPostPreview';
import { addStructuredData } from '../lib/seo-helper';

const BlogPage = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'he';
  // Corrected usage: directly use the imported array
  const posts = blogPosts; 
  
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
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12 text-center">
            <h1 className="text-5xl font-extrabold text-accent tracking-tight">
              {t('blog_header') || (lang === 'he' ? 'הבלוג שלנו' : 'Our Blog')}
            </h1>            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('blog_subheader') || (lang === 'he' ? 'חדשות, עדכונים ומחשבות מצוות MonkeyZ.' : 'News, updates, and thoughts from the MonkeyZ team.')}
            </p>
          </header>

          {posts.length > 0 ? (
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {posts.map(post => (
                <BlogPostPreview key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 text-xl">
              {t('blog_no_posts') || (lang === 'he' ? 'אין פוסטים להצגה כרגע. חזרו בקרוב!' : 'No posts to display yet. Check back soon!')}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default BlogPage;
