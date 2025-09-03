import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPostBySlug } from '../data/BlogData';
import { Helmet } from 'react-helmet-async';
import { generateArticleSchema, addStructuredData, generateBreadcrumbSchema } from '../lib/seo-helper';
import { isRTL } from '../utils/language';
import './BlogPostPage.css';

const BlogPostPage = () => {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const [relatedPosts, setRelatedPosts] = useState([]);
  const post = getPostBySlug(slug);

  const currentLanguage = i18n.language.split('-')[0];
  const isRTLLanguage = isRTL(currentLanguage);
  
  const postTitle = post?.title?.[currentLanguage] || post?.title?.en || 'Post Title';
  const postSummary = post?.summary?.[currentLanguage] || post?.summary?.en || '';
  const postContent = post?.content?.[currentLanguage] || post?.content?.en || '';
  const postAuthor = post?.author?.[currentLanguage] || post?.author?.en || post?.author || t('monkeyz_team');

  useEffect(() => {
    if (!post) return;
    
    // Simulate getting related posts (you'll need to implement this in BlogData.js)
    const mockRelatedPosts = [
      {
        slug: 'cybersecurity-tips',
        title: {
          en: 'Essential Cybersecurity Tips',
          he: 'טיפים חיוניים לאבטחת מידע'
        },
        summary: {
          en: 'Learn how to protect your digital assets',
          he: 'למד כיצד להגן על הנכסים הדיגיטליים שלך'
        }
      },
      {
        slug: 'digital-transformation',
        title: {
          en: 'Digital Transformation Guide',
          he: 'מדריך לטרנספורמציה דיגיטלית'
        },
        summary: {
          en: 'Complete guide to digital business transformation',
          he: 'מדריך מלא לטרנספורמציה עסקית דיגיטלית'
        }
      }
    ];
    setRelatedPosts(mockRelatedPosts);

    // SEO and Schema setup
    const articleData = {
      title: postTitle,
      summary: postSummary,
      imageUrl: post.image,
      publishDate: post.date,
      lastModified: post.lastModified || post.date,
      slug: slug,
      author: postAuthor,
      tags: post.tags || ['blog', 'digital products'],
      category: post.category || 'Digital Products'
    };
    
    const breadcrumbs = [
      { name: t('home'), url: 'https://monkeyz.co.il/' },
      { name: t('blog'), url: 'https://monkeyz.co.il/blog' },
      { name: postTitle, url: `https://monkeyz.co.il/blog/${slug}` }
    ];
    
    const articleSchema = generateArticleSchema(articleData);
    const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
    addStructuredData([articleSchema, breadcrumbSchema]);
  }, [post, slug, postTitle, postSummary, postAuthor, t]);

  if (!post) {
    return (
      <div className="blog-post-container">
        <div className="blog-post-content">
          <div className="text-center">
            <h1 className="blog-post-title">{t('post_not_found')}</h1>
            <p className="blog-post-summary">{t('post_not_found_message')}</p>
            <Link to="/blog" className="blog-nav-button">
              <svg className="blog-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('back_to_blog')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`blog-post-container ${isRTLLanguage ? 'rtl' : 'ltr'}`}>
      <Helmet>
        <title>{postTitle} - {t('blog')} - MonkeyZ</title>
        <meta name="description" content={postSummary || postTitle} />
        <meta name="keywords" content={`${post.tags ? post.tags.join(', ') : 'blog, monkeyz'}, digital products, cybersecurity, ${postTitle.toLowerCase()}`} />
        <link rel="canonical" href={`https://monkeyz.co.il/blog/${slug}`} />
        <meta name="author" content={postAuthor} />
        {post.category && <meta name="category" content={post.category} />}
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={`${postTitle} - MonkeyZ`} />
        <meta property="og:description" content={postSummary || postTitle} />
        <meta property="og:image" content={post.image || 'https://monkeyz.co.il/logo512.png'} />
        <meta property="og:url" content={`https://monkeyz.co.il/blog/${slug}`} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={post.date} />
        <meta property="article:section" content={post.category || 'Digital Products'} />
        {post.tags && post.tags.map((tag, index) => (
          <meta key={index} property="article:tag" content={tag} />
        ))}
        {post.lastModified && <meta property="article:modified_time" content={post.lastModified} />}
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@monkeyz_co_il" />
        <meta name="twitter:creator" content={post.twitterHandle || '@monkeyz_co_il'} />
        <meta name="twitter:title" content={`${postTitle} - MonkeyZ`} />
        <meta name="twitter:description" content={postSummary || postTitle} />
        <meta name="twitter:image" content={post.image || 'https://monkeyz.co.il/logo512.png'} />
      </Helmet>
      
      <div className="blog-post-content">
        {/* Breadcrumb Navigation */}
        <nav className="blog-post-breadcrumb">
          <Link to="/" className="breadcrumb-link">{t('home')}</Link>
          <span className="breadcrumb-separator">
            {isRTLLanguage ? '‹' : '›'}
          </span>
          <Link to="/blog" className="breadcrumb-link">{t('blog')}</Link>
          <span className="breadcrumb-separator">
            {isRTLLanguage ? '‹' : '›'}
          </span>
          <span className="breadcrumb-current">{postTitle}</span>
        </nav>

        {/* Post Header */}
        <header className="blog-post-header">
          {post.category && (
            <div className="blog-post-category">{post.category}</div>
          )}
          <h1 className="blog-post-title">{postTitle}</h1>
          <div className="blog-post-meta">
            <div className="blog-post-date">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
              {new Date(post.date).toLocaleDateString(isRTLLanguage ? 'he-IL' : 'en-US')}
            </div>
            <div className="blog-post-author">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              {postAuthor}
            </div>
          </div>
          {postSummary && (
            <p className="blog-post-summary">{postSummary}</p>
          )}
        </header>

        {/* Featured Image */}
        {post.image && (
          <img 
            src={post.image} 
            alt={postTitle} 
            className="blog-post-image"
            loading="lazy"
          />
        )}

        {/* Post Content */}
        <article className="blog-post-body">
          <div 
            className={`blog-post-content-text ${isRTLLanguage ? 'rtl' : 'ltr'}`}
            dangerouslySetInnerHTML={{ __html: postContent }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="blog-post-tags">
              <h3 className="blog-post-tags-title">{t('tags')}</h3>
              <div className="blog-post-tags-list">
                {post.tags.map((tag, index) => (
                  <Link 
                    key={index} 
                    to={`/blog?tag=${tag}`} 
                    className="blog-post-tag"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Navigation */}
        <div className="blog-post-navigation">
          <Link to="/blog" className="blog-nav-button">
            <svg className="blog-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRTLLanguage ? "m14 7 5 5m0 0-5 5m5-5H6" : "M10 19l-7-7m0 0l7-7m-7 7h18"} />
            </svg>
            {t('back_to_blog')}
          </Link>
          
          <Link to={`/blog/${slug}/share`} className="blog-nav-button">
            {t('share_post')}
            <svg className="blog-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </Link>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="related-posts-section">
            <h2 className="related-posts-title">{t('related_posts')}</h2>
            <div className="related-posts-grid">
              {relatedPosts.map((relatedPost, index) => (
                <Link 
                  key={index} 
                  to={`/blog/${relatedPost.slug}`} 
                  className="related-post-card"
                >
                  <h3 className="related-post-title">
                    {relatedPost.title[currentLanguage] || relatedPost.title.en}
                  </h3>
                  <p className="related-post-summary">
                    {relatedPost.summary[currentLanguage] || relatedPost.summary.en}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default BlogPostPage;
