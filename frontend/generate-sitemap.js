// Sitemap Generator for MonkeyZ
// This script automatically generates a sitemap.xml file based on your routes
// Run with: node generate-sitemap.js

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Base URL of your website
const BASE_URL = 'https://monkeyz.co.il';
// Optional: API endpoint to fetch dynamic content (products, blog posts)
const API_BASE_URL = process.env.API_URL || 'https://monkeyz.co.il/api';

// Main routes from your AppRouter.jsx
const mainRoutes = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/products', priority: 0.9, changefreq: 'weekly' },
  { path: '/about', priority: 0.7, changefreq: 'monthly' },
  { path: '/contact', priority: 0.7, changefreq: 'monthly' },
  { path: '/faq', priority: 0.6, changefreq: 'monthly' },
  { path: '/blog', priority: 0.8, changefreq: 'weekly' },
  { path: '/privacy-policy', priority: 0.5, changefreq: 'monthly' },
  { path: '/terms-of-service', priority: 0.5, changefreq: 'monthly' }
];

// Categories
const categories = [
  'Security',
  'Cloud',
  'Office',
  'Utility'
];

// Sample blog posts - in a real app, fetch from your CMS or database
const blogPosts = [
  {
    slug: 'cybersecurity-tips-for-2025',
    title: 'Cybersecurity Tips for 2025',
    image: 'https://monkeyz.co.il/images/blog/cybersecurity-tips.jpg',
    caption: 'Best practices to keep your digital life secure in 2025',
    lastmod: '2025-05-20',
    author: 'MonkeyZ Security Team',
    category: 'Security',
    lang: ['en', 'he']
  },
  {
    slug: 'cloud-storage-comparison',
    title: 'Cloud Storage Comparison',
    image: 'https://monkeyz.co.il/images/blog/cloud-storage-comparison.jpg',
    caption: 'Comparing the best cloud storage options available today',
    lastmod: '2025-05-15',
    author: 'Cloud Storage Expert',
    category: 'Cloud',
    lang: ['en', 'he']
  },
  {
    slug: 'vpn-benefits-explained',
    title: 'VPN Benefits Explained',
    image: 'https://monkeyz.co.il/images/blog/vpn-benefits.jpg',
    caption: 'Understanding how VPNs protect your privacy online',
    lastmod: '2025-05-18',
    author: 'Privacy Advocate',
    category: 'Security',
    lang: ['en', 'he']
  },
  {
    slug: 'digital-productivity-tools-2025',
    title: 'Top Digital Productivity Tools for 2025',
    image: 'https://monkeyz.co.il/images/blog/productivity-tools.jpg',
    caption: 'The best productivity tools to boost your efficiency',
    lastmod: '2025-05-22',
    author: 'Productivity Expert',
    category: 'Productivity',
    lang: ['en', 'he']
  },
  {
    slug: 'password-security-best-practices',
    title: 'Password Security Best Practices',
    image: 'https://monkeyz.co.il/images/blog/password-security.jpg',
    caption: 'How to create and manage secure passwords',
    lastmod: '2025-05-19',
    author: 'MonkeyZ Security Team',
    category: 'Security',
    lang: ['en', 'he']
  }
];

// Get current date in YYYY-MM-DD format
const getCurrentDate = () => {
  const date = new Date();
  return date.toISOString().split('T')[0];
};

// Fetch products from backend API
async function fetchProductsFromAPI() {
  try {
    // Adjust the API endpoint if needed
    const response = await axios.get(`${API_BASE_URL}/product/all`);
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.products)) {
      return response.data.products;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch products from API:', error);
    return [];
  }
}

// Generate XML for the sitemap
async function generateSitemap() {
  const currentDate = getCurrentDate();
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <!-- Main Pages -->
`;

  // Add main routes
  mainRoutes.forEach(route => {
    sitemap += `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
    <lastmod>${currentDate}</lastmod>
  </url>
`;
  });

  // Fetch real products
  const products = await fetchProductsFromAPI();

  // Add product pages
  sitemap += `  <!-- Product Pages -->
`;
  products.forEach(product => {
    // Use product.name or product.slug for the URL, fallback to id if needed
    const name = typeof product.name === 'object' ? (product.name.en || Object.values(product.name)[0]) : product.name;
    const encodedName = encodeURIComponent(name || product.slug || product.id);
    const image = product.image || product.imageUrl || '';
    const caption = typeof product.description === 'object' ? (product.description.en || Object.values(product.description)[0]) : product.description || '';
    sitemap += `  <url>
    <loc>${BASE_URL}/product/${encodedName}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${currentDate}</lastmod>
`;
    if (image) {
      sitemap += `    <image:image>
      <image:loc>${image}</image:loc>
      <image:title>${name}</image:title>
      <image:caption>${caption}</image:caption>
    </image:image>
`;
    }
    sitemap += `  </url>
`;
  });

  // Add category pages
  sitemap += `  <!-- Category Pages -->
`;
  categories.forEach(category => {
    sitemap += `  <url>
    <loc>${BASE_URL}/products?category=${category}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <lastmod>${currentDate}</lastmod>
  </url>
`;
  });

  // Add blog post pages
  sitemap += `  <!-- Blog Posts Pages -->
`;
  blogPosts.forEach(post => {
    sitemap += `  <url>
    <loc>${BASE_URL}/blog/${post.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <lastmod>${currentDate}</lastmod>
    <image:image>
      <image:loc>${post.image}</image:loc>
      <image:title>${post.title}</image:title>
      <image:caption>${post.caption}</image:caption>
    </image:image>
  </url>
`;
  });

  sitemap += `</urlset>`;
  return sitemap;
}

// Write the sitemap to a file
async function writeSitemap() {
  const sitemap = await generateSitemap();
  const publicDir = path.resolve(__dirname, 'public');
  const filePath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(filePath, sitemap);
  console.log(`Sitemap generated successfully at: ${filePath}`);
}

// Execute the script
(async () => {
  try {
    await writeSitemap();
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }
})();
