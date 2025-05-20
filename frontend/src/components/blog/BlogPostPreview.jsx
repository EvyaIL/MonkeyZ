import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const BlogPostPreview = ({ post }) => {
  const { t, i18n } = useTranslation(); // Add i18n here
  const { title, date, author, slug, summary, image } = post;

  // Select the correct language for title and summary
  const currentLanguage = i18n.language.split('-')[0]; // Get 'en' or 'he'
  const postTitle = title[currentLanguage] || title.en;
  const postSummary = summary[currentLanguage] || summary.en;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden transform transition-all hover:scale-105 duration-300 border border-gray-200 dark:border-gray-700">
      {image && (
        <Link to={`/blog/${slug}`}>
          {/* Use postTitle for alt text */}
          <img src={image} alt={postTitle} className="w-full h-48 object-cover" />
        </Link>
      )}
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-accent mb-2">
          <Link to={`/blog/${slug}`} className="hover:underline">
            {/* Use postTitle here */}
            {postTitle}
          </Link>
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {t('posted_on')} {new Date(date).toLocaleDateString()} {t('by')} {author}
        </p>
        {/* Use postSummary here */}
        <p className="text-gray-700 dark:text-gray-300 mb-4">{postSummary}</p>
        <Link
          to={`/blog/${slug}`}
          className="inline-block bg-accent text-white font-semibold py-2 px-4 rounded hover:bg-accent-dark transition-colors duration-300"
        >
          {t('read_more')}
        </Link>
      </div>
    </div>
  );
};

export default BlogPostPreview;
