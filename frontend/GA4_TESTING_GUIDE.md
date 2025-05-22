# GA4 Testing Guide

This document provides comprehensive testing instructions for validating the Google Analytics 4 (GA4) and Google Tag Manager (GTM) implementation on the MonkeyZ e-commerce website.

## Test URLs with UTM Parameters

Use these sample URLs to test your UTM parameter tracking:

### Facebook Ads
```
https://monkeyz.co.il/?utm_source=facebook&utm_medium=paid_social&utm_campaign=summer_sale&utm_content=carousel_1
```

### Google Search Ads
```
https://monkeyz.co.il/?utm_source=google&utm_medium=cpc&utm_campaign=brand_terms&utm_content=headline_2
```

### Email Marketing
```
https://monkeyz.co.il/?utm_source=mailchimp&utm_medium=email&utm_campaign=june_newsletter&utm_content=hero_banner
```

### Instagram
```
https://monkeyz.co.il/?utm_source=instagram&utm_medium=organic_social&utm_campaign=product_launch&utm_content=story
```

### Affiliate Marketing
```
https://monkeyz.co.il/?utm_source=affiliate&utm_medium=referral&utm_campaign=influencer_program&utm_content=blog_post
```

## Testing Procedure

Follow these steps to thoroughly test your GA4 implementation:

### 1. Basic Tracking Tests

#### Page View Tracking
- Visit multiple pages on the site using different UTM-tagged URLs
- Verify in GA4 Real-Time reports that page views are being tracked
- Confirm UTM parameters are captured correctly

#### Event Tracking
- Perform the following actions and verify they're captured in GA4:
  - View a product
  - Add to cart
  - Begin checkout
  - Complete purchase
  - Use search functionality
  - Click on promotional banners

### 2. E-commerce Tracking Tests

#### Product View
- View several different products
- Verify in GA4 Real-Time reports that view_item events are triggered
- Confirm product details (name, price, category) are captured correctly

#### Add to Cart
- Add multiple products to cart
- Verify add_to_cart events in GA4
- Confirm product details and quantities are correct

#### Checkout
- Begin checkout process
- Verify begin_checkout event in GA4
- Confirm cart total value is correct

#### Purchase
- Complete a purchase (in test mode)
- Verify purchase event in GA4
- Confirm transaction ID, revenue, and item details are correct

### 3. UTM Parameter Attribution Tests

#### First Touch Attribution
- Open an incognito/private browser window
- Visit the site using a UTM-tagged URL
- Perform various actions without completing a purchase
- Close the browser
- Return later using a different UTM-tagged URL
- Complete a purchase
- Verify in GA4 that both first touch and last touch attribution are tracked correctly

#### Multi-Session Attribution
- Visit the site multiple times over several days using different UTM parameters
- Complete a purchase on the final visit
- Verify attribution data in GA4 reports

### 4. GTM Debugging

#### Using GTM Preview Mode
1. In GTM, click the "Preview" button
2. Enter your website URL
3. In the preview debugger, verify:
   - All expected events are firing
   - Data layer variables contain correct values
   - No JavaScript errors occur

#### Using GA4 DebugView
1. In GA4, navigate to Configure > DebugView
2. In a separate tab, visit your website with the debug parameter:
   ```
   https://monkeyz.co.il/?utm_source=test&utm_medium=debug&utm_campaign=validation&debug_mode=1
   ```
3. Verify events appear in DebugView with correct parameters

## Validation Checklist

Use this checklist to confirm your implementation is working correctly:

### Basic Tracking
- [ ] Page views are tracked
- [ ] User properties are sent (user segments, language preference)
- [ ] Client ID is consistent across sessions

### Event Tracking
- [ ] view_item events include correct product details
- [ ] add_to_cart events include correct product and quantity
- [ ] begin_checkout events include cart value
- [ ] purchase events include transaction ID and correct revenue

### UTM Attribution
- [ ] UTM parameters are captured in dataLayer
- [ ] First touch source/medium/campaign are stored in cookies
- [ ] Last touch source/medium/campaign are captured
- [ ] Custom dimensions in GA4 are populated with UTM data

### E-commerce Data
- [ ] Product data is correctly formatted
- [ ] Currency is properly specified (ILS)
- [ ] Transaction IDs are unique
- [ ] Revenue values match actual purchase amounts

### Funnel Analysis
- [ ] Funnel steps are tracked in sequence
- [ ] Step timing data is captured
- [ ] Funnel visualizations in GA4 show expected user flow

## Common Issues and Solutions

### Missing Events
- Check for JavaScript errors in the browser console
- Verify GTM container is properly loaded
- Confirm data layer is initialized before events are pushed

### Incorrect E-commerce Data
- Ensure product objects match GA4 expected format
- Verify currency code is consistently applied
- Check for NaN or undefined values in price fields

### UTM Parameter Issues
- Make sure URL parameters are properly decoded
- Check cookie storage and retrieval logic
- Verify cross-domain tracking if applicable

### Funnel Abandonment
- Look for JavaScript errors at transition points
- Check that all required events are firing
- Verify session continuity across pages

## Next Steps After Validation

Once testing is complete and all issues are resolved:

1. **Document Findings**
   - Note any discrepancies between expected and actual behavior
   - Document workarounds implemented for any issues

2. **Set Up Regular Monitoring**
   - Create automated alerts for tracking failures
   - Schedule weekly data quality checks

3. **Implement Enhanced Features**
   - Consider adding scroll depth tracking
   - Implement enhanced e-commerce features
   - Set up A/B testing integration
