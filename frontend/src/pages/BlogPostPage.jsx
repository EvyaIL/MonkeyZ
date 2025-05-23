import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPostBySlug } from '../data/BlogData'; // Assuming BlogData.js is in src/data
import { Helmet } from 'react-helmet';
import { generateArticleSchema, addStructuredData, generateBreadcrumbSchema } from '../lib/seo-helper';
import { apiService } from '../lib/apiService';
import { useGlobalProvider } from '../context/GlobalProvider';

const BlogPostPage = () => {
  const { slug } = useParams();
  const { t, i18n } = useTranslation(); // Add i18n here
  const { user, notify } = useGlobalProvider();
  const post = getPostBySlug(slug);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);

  // Select the correct language for title, summary, and content
  const currentLanguage = i18n.language.split('-')[0]; // Get 'en' or 'he'
  const postTitle = post?.title?.[currentLanguage] || post?.title?.en;
  const postSummary = post?.summary?.[currentLanguage] || post?.summary?.en;
  const postContent = post?.content?.[currentLanguage] || post?.content?.en;

  // Load comments
  useEffect(() => {
    const fetchComments = async () => {
      if (!post?.id) return;
      try {
        const { data, error } = await apiService.get(`/blog/posts/${post.id}/comments`);
        if (error) {
          console.error('Error fetching comments:', error);
          notify({ type: 'error', message: t('error_loading_comments') });
        } else {
          setComments(data || []);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchComments();
  }, [post?.id, notify, t]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) {
      notify({ type: 'warning', message: t('please_login_to_comment') });
      return;
    }

    if (!newComment.trim()) {
      notify({ type: 'warning', message: t('comment_cannot_be_empty') });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await apiService.post(`/blog/posts/${post.id}/comments`, {
        content: newComment.trim(),
        postId: post.id,
        postTitle: postTitle
      });

      if (error) {
        notify({ type: 'error', message: t('error_posting_comment') });
      } else {
        setComments(prev => [...prev, data]);
        setNewComment('');
        notify({ type: 'success', message: t('comment_posted_successfully') });
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      notify({ type: 'error', message: t('error_posting_comment') });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        
        {/* Comments Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-accent mb-6">{t('comments')}</h2>
          
          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="mb-8">
            <div className="mb-4">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('write_a_comment')}
              </label>
              <textarea
                id="comment"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-accent focus:border-accent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('share_your_thoughts')}
                disabled={!user || isSubmitting}
              />
            </div>
            <button
              type="submit"
              disabled={!user || isSubmitting}
              className={`px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/80 transition-colors ${(!user || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? t('posting...') : t('post_comment')}
            </button>
            {!user && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t('please_login_to_comment_message')}
              </p>
            )}
          </form>

          {/* Comments List */}
          <div className="space-y-6">
            {loadingComments ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent mx-auto"></div>
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">
                {t('no_comments_yet')}
              </p>
            ) : (
              comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-accent">
                        {comment.username || t('anonymous')}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(comment.date).toLocaleDateString()}
                      </p>
                    </div>
                    {user && comment.userId === user.id && (
                      <button
                        onClick={async () => {
                          if (window.confirm(t('confirm_delete_comment'))) {
                            try {
                              await apiService.delete(`/blog/comments/${comment.id}`);
                              setComments(prev => prev.filter(c => c.id !== comment.id));
                              notify({ type: 'success', message: t('comment_deleted_successfully') });
                            } catch (error) {
                              console.error('Error deleting comment:', error);
                              notify({ type: 'error', message: t('error_deleting_comment') });
                            }
                          }
                        }}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        {t('delete')}
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-gray-700 dark:text-gray-300">
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

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
