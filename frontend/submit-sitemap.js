// Google Search Console Sitemap Submission Script
// This script uses the Google Search Console API to submit your sitemap
// Requires authentication with a service account or OAuth2
// Run with: node submit-sitemap.js

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Your website URL (property in Google Search Console)
const SITE_URL = 'https://monkeyz.co.il/';
// Path to your service account credentials JSON file
const KEY_FILE_PATH = path.join(__dirname, 'google-api-credentials.json');
// Sitemap URL
const SITEMAP_URL = 'https://monkeyz.co.il/sitemap.xml';

/**
 * Submits a sitemap to Google Search Console.
 * You need a service account with appropriate permissions and
 * the service account must be added as an owner to your GSC property.
 */
async function submitSitemap() {
  try {
    // Check if credentials file exists
    if (!fs.existsSync(KEY_FILE_PATH)) {
      console.error('Credentials file not found!');
      console.log('Please follow these steps to set up credentials:');
      console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/');
      console.log('2. Create a new project or select an existing one');
      console.log('3. Enable the Google Search Console API');
      console.log('4. Create a service account with appropriate permissions');
      console.log('5. Download the service account key file as JSON');
      console.log('6. Save the file as google-api-credentials.json in this directory');
      console.log('7. Add the service account as an owner to your Google Search Console property');
      return;
    }

    // Load the service account key file
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE_PATH,
      scopes: ['https://www.googleapis.com/auth/webmasters'],
    });

    // Create the Search Console API client
    const searchconsole = google.searchconsole({
      version: 'v1',
      auth: auth,
    });

    // Submit the sitemap
    const response = await searchconsole.sitemaps.submit({
      siteUrl: SITE_URL,
      feedpath: SITEMAP_URL,
    });

    console.log('Sitemap submitted successfully:', response.data);
    
    // Get sitemap status
    const sitemapStatus = await searchconsole.sitemaps.get({
      siteUrl: SITE_URL,
      feedpath: SITEMAP_URL,
    });
    
    console.log('Sitemap status:', sitemapStatus.data);

  } catch (error) {
    console.error('Error submitting sitemap:', error.message);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Execute the script
submitSitemap();

// Manual instructions for Google Search Console submission
console.log('\n====== MANUAL SUBMISSION INSTRUCTIONS ======');
console.log('If the automated submission fails, follow these steps:');
console.log('1. Log in to Google Search Console: https://search.google.com/search-console');
console.log('2. Select your property: https://monkeyz.co.il/');
console.log('3. In the left sidebar, click on "Sitemaps"');
console.log('4. In the "Add a new sitemap" field, enter: sitemap.xml');
console.log('5. Click "Submit"');
console.log('6. The sitemap status will be shown in the Submitted sitemaps section');
console.log('============================================\n');
