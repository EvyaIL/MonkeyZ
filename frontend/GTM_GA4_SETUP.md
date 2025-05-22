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
       - Value: Paste your GA4 Measurement ID (e.g., G-SYF721LFGB)     - **Client ID**: 
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

1. **Create GA4 Configuration Tag**:
   - In GTM, go to "Tags" > "New"
   - Tag Name: "GA4 Configuration"
   - Tag Type: Select "Google Analytics: GA4 Configuration"
   - Measurement ID: Click the variable selector (curly brackets) and select your "GA4 Measurement ID" variable
   - Under "Fields to Set", click "Add Field"
     - Field Name: `client_id`
     - Value: Click the variable selector and select your "Client ID" variable
   - Under "User Properties", click "Add User Property" (optional)
     - Property Name: `user_segments`
     - Value: Click the variable selector and select your "user_properties" variable
   - Under "Advanced Configuration", check "Send a page view event when this configuration loads"
   - Triggering: Select "All Pages"
   - Click "Save"

2. **Create Custom Event Tags**:
   - For each custom event, create a new tag:
     a. **View Item Tag**:
        - Tag Name: "GA4 - View Item"
        - Tag Type: "Google Analytics: GA4 Event"
        - Configuration Tag: Select your GA4 Configuration tag
        - Event Name: "view_item"
        - Event Parameters:
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
        - Configuration Tag: Select your GA4 Configuration tag
        - Event Name: "add_to_cart"
        - Event Parameters:
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
        - Configuration Tag: Select your GA4 Configuration tag
        - Event Name: "begin_checkout"
        - Event Parameters:
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
        - Configuration Tag: Select your GA4 Configuration tag
        - Event Name: "purchase"
        - Event Parameters:
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
        - Configuration Tag: Select your GA4 Configuration tag
        - Event Name: "funnel_progress"
        - Event Parameters:
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

1. **Create Variables for UTM Parameters**:
   - For each UTM parameter, create a URL Parameter Variable as a fallback:
     a. **UTM Source URL Parameter**:
        - Variable Name: "URL Parameter - utm_source"
        - Variable Type: "URL"
        - Component Type: "Query"
        - Query Key: "utm_source"
     
     b. **UTM Medium URL Parameter**:
        - Variable Name: "URL Parameter - utm_medium"
        - Variable Type: "URL"
        - Component Type: "Query"
        - Query Key: "utm_medium"
     
     c. **UTM Campaign URL Parameter**:
        - Variable Name: "URL Parameter - utm_campaign"
        - Variable Type: "URL"
        - Component Type: "Query"
        - Query Key: "utm_campaign"

2. **Configure UTM Tracking in GA4**:
   - Edit your GA4 Configuration tag
   - Under "Fields to Set", add the following:
     a. For utm_source:
        - Field Name: `campaign_source`
        - Value: Use this expression:
          ```
          {% raw %}{{utm_source}}{% endraw %} || {% raw %}{{URL Parameter - utm_source}}{% endraw %}
          ```
     
     b. For utm_medium:
        - Field Name: `campaign_medium`
        - Value: Use this expression:
          ```
          {% raw %}{{utm_medium}}{% endraw %} || {% raw %}{{URL Parameter - utm_medium}}{% endraw %}
          ```
     
     c. For utm_campaign:
        - Field Name: `campaign_name`
        - Value: Use this expression:
          ```
          {% raw %}{{utm_campaign}}{% endraw %} || {% raw %}{{URL Parameter - utm_campaign}}{% endraw %}
          ```
   - Under "Settings", check "Enable campaign data forwarding to GA4" if available

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
        - Click "Save"
     
     b. **User Segments**:
        - Dimension name: "User Segments"
        - Scope: "User"
        - Description: "User segment categories (recent_purchaser, frequent_visitor, etc.)"
        - Click "Save"
     
     c. **Visit Count**:
        - Dimension name: "Visit Count"
        - Scope: "User"
        - Description: "Number of visits from this user"
        - Click "Save"
     
     d. **Days Since First Visit**:
        - Dimension name: "Days Since First Visit"
        - Scope: "User"
        - Description: "Number of days since user's first visit"
        - Click "Save"
     
     e. **Language Preference**:
        - Dimension name: "Language Preference"
        - Scope: "User"
        - Description: "User's preferred language"
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
   
   - Configure User-ID in your GA4 Configuration tag in GTM:
     - Edit your GA4 Configuration tag
     - Under "Fields to Set", add a new field:
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
   - Use GTM Preview mode to test all events
   - Visit `/analytics-test` in your application to trigger test events

2. **DebugView**:
   - In GA4, use DebugView to see real-time events
   - Verify that ecommerce events are being captured correctly
   - Confirm that user properties and segments are set properly

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
