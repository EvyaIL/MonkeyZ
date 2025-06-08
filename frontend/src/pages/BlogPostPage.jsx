import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPostBySlug } from '../data/BlogData'; // Assuming BlogData.js is in src/data
import { Helmet } from 'react-helmet';
import { generateArticleSchema, addStructuredData, generateBreadcrumbSchema } from '../lib/seo-helper';

const BlogPostPage = () => {
  const { slug } = useParams();
  const { t, i18n } = useTranslation(); // Add i18n here
  const post = getPostBySlug(slug);

  // Select the correct language for title, summary, and content
  const currentLanguage = i18n.language.split('-')[0]; // Get 'en' or 'he'
  const postTitle = post?.title?.[currentLanguage] || post?.title?.en;
  const postSummary = post?.summary?.[currentLanguage] || post?.summary?.en;
  const postContent = post?.content?.[currentLanguage] || post?.content?.en;

  useEffect(() => {
    if (!post) return;
    // Create post object for schema generation
    if (post) {
      const articleData = {
        title: postTitle,
        summary: postSummary,
        imageUrl: post.image,
        publishDate: post.date,
        lastModified: post.lastModified || post.date,
        slug: slug,
        author: post.author || 'MonkeyZ Team',
        tags: post.tags || ['blog', 'digital products'],
        category: post.category || 'Digital Products'
      };
      
      // Generate breadcrumb schema
      const breadcrumbs = [
        { name: t('home'), url: 'https://monkeyz.co.il/' },
        { name: t('blog'), url: 'https://monkeyz.co.il/blog' },
        { name: postTitle, url: `https://monkeyz.co.il/blog/${slug}` }
      ];
      
      // Generate and add Article schema
      const articleSchema = generateArticleSchema(articleData);
      const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
      
      // Add both schemas as an array
      addStructuredData([articleSchema, breadcrumbSchema]);
    }
  }, [post, slug, postTitle, postSummary, t]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>{postTitle} - {t('blog')} - MonkeyZ</title>
        <meta name="description" content={postSummary || postTitle} />
        <meta name="keywords" content={`${post.tags ? post.tags.join(', ') : 'blog, monkeyz'}, digital products, cybersecurity, ${postTitle.toLowerCase()}`} />
        <link rel="canonical" href={`https://monkeyz.co.il/blog/${slug}`} />
        <meta name="author" content={post.author || 'MonkeyZ Team'} />
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
        <meta name="twitter:label1" content="Reading time" />
        <meta name="twitter:data1" content={`${post.readingTime || '5'} min`} />
      </Helmet>
      
      {/* Breadcrumb navigation */}
      <nav className="max-w-3xl mx-auto mb-4 text-sm text-gray-500 dark:text-gray-400">
        <ol className="flex flex-wrap items-center space-x-1 rtl:space-x-reverse">
          <li><Link to="/" className="hover:text-accent">{t('home')}</Link></li>
          <li><span className="mx-1">›</span></li>
          <li><Link to="/blog" className="hover:text-accent">{t('blog')}</Link></li>
          <li><span className="mx-1">›</span></li>
          <li className="text-accent font-medium truncate max-w-xs">{postTitle}</li>
        </ol>
      </nav>
      
      <article className="max-w-3xl mx-auto bg-white dark:bg-gray-800 border border-accent/30 dark:border-accent/30 rounded-lg shadow-lg p-4 md:p-6 backdrop-blur-sm">
        {post.image && (
          <img src={post.image} alt={postTitle} className="w-full h-auto max-h-96 object-cover rounded-md mb-8" />
        )}
        <h1 className="text-4xl md:text-5xl font-bold text-primary dark:text-white mb-4">{postTitle}</h1>
        <p className="text-md text-gray-500 dark:text-gray-400 mb-6">
          {t('posted_on')} {new Date(post.date).toLocaleDateString()} {t('by')} <span className="font-semibold text-accent">{post.author}</span>
        </p>
        
        {/* Add post tags if available */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag, index) => (
              <span key={index} className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-sm">
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        <div
          className="prose prose-lg lg:prose-xl max-w-none dark:prose-invert prose-headings:text-accent prose-a:text-accent hover:prose-a:text-accent-dark"
          dangerouslySetInnerHTML={{ __html: postContent }}
        />
        
        {/* Related posts section (if available) */}
        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-primary dark:text-white mb-4">{t('related_posts')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {post.relatedPosts.map((relatedPost, index) => (
                <Link to={`/blog/${relatedPost.slug}`} key={index} className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <h3 className="font-medium text-accent">{relatedPost.title[currentLanguage] || relatedPost.title.en}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{relatedPost.summary[currentLanguage] || relatedPost.summary.en}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-10 pt-6 border-t border-border">
          <Link to="/blog" className="text-accent hover:underline">
            &larr; {t('back_to_blog')}
          </Link>
        </div>
      </article>
    </div>
  );
};

export default BlogPostPage;
