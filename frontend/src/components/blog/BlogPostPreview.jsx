import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './BlogPostPreview.css';

const BlogPostPreview = ({ post }) => {
  const { t, i18n } = useTranslation();
  const { title, date, author, slug, summary, image, category } = post;

  // Select the correct language for title and summary
  const currentLanguage = i18n.language.split('-')[0];
  const postTitle = title[currentLanguage] || title.en;
  const postSummary = summary[currentLanguage] || summary.en;

  return (
    <article className="blog-preview-card">
      {image && (
        <div className="blog-preview-image-container">
          <Link to={`/blog/${slug}`}>
            <img 
              src={image} 
              alt={postTitle} 
              className="blog-preview-image"
              loading="lazy"
            />
          </Link>
          {category && (
            <span className="blog-preview-category">{category}</span>
          )}
        </div>
      )}
      
      <div className="blog-preview-content">
        <div className="blog-preview-meta">
          <span className="blog-preview-date">
            📅 {new Date(date).toLocaleDateString(currentLanguage === 'he' ? 'he-IL' : 'en-US')}
          </span>
          <span className="blog-preview-author">
            👤 {author}
          </span>
        </div>
        
        <h2 className="blog-preview-title">
          <Link to={`/blog/${slug}`} className="blog-preview-title-link">
            {postTitle}
          </Link>
        </h2>
        
        <p className="blog-preview-summary">{postSummary}</p>
        
        <Link
          to={`/blog/${slug}`}
          className="blog-preview-read-more"
        >
          {t('read_more', 'Read More')} →
        </Link>
      </div>
    </article>
  );
};

export default BlogPostPreview;
