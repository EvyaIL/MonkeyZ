/**
 * SEO Enhancement Helper Script
 * 
 * This script generates structured data for product pages
 * It can be imported and used within your React components
 */

/**
 * Generates Product structured data for a product page
 * @param {Object} product - The product object
 * @returns {Object} - JSON-LD structured data object
 */
export const generateProductSchema = (product) => {
  if (!product) return null;
  
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.imageUrl,
    "sku": product.id || product._id,
    "mpn": product.id || product._id,
    "brand": {
      "@type": "Brand",
      "name": "MonkeyZ"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://monkeyz.co.il/product/${encodeURIComponent(product.name)}`,
      "priceCurrency": "ILS",
      "price": product.price,
      "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "MonkeyZ",
        "url": "https://monkeyz.co.il"
      }
    }
  };
};

/**
 * Generates BreadcrumbList structured data
 * @param {Array} breadcrumbs - Array of breadcrumb items with name and url properties
 * @returns {Object} - JSON-LD structured data object
 */
export const generateBreadcrumbSchema = (breadcrumbs) => {
  if (!breadcrumbs || !Array.isArray(breadcrumbs)) return null;
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
};

/**
 * Generates FAQ structured data
 * @param {Array} faqItems - Array of FAQ items with question and answer properties
 * @returns {Object} - JSON-LD structured data object
 */
export const generateFAQSchema = (faqItems) => {
  if (!faqItems || !Array.isArray(faqItems)) return null;
  
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };
};

/**
 * Generates Article structured data for blog posts
 * @param {Object} post - The blog post object
 * @returns {Object} - JSON-LD structured data object
 */
export const generateArticleSchema = (post) => {
  if (!post) return null;
  
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.summary || post.excerpt,
    "image": post.imageUrl,
    "datePublished": post.publishDate,
    "dateModified": post.lastModified || post.publishDate,
    "author": {
      "@type": "Organization",
      "name": "MonkeyZ",
      "url": "https://monkeyz.co.il"
    },
    "publisher": {
      "@type": "Organization",
      "name": "MonkeyZ",
      "logo": {
        "@type": "ImageObject",
        "url": "https://monkeyz.co.il/logo192.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://monkeyz.co.il/blog/${post.slug}`
    }
  };
};

/**
 * Utility function to add structured data to a page
 * @param {Object} schemaData - The structured data object
 */
export const addStructuredData = (schemaData) => {
  if (!schemaData) return;
  
  // Remove any existing schema with the same ID if it exists
  const existingScript = document.getElementById('structured-data');
  if (existingScript) {
    existingScript.remove();
  }
  
  // Create new script element with the structured data
  const script = document.createElement('script');
  script.id = 'structured-data';
  script.type = 'application/ld+json';
  script.innerHTML = JSON.stringify(schemaData);
  
  // Add to document head
  document.head.appendChild(script);
};

/**
 * Updates meta tags for SEO
 * @param {Object} metaData - Object containing meta tag values
 */
export const updateMetaTags = (metaData) => {
  if (!metaData) return;
  
  // Title
  if (metaData.title) {
    document.title = metaData.title;
    
    // Update Open Graph and Twitter title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', metaData.title);
    }
    
    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', metaData.title);
    }
  }
  
  // Description
  if (metaData.description) {
    let descTag = document.querySelector('meta[name="description"]');
    if (descTag) {
      descTag.setAttribute('content', metaData.description);
    }
    
    // Update Open Graph and Twitter description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', metaData.description);
    }
    
    let twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) {
      twitterDesc.setAttribute('content', metaData.description);
    }
  }
  
  // Canonical URL
  if (metaData.canonicalUrl) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', metaData.canonicalUrl);
    } else {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', metaData.canonicalUrl);
      document.head.appendChild(canonical);
    }
    
    // Update Open Graph and Twitter URL
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', metaData.canonicalUrl);
    }
    
    let twitterUrl = document.querySelector('meta[name="twitter:url"]');
    if (twitterUrl) {
      twitterUrl.setAttribute('content', metaData.canonicalUrl);
    }
  }
  
  // Image
  if (metaData.image) {
    // Update Open Graph image
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      ogImage.setAttribute('content', metaData.image);
    }
    
    // Update Twitter image
    let twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage) {
      twitterImage.setAttribute('content', metaData.image);
    }
  }
};

/**
 * Example usage in a React component:
 * 
 * import { useEffect } from 'react';
 * import { generateProductSchema, addStructuredData, updateMetaTags } from '../lib/seo-helper';
 * 
 * const ProductPage = ({ product }) => {
 *   useEffect(() => {
 *     // Add structured data
 *     const productSchema = generateProductSchema(product);
 *     addStructuredData(productSchema);
 *     
 *     // Update meta tags
 *     updateMetaTags({
 *       title: `${product.name} - MonkeyZ Premium Digital Products`,
 *       description: product.description,
 *       canonicalUrl: `https://monkeyz.co.il/product/${encodeURIComponent(product.name)}`,
 *       image: product.imageUrl
 *     });
 *     
 *     // Cleanup on unmount
 *     return () => {
 *       const script = document.getElementById('structured-data');
 *       if (script) script.remove();
 *     };
 *   }, [product]);
 * 
 *   return (
 *     // Your product page JSX
 *   );
 * };
 */
