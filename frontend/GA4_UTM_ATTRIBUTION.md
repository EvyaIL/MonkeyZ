# GA4 UTM Attribution Setup

This document outlines the steps for setting up proper UTM parameter attribution in Google Analytics 4 (GA4) for the MonkeyZ e-commerce website.

## Custom Dimensions in GA4 for UTM Parameters

For enhanced campaign tracking and attribution analysis, you need to set up custom dimensions in GA4 to store UTM parameter values:

### Step 1: Create Custom Dimensions in GA4

1. **Log in to your Google Analytics 4 property**
2. **Navigate to Admin > Custom Definitions**
3. **Click "Create custom dimensions"**
4. **Create the following custom dimensions:**

   a. **First Touch Source**
      - Dimension name: first_touch_source
      - Scope: User
      - Description: Captures the first marketing source that brought the user to the site

   b. **First Touch Medium**
      - Dimension name: first_touch_medium  
      - Scope: User
      - Description: Captures the first marketing medium that brought the user to the site

   c. **First Touch Campaign**
      - Dimension name: first_touch_campaign
      - Scope: User
      - Description: Captures the first marketing campaign that brought the user to the site

   d. **Last Touch Source**
      - Dimension name: last_touch_source
      - Scope: User
      - Description: Captures the most recent marketing source that brought the user to the site

   e. **Last Touch Medium**
      - Dimension name: last_touch_medium
      - Scope: User
      - Description: Captures the most recent marketing medium that brought the user to the site

   f. **Last Touch Campaign**
      - Dimension name: last_touch_campaign
      - Scope: User
      - Description: Captures the most recent marketing campaign that brought the user to the site

   g. **Days Since First Touch**
      - Dimension name: days_since_first_touch
      - Scope: User
      - Description: Number of days since the user's first visit

   h. **Days Since Last Touch**
      - Dimension name: days_since_last_touch
      - Scope: User
      - Description: Number of days since the user's last marketing touchpoint

## Configure User Properties in GTM

After creating custom dimensions in GA4, you need to send this data from GTM to GA4:

### Step 2: Update the Google Tag in GTM

1. **In GTM, navigate to your GA4 Configuration Tag**
2. **Under "Additional Configuration > User Properties", add the following:**

   a. **First Touch Source**
      - Property Name: first_touch_source
      - Property Value: {% raw %}{{Cookie - first_touch_source}}{% endraw %}

   b. **First Touch Medium**
      - Property Name: first_touch_medium
      - Property Value: {% raw %}{{Cookie - first_touch_medium}}{% endraw %}

   c. **First Touch Campaign**
      - Property Name: first_touch_campaign
      - Property Value: {% raw %}{{Cookie - first_touch_campaign}}{% endraw %}

   d. **Last Touch Source**
      - Property Name: last_touch_source
      - Property Value: {% raw %}{{URL Parameter - utm_source}}{% endraw %}

   e. **Last Touch Medium**
      - Property Name: last_touch_medium
      - Property Value: {% raw %}{{URL Parameter - utm_medium}}{% endraw %}

   f. **Last Touch Campaign**
      - Property Name: last_touch_campaign
      - Property Value: {% raw %}{{URL Parameter - utm_campaign}}{% endraw %}

3. **Save and publish your changes**

## Create Audience Segments in GA4

Use the custom dimensions to create meaningful audience segments:

### Step 3: Create Audience Segments

1. **In GA4, navigate to Admin > Audiences**
2. **Click "New audience"**
3. **Create the following segments:**

   a. **Organic Search First Touch**
      - Condition: first_touch_medium contains "organic"
   
   b. **Paid Search First Touch**
      - Condition: first_touch_medium contains "cpc" or "ppc"
   
   c. **Social Media First Touch**
      - Condition: first_touch_medium contains "social" or first_touch_source contains "facebook" or "instagram"
   
   d. **Email First Touch**
      - Condition: first_touch_medium contains "email"
   
   e. **Multi-Channel Users**
      - Condition: first_touch_medium != last_touch_medium

## Set Up Funnel Analysis in GA4

Analyze the effectiveness of your marketing campaigns at each stage of the purchase funnel:

### Step 4: Create Funnel Analysis Reports

1. **In GA4, navigate to Explore > Create New Exploration**
2. **Choose "Funnel exploration"**
3. **Configure the following:**
   - Dimensions: Add "first_touch_source", "first_touch_medium", "first_touch_campaign"
   - Metrics: Add "users", "conversion rate"
   - Steps: 
     1. view_item (Product View)
     2. add_to_cart
     3. begin_checkout
     4. purchase
4. **Save the exploration**

## Test with Sample UTM-Tagged URLs

Create test URLs with UTM parameters to verify your tracking setup:

### Step 5: Create Test URLs

1. **Create sample URLs with different UTM parameters**:
   - `https://monkeyz.co.il/?utm_source=facebook&utm_medium=social&utm_campaign=summer_sale`
   - `https://monkeyz.co.il/?utm_source=google&utm_medium=cpc&utm_campaign=brand_terms`
   - `https://monkeyz.co.il/?utm_source=newsletter&utm_medium=email&utm_campaign=june_promotion`

2. **Test flow**:
   - Visit each URL
   - Browse products
   - Add a product to cart
   - Begin checkout
   - Complete a purchase (test mode)

3. **Verify data in GA4**:
   - Check real-time reports
   - Verify custom dimensions are populated
   - Check funnel progression

## Additional Configuration for Enhanced E-commerce

To get the most out of your UTM tracking, add additional configuration for enhanced e-commerce analysis:

### Step 6: Configure Enhanced E-commerce Settings

1. **In GA4, navigate to Admin > Data Streams > Web**
2. **Click on your web stream**
3. **Under Enhanced Measurement, ensure the following are enabled:**
   - Page views
   - Scrolls
   - Outbound clicks
   - Site search
   - Video engagement
   - File downloads

4. **Create E-commerce-specific Custom Reports**:
   - Revenue by First Touch Channel
   - Conversion Rate by Marketing Campaign
   - Average Order Value by Source/Medium
   - Product Affinity by Campaign

## Advanced Attribution Models in GA4

Configure different attribution models to understand how your marketing efforts contribute to conversions:

### Step 7: Set Up Attribution Models

1. **In GA4, navigate to Advertising > Attribution**
2. **Configure the attribution settings:**
   - Attribution model: Choose "Data-driven" if available, or "Position-based"
   - Lookback window: Recommended 30-90 days for initial setup
   - Attribution reporting: Enable cross-channel reporting

3. **Create custom attribution reports comparing:**
   - First-click attribution
   - Last-click attribution
   - Position-based attribution
   - Time decay attribution
