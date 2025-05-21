import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPostBySlug } from '../data/BlogData'; // Assuming BlogData.js is in src/data
import NotFound from './NotFound';
import { Helmet } from 'react-helmet';
import BlogCommentSection from '../components/blog/BlogCommentSection';

const BlogPostPage = () => {
  const { slug } = useParams();
  const { t, i18n } = useTranslation(); // Add i18n here
  const post = getPostBySlug(slug);

  if (!post) {
    return <NotFound />;
  }

  // Select the correct language for title, summary, and content
  const currentLanguage = i18n.language.split('-')[0]; // Get 'en' or 'he'
  const postTitle = post.title[currentLanguage] || post.title.en;
  const postSummary = post.summary[currentLanguage] || post.summary.en;
  const postContent = post.content[currentLanguage] || post.content.en;

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        {/* Use postTitle here */}
        <title>{postTitle} - {t('blog')} - MonkeyZ</title>
        {/* Use postSummary or postTitle for description */}
        <meta name="description" content={postSummary || postTitle} />
      </Helmet>
      <article className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 md:p-10 border border-gray-200 dark:border-gray-700">
        {post.image && (
          // Use postTitle for alt text
          <img src={post.image} alt={postTitle} className="w-full h-auto max-h-96 object-cover rounded-md mb-8" />
        )}
        {/* Use postTitle here */}
        <h1 className="text-4xl md:text-5xl font-bold text-primary dark:text-white mb-4">{postTitle}</h1>
        <p className="text-md text-gray-500 dark:text-gray-400 mb-6">
          {t('posted_on')} {new Date(post.date).toLocaleDateString()} {t('by')} <span className="font-semibold text-accent">{post.author}</span>
        </p>
        <div
          // Ensure text within prose is visible on dark background
          className="prose prose-lg lg:prose-xl max-w-none dark:prose-invert prose-headings:text-accent prose-a:text-accent hover:prose-a:text-accent-dark"
          dangerouslySetInnerHTML={{ __html: postContent }}
        />
        
        {/* Add comments section */}
        <BlogCommentSection postId={post.id} />
        
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
