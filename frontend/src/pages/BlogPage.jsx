import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
// Corrected import: directly use blogPosts array
import { blogPosts } from '../data/BlogData'; 
import BlogPostPreview from '../components/blog/BlogPostPreview';

const BlogPage = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'he';
  // Corrected usage: directly use the imported array
  const posts = blogPosts; 

  return (
    <>
      <Helmet>
        <title>{`MonkeyZ - ${t('blog_title') || (lang === 'he' ? 'בלוג' : 'Blog')}`}</title>
        <meta 
          name="description" 
          content={t('blog_meta_description') || (lang === 'he' ? 'קראו את הפוסטים האחרונים בבלוג של MonkeyZ.' : 'Read the latest posts from the MonkeyZ blog.')} 
        />
        <meta property="og:title" content={`MonkeyZ - ${t('blog_title') || (lang === 'he' ? 'בלוג' : 'Blog')}`} />
        <meta 
          property="og:description" 
          content={t('blog_meta_description') || (lang === 'he' ? 'קראו את הפוסטים האחרונים בבלוג של MonkeyZ.' : 'Read the latest posts from the MonkeyZ blog.')}/>
        {/* Add other OG tags like image if you have a generic blog image */}
      </Helmet>
      <div className="bg-primary min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12 text-center">
            <h1 className="text-5xl font-extrabold text-accent tracking-tight">
              {t('blog_header') || (lang === 'he' ? 'הבלוג שלנו' : 'Our Blog')}
            </h1>
            <p className="mt-4 text-xl text-gray-300 max-w-2xl mx-auto">
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
