# Google Analytics & Tag Manager Configuration Guide

This document provides guidance on configuring Google Analytics 4 (GA4) and Google Tag Manager (GTM) for the MonkeyZ e-commerce website.

## Google Tag Manager Setup

### 1. Basic Container Setup

1. **Create a GTM Container**:
   - Log in to [Google Tag Manager](https://tagmanager.google.com/)
   - Create a new container for "MonkeyZ"
   - Select "Web" as the platform
   - After creation, you'll receive a GTM-ID (e.g., `GTM-P4FNQL6X`)
   - Copy this GTM-ID to the frontend/.env file as `REACT_APP_GTM_ID=GTM-P4FNQL6X`

2. **Finding Your GA4 Measurement ID**:
   - Log in to [Google Analytics](https://analytics.google.com/)
   - If you don't have a GA4 property yet:
     - Click "Admin" in the bottom left corner
     - In the middle column, click "Create Property"
     - Select "Web" as the platform
     - Follow the setup process to create a new GA4 property for MonkeyZ
   - To find your Measurement ID:
     - Go to Admin > Data Streams > Web
     - Click on your web stream (create one if needed)
     - Your Measurement ID is displayed at the top (e.g., `G-SYF721LFGB`)
     - Copy this ID to the frontend/.env file as `REACT_APP_GA_MEASUREMENT_ID=G-SYF721LFGB`

3. **Install GTM Variables**:
   - In GTM, go to "Variables" > "User-Defined Variables"
   - Create the following variables:
     - **GA4 Measurement ID**: 
       - Name: "GA4 Measurement ID"
       - Variable Type: Constant
       - Value: Paste your GA4 Measurement ID (G-SYF721LFGB)     
     - **Client ID**: 
       - Name: "Client ID"
       - Variable Type: 1st Party Cookie
       - Cookie Name: _ga_client_id (don't include the backticks)
     - **Data Layer Variables**:
       - Create separate Data Layer Variables for each of the following:
         - Name: "ecommerce"
           - Variable Type: Data Layer Variable
           - Data Layer Variable Name: ecommerce
         - Name: "user_properties"
           - Variable Type: Data Layer Variable
           - Data Layer Variable Name: user_properties
         - Name: "funnel_progress"
           - Variable Type: Data Layer Variable
           - Data Layer Variable Name: funnel_progress
         - Name: "utm_source"
           - Variable Type: Data Layer Variable
           - Data Layer Variable Name: utm_source
         - Name: "utm_medium"
           - Variable Type: Data Layer Variable
           - Data Layer Variable Name: utm_medium
         - Name: "utm_campaign"
           - Variable Type: Data Layer Variable
           - Data Layer Variable Name: utm_campaign

3. **Configure Built-in Variables**:
   - Enable all built-in variables for Pages, Clicks, and Forms

### 2. GA4 Configuration

1. **Create Google Tag (Base Configuration)**:
   - In GTM, go to "Tags" > "New"
   - Tag Name: "GA4 - Google Tag Configuration"
   - Tag Type: Select "Google Tag" (not "Google Analytics: GA4 Configuration")
   - For "Tag ID", enter your Measurement ID: G-SYF721LFGB
   - Under "Settings", click "Show More Settings" if available
     - If you see Fields to Set, add:
       - Field Name: `client_id`
       - Value: Click the variable selector and select your "Client ID" variable
     - If you see User Properties, add (optional):
       - Property Name: `user_segments`
       - Value: Click the variable selector and select your "user_properties" variable
   - Triggering: Select "All Pages" (or "Consent Initialization - All Pages" if you use consent management)
   - Click "Save"

2. **Create Custom Event Tags**:
   - For each custom event, create a new tag:
     a. **View Item Tag**:
        - Tag Name: "GA4 - View Item"
        - Tag Type: "Google Analytics: GA4 Event"
        - Measurement ID: G-SYF721LFGB (your Measurement ID will appear automatically if Google tag is configured)
        - Event Name: "view_item"
        - Event Parameters:
          - Click "Event Parameters" to expand the section
          - Click "Add Parameter"
          - Parameter Name: "items"
          - Value: {% raw %}{{ecommerce.items}}{% endraw %}
        - Triggering: Create a new trigger
          - Trigger Type: "Custom Event"
          - Event Name: "view_item"
          - Click "Save"
       b. **Add to Cart Tag**:
        - Tag Name: "GA4 - Add to Cart"
        - Tag Type: "Google Analytics: GA4 Event"
        - Measurement ID: G-SYF721LFGB (should appear automatically)
        - Event Name: "add_to_cart"
        - Event Parameters:
          - Click "Event Parameters" to expand the section
          - Click "Add Parameter"
          - Parameter Name: "items"
          - Value: {% raw %}{{ecommerce.items}}{% endraw %}
        - Triggering: Create a new trigger
          - Trigger Type: "Custom Event"
          - Event Name: "add_to_cart"
          - Click "Save"
       c. **Begin Checkout Tag**:
        - Tag Name: "GA4 - Begin Checkout"
        - Tag Type: "Google Analytics: GA4 Event"
        - Measurement ID: G-SYF721LFGB (should appear automatically)
        - Event Name: "begin_checkout"
        - Event Parameters:
          - Click "Event Parameters" to expand the section
          - Click "Add Parameter"
          - Parameter Name: "items"
          - Value: {% raw %}{{ecommerce.items}}{% endraw %}
          - Click "Add Parameter"
          - Parameter Name: "value"
          - Value: {% raw %}{{ecommerce.value}}{% endraw %}
        - Triggering: Create a new trigger
          - Trigger Type: "Custom Event"
          - Event Name: "begin_checkout"
          - Click "Save"
       d. **Purchase Tag**:
        - Tag Name: "GA4 - Purchase"
        - Tag Type: "Google Analytics: GA4 Event"
        - Measurement ID: G-SYF721LFGB (should appear automatically)
        - Event Name: "purchase"
        - Event Parameters:
          - Click "Event Parameters" to expand the section
          - Click "Add Parameter"
          - Parameter Name: "transaction_id"
          - Value: {% raw %}{{ecommerce.transaction_id}}{% endraw %}
          - Click "Add Parameter"
          - Parameter Name: "value"
          - Value: {% raw %}{{ecommerce.value}}{% endraw %}
          - Click "Add Parameter"
          - Parameter Name: "items"
          - Value: {% raw %}{{ecommerce.items}}{% endraw %}
        - Triggering: Create a new trigger
          - Trigger Type: "Custom Event"
          - Event Name: "purchase"
          - Click "Save"
       e. **Funnel Progress Tag**:
        - Tag Name: "GA4 - Funnel Progress"
        - Tag Type: "Google Analytics: GA4 Event"
        - Measurement ID: G-SYF721LFGB (should appear automatically)
        - Event Name: "funnel_progress"
        - Event Parameters:
          - Click "Event Parameters" to expand the section
          - Click "Add Parameter"
          - Parameter Name: "funnel_step"
          - Value: {% raw %}{{funnel_progress.current_step}}{% endraw %}
          - Click "Add Parameter"
          - Parameter Name: "steps_completed"
          - Value: {% raw %}{{funnel_progress.steps_completed}}{% endraw %}
          - Click "Add Parameter"
          - Parameter Name: "time_in_funnel"
          - Value: {% raw %}{{funnel_progress.time_in_funnel}}{% endraw %}
        - Triggering: Create a new trigger
          - Trigger Type: "Custom Event"
          - Event Name: "funnel_progress"
          - Click "Save"

### 3. UTM Parameter Tracking

UTM parameters are essential for tracking the effectiveness of your marketing campaigns. This section provides a comprehensive implementation guide for setting up robust UTM parameter tracking in GTM and GA4 for the MonkeyZ e-commerce platform.

1. **Understanding UTM Parameters**:
   - UTM parameters are query parameters added to URLs to track marketing campaign performance
   - Common UTM parameters include:
     - `utm_source`: Identifies the source of your traffic (e.g., google, facebook, newsletter)
     - `utm_medium`: Identifies the marketing medium (e.g., cpc, email, social)
     - `utm_campaign`: Identifies a specific campaign name or promotion
     - `utm_term`: Identifies search terms (for paid search campaigns)
     - `utm_content`: Identifies specific content or variations within ads

2. **Create URL Parameter Variables in GTM**:
   - In GTM, navigate to "Variables" > "User-Defined Variables" > "New"
   - For each UTM parameter, create a URL Parameter Variable:
   
     a. **UTM Source URL Parameter**:
        - Variable Name: "URL Parameter - utm_source"
        - Variable Type: Select "URL"
        - Component Type: Select "Query"
        - Query Key: Enter "utm_source"
        - Click "Save"
     
     b. **UTM Medium URL Parameter**:
        - Variable Name: "URL Parameter - utm_medium"
        - Variable Type: Select "URL"
        - Component Type: Select "Query"
        - Query Key: Enter "utm_medium"
        - Click "Save"
     
     c. **UTM Campaign URL Parameter**:
        - Variable Name: "URL Parameter - utm_campaign"
        - Variable Type: Select "URL"
        - Component Type: Select "Query"
        - Query Key: Enter "utm_campaign"
        - Click "Save"
     
     d. **UTM Term URL Parameter**:
        - Variable Name: "URL Parameter - utm_term"
        - Variable Type: Select "URL"
        - Component Type: Select "Query"
        - Query Key: Enter "utm_term"
        - Click "Save"
     
     e. **UTM Content URL Parameter**:
        - Variable Name: "URL Parameter - utm_content"
        - Variable Type: Select "URL"
        - Component Type: Select "Query"
        - Query Key: Enter "utm_content"
        - Click "Save"

3. **Create Data Layer Variables for UTM Parameters**:
   - These variables will be used as a fallback if UTM parameters are passed via the data layer
   - In GTM, go to "Variables" > "User-Defined Variables" > "New"
   
     a. **Data Layer - utm_source**:
        - Variable Name: "DL - utm_source"
        - Variable Type: Select "Data Layer Variable"
        - Data Layer Variable Name: "utm_source"
        - Click "Save"
     
     b. **Data Layer - utm_medium**:
        - Variable Name: "DL - utm_medium"
        - Variable Type: Select "Data Layer Variable"
        - Data Layer Variable Name: "utm_medium"
        - Click "Save"
     
     c. **Data Layer - utm_campaign**:
        - Variable Name: "DL - utm_campaign"
        - Variable Type: Select "Data Layer Variable"
        - Data Layer Variable Name: "utm_campaign"
        - Click "Save"

4. **Create First-Party Cookie Variables for Persistence**:
   - UTM parameters must be stored in cookies to persist across sessions
   - In GTM, go to "Variables" > "User-Defined Variables" > "New"
   
     a. **UTM Source Cookie**:
        - Variable Name: "Cookie - utm_source"
        - Variable Type: Select "1st Party Cookie"
        - Cookie Name: "utm_source"
        - Click "Save"
     
     b. **UTM Medium Cookie**:
        - Variable Name: "Cookie - utm_medium"
        - Variable Type: Select "1st Party Cookie"
        - Cookie Name: "utm_medium"
        - Click "Save"
     
     c. **UTM Campaign Cookie**:
        - Variable Name: "Cookie - utm_campaign"
        - Variable Type: Select "1st Party Cookie"
        - Cookie Name: "utm_campaign"
        - Click "Save"
     
     d. **UTM Term Cookie**:
        - Variable Name: "Cookie - utm_term"
        - Variable Type: Select "1st Party Cookie"
        - Cookie Name: "utm_term"
        - Click "Save"
     
     e. **UTM Content Cookie**:
        - Variable Name: "Cookie - utm_content"
        - Variable Type: Select "1st Party Cookie"
        - Cookie Name: "utm_content"
        - Click "Save"
     
     f. **First Session Date Cookie** (for attribution tracking):
        - Variable Name: "Cookie - first_session_date"
        - Variable Type: Select "1st Party Cookie"
        - Cookie Name: "first_session_date"
        - Click "Save"

5. **Create Custom JavaScript Variables for UTM Logic**:
   - These variables handle sophisticated logic for UTM parameter attribution
   - In GTM, go to "Variables" > "User-Defined Variables" > "New"
   
     a. **JS - UTM Source Logic**:
        - Variable Name: "JS - UTM Source"
        - Variable Type: Select "Custom JavaScript"
        - Custom JavaScript:
          ```javascript
          function() {
            // Priority: 1. URL Parameter, 2. Data Layer, 3. Cookie, 4. Return direct
            var urlParam = {{URL Parameter - utm_source}};
            var dataLayerParam = {{DL - utm_source}};
            var cookieParam = {{Cookie - utm_source}};
            
            if (urlParam && urlParam !== 'undefined' && urlParam !== '') {
              return urlParam;
            } else if (dataLayerParam && dataLayerParam !== 'undefined' && dataLayerParam !== '') {
              return dataLayerParam;
            } else if (cookieParam && cookieParam !== 'undefined' && cookieParam !== '') {
              return cookieParam;
            } else {
              return 'direct';  // Default value for organic traffic
            }
          }
          ```
        - Click "Save"
     
     b. **JS - UTM Medium Logic**:
        - Variable Name: "JS - UTM Medium"
        - Variable Type: Select "Custom JavaScript"
        - Custom JavaScript:
          ```javascript
          function() {
            // Priority: 1. URL Parameter, 2. Data Layer, 3. Cookie, 4. Return none
            var urlParam = {{URL Parameter - utm_medium}};
            var dataLayerParam = {{DL - utm_medium}};
            var cookieParam = {{Cookie - utm_medium}};
            
            if (urlParam && urlParam !== 'undefined' && urlParam !== '') {
              return urlParam;
            } else if (dataLayerParam && dataLayerParam !== 'undefined' && dataLayerParam !== '') {
              return dataLayerParam;
            } else if (cookieParam && cookieParam !== 'undefined' && cookieParam !== '') {
              return cookieParam;
            } else {
              return 'none';  // Default value for organic traffic
            }
          }
          ```
        - Click "Save"
     
     c. **JS - UTM Campaign Logic**:
        - Variable Name: "JS - UTM Campaign"
        - Variable Type: Select "Custom JavaScript"
        - Custom JavaScript:
          ```javascript
          function() {
            // Priority: 1. URL Parameter, 2. Data Layer, 3. Cookie, 4. Return not set
            var urlParam = {{URL Parameter - utm_campaign}};
            var dataLayerParam = {{DL - utm_campaign}};
            var cookieParam = {{Cookie - utm_campaign}};
            
            if (urlParam && urlParam !== 'undefined' && urlParam !== '') {
              return urlParam;
            } else if (dataLayerParam && dataLayerParam !== 'undefined' && dataLayerParam !== '') {
              return dataLayerParam;
            } else if (cookieParam && cookieParam !== 'undefined' && cookieParam !== '') {
              return cookieParam;
            } else {
              return 'not set';  // Default value for organic traffic
            }
          }
          ```
        - Click "Save"       d. **JS - First Touch Attribution**:
        - Variable Name: "JS - First Touch Attribution"
        - Variable Type: Select "Custom JavaScript"
        - Custom JavaScript:
          ```javascript
          function() {
            // This function records first-touch attribution
            var firstSessionDate = {{Cookie - first_session_date}};
            var currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            
            // If this is the first session, record all UTM parameters
            if (!firstSessionDate || firstSessionDate === 'undefined' || firstSessionDate === '') {
              return true; // This is first touch, should store UTM params
            }
            
            return false; // Not first touch, don't overwrite first-touch params
          }
          ```
        - Click "Save"

6. **Create Enhanced Tag to Store UTM Parameters in Cookies**:
   - This tag handles the storage of UTM parameters in cookies with attribution logic
   - In GTM, go to "Tags" > "New"
   
     a. **Tag Configuration**:
        - Tag Name: "Store UTM Parameters in Cookies"
        - Tag Type: Select "Custom HTML"
        - HTML:
          ```html
          <script>
            // Function to set cookie with proper encoding
            function setCookie(name, value, days) {
              var expires = "";
              if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toUTCString();
              }
              // Encode the value to handle special characters
              var encodedValue = encodeURIComponent(value || "");
              document.cookie = name + "=" + encodedValue + expires + "; path=/; SameSite=Lax";
            }
            
            // Function to check if a cookie exists
            function getCookie(name) {
              var nameEQ = name + "=";
              var ca = document.cookie.split(';');
              for(var i=0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
              }
              return null;
            }
            
            // Set UTM cookies if parameters exist in URL
            var urlParams = new URLSearchParams(window.location.search);
            var isFirstTouch = {{JS - First Touch Attribution}};
            var currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            var cookieExpiration = 30; // 30 days expiration for all cookies
            
            // Record first session date if it doesn't exist
            if (isFirstTouch) {
              setCookie('first_session_date', currentDate, 365); // Set for 1 year
            }
            
            // Store current UTM parameters (last-touch attribution)
            if(urlParams.has('utm_source')) {
              var source = urlParams.get('utm_source');
              setCookie('utm_source', source, cookieExpiration);
              
              // Store first-touch UTM source if this is first visit
              if (isFirstTouch) {
                setCookie('first_touch_source', source, 365);
              }
            }
            
            if(urlParams.has('utm_medium')) {
              var medium = urlParams.get('utm_medium');
              setCookie('utm_medium', medium, cookieExpiration);
              
              // Store first-touch UTM medium if this is first visit
              if (isFirstTouch) {
                setCookie('first_touch_medium', medium, 365);
              }
            }
            
            if(urlParams.has('utm_campaign')) {
              var campaign = urlParams.get('utm_campaign');
              setCookie('utm_campaign', campaign, cookieExpiration);
              
              // Store first-touch UTM campaign if this is first visit
              if (isFirstTouch) {
                setCookie('first_touch_campaign', campaign, 365);
              }
            }
            
            if(urlParams.has('utm_term')) {
              setCookie('utm_term', urlParams.get('utm_term'), cookieExpiration);
            }
            
            if(urlParams.has('utm_content')) {
              setCookie('utm_content', urlParams.get('utm_content'), cookieExpiration);
            }
            
            // Track session count for frequency analysis
            var sessionCount = getCookie('session_count') || 0;
            setCookie('session_count', parseInt(sessionCount) + 1, 365);
            
            // Record last visit timestamp for recency analysis
            setCookie('last_visit_date', currentDate, 365);
          </script>
          ```
        - Click "Save"
     
     b. **Triggering**:
        - Click "Triggering"
        - Select "All Pages" (this will run on every page load to check for UTM parameters)
        - Click "Save"

7. **Configure Campaign Parameters in Google Tag**:
   - Edit your "Google Tag" (GA4 configuration tag)
   - In GTM, go to "Tags" > select your "Google Tag"
   
     a. **Access Configure Tag Settings**:
        - Click to edit your Google Tag configuration
        - You'll see the "Configuration settings" section in the tag editor
        - There should be a "Configuration Parameter" column and a "Value" column where you can add parameters
       b. **Add Campaign Parameter Fields**:
        - Click the "+" button next to "Configuration Parameter" to add a new parameter
        - Add the following parameter mappings one by one:
     
        1. For utm_source:
           - Configuration Parameter: `campaign_source` (exact spelling required)
           - Value: Click in the value field and select your "JS - UTM Source" variable
           - This ensures proper attribution hierarchy is maintained
        
        2. For utm_medium:
           - Configuration Parameter: `campaign_medium` (exact spelling required)
           - Value: Select your "JS - UTM Medium" variable
        
        3. For utm_campaign:
           - Configuration Parameter: `campaign_name` (exact spelling required)
           - Value: Select your "JS - UTM Campaign" variable
        
        4. For utm_term:
           - Configuration Parameter: `campaign_term` (exact spelling required)
           - Value: Select your "URL Parameter - utm_term" variable
        
        5. For utm_content:
           - Configuration Parameter: `campaign_content` (exact spelling required)
           - Value: Select your "URL Parameter - utm_content" variable
        
        6. For session_id (optional but recommended for cross-session analysis):
           - Configuration Parameter: `session_id`
           - Value: `{{Random Number}}`
       c. **Add User Properties for Campaign Attribution**:
        - Scroll down to "Advanced Settings" section
        - Click "Additional Tag Metadata"
        - Add the following key-value pairs for your user properties:
        
        1. First Touch Source:
           - Key: `user_property.first_touch_source`
           - Value: `{{Cookie - first_touch_source}}`
        
        2. First Touch Medium:
           - Key: `user_property.first_touch_medium`
           - Value: `{{Cookie - first_touch_medium}}`
        
        3. First Touch Campaign:
           - Key: `user_property.first_touch_campaign`
           - Value: `{{Cookie - first_touch_campaign}}`
        
        4. Last Touch Source:
           - Key: `user_property.last_touch_source`
           - Value: `{{JS - UTM Source}}`
        
        5. Last Touch Medium:
           - Key: `user_property.last_touch_medium`
           - Value: `{{JS - UTM Medium}}`
        
        6. Last Touch Campaign:
           - Key: `user_property.last_touch_campaign`
           - Value: `{{JS - UTM Campaign}}`
     
     d. **Save Your Configuration**:
        - Review all settings to ensure accuracy
        - Click "Save" to apply changes to your Google Tag

8. **Create UTM Parameter Debug Console Tag**:
   - This tag helps verify your UTM parameter implementation
   - In GTM, go to "Tags" > "New"
   
     a. **Tag Configuration**:
        - Tag Name: "Debug - UTM Parameters"
        - Tag Type: Select "Custom HTML"
        - HTML:
          ```html
          <script>
            console.group("UTM Parameter Debugging");
            
            // URL Parameters
            console.log("URL Parameters:");
            console.log("utm_source:", {{URL Parameter - utm_source}});
            console.log("utm_medium:", {{URL Parameter - utm_medium}});
            console.log("utm_campaign:", {{URL Parameter - utm_campaign}});
            console.log("utm_term:", {{URL Parameter - utm_term}});
            console.log("utm_content:", {{URL Parameter - utm_content}});
            
            // Data Layer Values
            console.log("\nData Layer Values:");
            console.log("utm_source:", {{DL - utm_source}});
            console.log("utm_medium:", {{DL - utm_medium}});
            console.log("utm_campaign:", {{DL - utm_campaign}});
            
            // Cookie Values
            console.log("\nCookie Values:");
            console.log("utm_source:", {{Cookie - utm_source}});
            console.log("utm_medium:", {{Cookie - utm_medium}});
            console.log("utm_campaign:", {{Cookie - utm_campaign}});
            console.log("utm_term:", {{Cookie - utm_term}});
            console.log("utm_content:", {{Cookie - utm_content}});
            console.log("first_touch_source:", {{Cookie - first_touch_source}});
            console.log("first_touch_medium:", {{Cookie - first_touch_medium}});
            console.log("first_touch_campaign:", {{Cookie - first_touch_campaign}});
            console.log("first_session_date:", {{Cookie - first_session_date}});
            
            // Final Attribution Values
            console.log("\nFinal Attribution Values (sent to GA4):");
            console.log("campaign_source:", {{JS - UTM Source}});
            console.log("campaign_medium:", {{JS - UTM Medium}});
            console.log("campaign_name:", {{JS - UTM Campaign}});
            console.log("Is First Touch:", {{JS - First Touch Attribution}});
            
            console.groupEnd();
          </script>
          ```
        - Click "Save"
     
     b. **Triggering**:
        - Click "Triggering"
        - Create a custom trigger that only fires in debug mode:
          - Trigger Type: Custom Event
          - Event Name: gtm.js
          - This trigger fires on: Some Custom Events
          - Add condition: Debug Mode equals true
        - Click "Save"

9. **Create Custom Dimensions in GA4 for Advanced Attribution**:
   - In your GA4 property, go to "Admin" > "Custom definitions" 
   - Click "Create custom dimensions"
   - Create the following user-scoped dimensions:
   
     a. **First Touch Source**:
        - Dimension name: "First Touch Source"
        - Scope: "User"
        - Description: "First marketing source that brought the user to the site"
        - User property name: "first_touch_source"
        - Click "Save"
     
     b. **First Touch Medium**:
        - Dimension name: "First Touch Medium"
        - Scope: "User"
        - Description: "First marketing medium that brought the user to the site"
        - User property name: "first_touch_medium"
        - Click "Save"
       c. **First Touch Campaign**:
        - Dimension name: "First Touch Campaign"
        - Scope: "User"
        - Description: "First campaign that brought the user to the site"
        - User property name: "first_touch_campaign"
        - Click "Save"
     
     d. **Days Since First Visit**:
        - Dimension name: "Days Since First Visit"
        - Scope: "User"
        - Description: "Number of days since user's first visit"
        - User property name: "days_since_first_visit"
        - Click "Save"

10. **Testing UTM Implementation with Sample URLs**:
    - Use GTM Preview mode to test your implementation
    - Test with these sample URLs for the MonkeyZ website:
      - `https://monkeyz.co.il/?utm_source=facebook&utm_medium=social&utm_campaign=summer_sale&utm_content=story_ad`
      - `https://monkeyz.co.il/products/?utm_source=google&utm_medium=cpc&utm_campaign=product_launch&utm_term=kids_toys`
      - `https://monkeyz.co.il/checkout/?utm_source=email&utm_medium=newsletter&utm_campaign=abandoned_cart`
    
    - In GTM Preview mode, verify:
      - All UTM parameters are properly captured in variables
      - Cookie storage is working correctly
      - First/last touch attribution logic is functioning
      - Campaign parameters are passed to GA4
    
    - Use GA4 DebugView to verify data transmission:
      - In GA4, go to "Configure" > "DebugView"
      - Check that all campaign parameters are correctly received
      - Confirm user properties for attribution are properly set

11. **Creating UTM Parameter Analysis Reports in GA4**:
    - In GA4, create custom reports to analyze campaign effectiveness:
    
     a. **Multi-Channel Conversion Paths**:
        - In GA4, go to "Explore"
        - Create a new exploration
        - Add dimensions:
          - First Touch Source
          - First Touch Medium
          - Last Touch Source 
          - Last Touch Medium
        - Add metrics:
          - Conversions
          - Revenue
          - Conversion Rate
        - Save as "Multi-Channel Attribution Analysis"
     
     b. **Campaign Performance Dashboard**:
        - In GA4, go to "Explore"
        - Create a new exploration with funnel visualization
        - Add dimensions:
          - Campaign Source
          - Campaign Medium
          - Campaign Name
        - Add metrics:
          - Sessions
          - Product Views
          - Add to Carts
          - Purchases
          - Revenue
        - Save as "Campaign Performance Dashboard"

12. **UTM Link Building Tool for MonkeyZ Marketing**:
    - Consider implementing a UTM link builder for your marketing team
    - Recommended structure for MonkeyZ UTM parameters:
      - utm_source: marketing platform (facebook, google, instagram, email, etc.)
      - utm_medium: marketing type (cpc, social, email, banner, etc.)
      - utm_campaign: campaign identifier (summer_sale, new_product, holiday_2023, etc.)
      - utm_content: specific creative (banner_1, story_ad, carousel_3, etc.)
      - utm_term: search keywords for paid search campaigns

    - Example UTM URL for MonkeyZ Facebook Campaign:
      `https://monkeyz.co.il/collections/new-arrivals?utm_source=facebook&utm_medium=social&utm_campaign=spring_collection_2023&utm_content=video_ad_1`

13. **Troubleshooting Common UTM Issues**:
    - If UTM parameters aren't appearing in GA4:
      - Check for typos in field names (e.g., "campaign_source" not "campaignSource")
      - Verify that your JavaScript variables are returning values (check browser console)
      - Ensure cookies are being set properly (check Application tab in Chrome DevTools)
    
    - If parameters appear intermittently:
      - Check for cookie expiration issues
      - Verify your attribution logic for edge cases
      - Test cross-domain tracking if applicable
    
    - If attribution data is incorrect:
      - Review the priority logic in your JavaScript variables
      - Check for conflicting implementations or tags
      - Validate with GA4 DebugView the actual values being sent

### 4. User Segments Configuration

1. **Set Up User Properties in GA4**:
   - Log in to Google Analytics
   - Go to "Admin" (gear icon in bottom left)
   - In the "Property" column, click on "Custom definitions"
   - Click "Create custom dimensions"
   - Set up the following user-scoped custom dimensions one by one:
     
     a. **User ID**:
        - Dimension name: "User ID"
        - Scope: "User"
        - Description: "Unique identifier for logged-in users"
        - User property name: "user_id"
        - Click "Save"
       b. **User Segments**:
        - Dimension name: "User Segments"
        - Scope: "User"
        - Description: "User segment categories (recent_purchaser, frequent_visitor, etc.)"
        - User property name: "user_segments"
        - Click "Save"
     
     c. **Visit Count**:
        - Dimension name: "Visit Count"
        - Scope: "User"
        - Description: "Number of visits from this user"
        - User property name: "visit_count"
        - Click "Save"
     
     d. **Days Since First Visit**:
        - Dimension name: "Days Since First Visit"
        - Scope: "User"
        - Description: "Number of days since user's first visit"
        - User property name: "days_since_first_visit"
        - Click "Save"
     
     e. **Language Preference**:
        - Dimension name: "Language Preference"
        - Scope: "User"
        - Description: "User's preferred language"
        - User property name: "language_preference"
        - Click "Save"

2. **Create Audiences Based on Segments**:
   - In GA4, go to "Configure" > "Audiences"
   - Click "New audience"
   - Create the following audiences:
     
     a. **Recent Purchasers**:
        - Audience name: "Recent Purchasers"
        - Condition type: "User property"
        - User property: "User Segments"
        - Operator: "contains any of"
        - Value: "recent_purchaser"
        - Click "Save"
     
     b. **High-Value Customers**:
        - Audience name: "High-Value Customers"
        - Condition type: "User property"
        - User property: "User Segments"
        - Operator: "contains any of"
        - Value: "high_value_cart"
        - Click "Save"
     
     c. **Frequent Visitors**:
        - Audience name: "Frequent Visitors"
        - Condition type: "User property"
        - User property: "User Segments"
        - Operator: "contains any of"
        - Value: "frequent_visitor"
        - Click "Save"
     
     d. **New Visitors**:
        - Audience name: "New Visitors"
        - Condition type: "User property"
        - User property: "User Segments"
        - Operator: "contains any of"
        - Value: "new_visitor"
        - Click "Save"
     
     e. **Logged-in Users**:
        - Audience name: "Logged-in Users"
        - Condition type: "User property"
        - User property: "User Segments"
        - Operator: "contains any of"
        - Value: "logged_in_user"
        - Click "Save"

### 5. Funnel Analysis Setup

1. **Create a Funnel Exploration**:
   - In GA4, go to "Explore" (in the left navigation panel)
   - Click "Create new exploration"
   - Click on "Blank" to start with a blank template
   - In the "Technique" tab, select "Funnel exploration"
   - Configure your funnel:
     
     a. **Adding Steps**:
        - Under "Tab settings", in the "Steps" section, click "+ Add step"
        - For step 1:
          - Step name: "Page View"
          - Step definition:
            - Dimension: "Event name"
            - Operator: "is equal to"
            - Value: "page_view"
          - Click "Apply"
        
        - For step 2:
          - Step name: "View Product"
          - Step definition:
            - Dimension: "Event name"
            - Operator: "is equal to"
            - Value: "view_item"
          - Click "Apply"
        
        - For step 3:
          - Step name: "Add to Cart"
          - Step definition:
            - Dimension: "Event name"
            - Operator: "is equal to"
            - Value: "add_to_cart"
          - Click "Apply"
        
        - For step 4:
          - Step name: "Begin Checkout"
          - Step definition:
            - Dimension: "Event name"
            - Operator: "is equal to"
            - Value: "begin_checkout"
          - Click "Apply"
        
        - For step 5:
          - Step name: "Purchase"
          - Step definition:
            - Dimension: "Event name"
            - Operator: "is equal to"
            - Value: "purchase"
          - Click "Apply"
     
     b. **Adding Segments**:
        - In the "Segments" tab, click "Add segment"
        - Add each of your created audiences as segments to compare
          (Recent Purchasers, High-Value Customers, etc.)
     
     c. **Setting Visualization Options**:
        - In "Visualization options", check the boxes for:
          - "Show elapsed time"
          - "Show step-to-step drop-offs"
          - "Show abandoned funnels"
     
     d. **Save Your Exploration**:
        - Click "Save" in the top-right corner
        - Name: "Purchase Funnel Analysis"
        - Click "Save" again

2. **Create a Custom Conversion Time Metric**:
   - In GA4, go to "Admin" > "Custom definitions"
   - Click "Create custom metrics"
   - Configure the metric:
     - Metric name: "Time to Purchase (mins)"
     - Scope: "Event"
     - Event parameter: "conversion_time_minutes"
     - Unit of measurement: "Standard" (or "Time" if available)
     - Description: "Time from first page view to purchase completion in minutes"
     - Click "Save"
   
   - Add this metric to your funnel exploration:
     - Go back to your saved exploration
     - Click "Edit"
     - In the "Metrics" tab, click "+ Metric"
     - Search for and select your "Time to Purchase (mins)" metric
     - Click "Apply"
     - Save your updated exploration

### 6. Cross-Device Tracking

1. **Enable User-ID Feature**:
   - In GA4, go to "Admin" > "Data Settings" > "Data Collection"
   - Click on "User ID Collection"
   - Toggle the switch to enable User-ID
   - Click "Save"
     - Configure User-ID in your Google Tag in GTM:
     - Edit your GA4 - Google Tag Configuration
     - Under "Settings" > "More Settings" > "Fields to Set", add a new field:
       - Field Name: `user_id`
       - Value: `{% raw %}{{user_properties.user_id}}{% endraw %}`
     - Click "Save"

2. **Configure Cross-Device Reports**:
   - In GA4, go to "Admin" > "Reporting Identity"
   - Select "By User-ID and device" as your reporting identity
   - If prompted, check "I accept the Google terms of service and Additional Terms of Service for the reporting identity feature"
   - Click "Save"
   
   - To analyze cross-device behavior:
     - Go to "Reports" > "User" > "Cross Device" (may require some data to accumulate)
     - You can view:
       - Device overlap
       - Device paths
       - Acquisition device
     - Filter these reports by your segments for more detailed analysis

### 7. Testing

1. **Preview Mode**:
   - Use GTM Preview mode to test all events (click the "Preview" button in GTM)
   - When prompted, enter your website URL and click "Start"
   - Visit `/analytics-test` in your application to trigger test events
   - You should see events appearing in the GTM preview panel

2. **DebugView**:
   - In GA4, go to "Admin" > "DebugView" to see real-time events
   - Verify that ecommerce events are being captured correctly
   - Confirm that user properties and segments are set properly
   
3. **Real-time Reports**:
   - In GA4, go to "Reports" > "Realtime" to verify data is flowing
   - Check that events are being recorded properly
   - Look for any issues with missing parameters or incorrect values

## Google Analytics 4 Setup

### 1. Enhanced Measurement

1. **Configure Enhanced Measurement**:
   - In GA4, go to "Admin" > "Data Streams" > your web stream
   - Under "Enhanced Measurement", enable:
     - Page views
     - Scrolls
     - Outbound clicks
     - Site search
     - File downloads

### 2. E-commerce Configuration

1. **Enable E-commerce Reports**:
   - In GA4, go to "Admin" > "Data Streams" > your web stream
   - Under "E-commerce settings", enable E-commerce
   - Configure product parameters to match your data model

### 3. Custom Dimensions & Metrics

Create the following custom dimensions and metrics:

1. **Event-scoped**:
   - `funnel_step` (Dimension)
   - `conversion_time_minutes` (Metric)

2. **User-scoped**:
   - `user_segment` (Dimension)
   - `total_purchases` (Metric)
   - `lifetime_value` (Metric)

### 4. Conversion Events

Configure the following conversion events:

1. `purchase`
2. `sign_up`
3. `add_to_cart`

## Data Governance

### 1. Data Retention

- Set data retention to the maximum allowed period (14 months)
- Consider Google Analytics 360 for longer retention if needed

### 2. Privacy Compliance

- Ensure your privacy policy includes information about analytics tracking
- Configure consent mode for regions requiring consent (EU, GDPR, etc.)
- Test analytics with consent mode rejected to ensure compliance

### 3. User Identification

- Never include PII (personally identifiable information) in analytics
- Use hashed or anonymized identifiers for cross-device tracking
- Ensure all tracking respects user privacy preferences

## Reporting & Analysis

### 1. Custom Reports

Create the following custom reports:

1. **E-commerce Performance**:
   - Revenue by product
   - Conversion rate by traffic source
   - Shopping behavior by user segment

2. **Funnel Analysis**:
   - Conversion rate by step
   - Time to complete funnel by user segment
   - Drop-off points by traffic source

3. **Marketing Campaign Effectiveness**:
   - UTM performance comparison
   - Campaign ROI calculation
   - Attribution model comparison

### 2. Dashboards

Set up dashboards for:

1. **Executive Overview**:
   - Revenue, transactions, conversion rate
   - User growth and engagement

2. **Marketing Team**:
   - Campaign performance
   - Channel effectiveness
   - UTM tracking results

3. **Product Team**:
   - Product performance
   - User behavior
   - Funnel optimization opportunities

## Regular Maintenance

1. Schedule monthly reviews of tracking implementation
2. Validate data accuracy against your backend data
3. Update segments and audiences as your user base evolves
4. Review and refine conversion goals and funnel definitions

## Advanced Configurations (Future)

1. Integrate with Google Optimize for A/B testing
2. Set up remarketing audiences for advertising
3. Implement BigQuery export for advanced analysis
4. Configure automated alerts for significant changes in metrics
