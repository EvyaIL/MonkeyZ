# GTM Validation Error Fixes

This document contains the steps needed to fix the validation errors in Google Tag Manager for the MonkeyZ e-commerce website.

## Missing Variable Errors

The following validation errors were identified in GTM related to missing variables:

1. Missing ecommerce variables: `ecommerce.items`, `ecommerce.transaction_id`, `ecommerce.value`
2. Missing funnel progress variables: `funnel_progress.current_step`, etc.
3. Missing Cookie variables: `Cookie - first_touch_source`, etc.

## Step-by-Step Fix Instructions

### 1. Create Missing Ecommerce Variables

1. **Create ecommerce.items Variable**:
   - In GTM, go to "Variables" > "User-Defined Variables" > "New"
   - Name: "ecommerce.items"
   - Variable Type: "Data Layer Variable"
   - Data Layer Variable Name: `ecommerce.items`
   - Data Layer Version: Version 2
   - Click "Save"

2. **Create ecommerce.transaction_id Variable**:
   - In GTM, go to "Variables" > "User-Defined Variables" > "New"
   - Name: "ecommerce.transaction_id"
   - Variable Type: "Data Layer Variable"
   - Data Layer Variable Name: `ecommerce.transaction_id`
   - Data Layer Version: Version 2
   - Click "Save"

3. **Create ecommerce.value Variable**:
   - In GTM, go to "Variables" > "User-Defined Variables" > "New"
   - Name: "ecommerce.value"
   - Variable Type: "Data Layer Variable"
   - Data Layer Variable Name: `ecommerce.value`
   - Data Layer Version: Version 2
   - Click "Save"

### 2. Create Missing Funnel Progress Variables

1. **Create funnel_progress.current_step Variable**:
   - In GTM, go to "Variables" > "User-Defined Variables" > "New"
   - Name: "funnel_progress.current_step"
   - Variable Type: "Data Layer Variable"
   - Data Layer Variable Name: `funnel_progress.current_step`
   - Data Layer Version: Version 2
   - Click "Save"

2. **Create funnel_progress.steps_completed Variable**:
   - In GTM, go to "Variables" > "User-Defined Variables" > "New"
   - Name: "funnel_progress.steps_completed"
   - Variable Type: "Data Layer Variable"
   - Data Layer Variable Name: `funnel_progress.steps_completed`
   - Data Layer Version: Version 2
   - Click "Save"

3. **Create funnel_progress.time_in_funnel Variable**:
   - In GTM, go to "Variables" > "User-Defined Variables" > "New"
   - Name: "funnel_progress.time_in_funnel"
   - Variable Type: "Data Layer Variable"
   - Data Layer Variable Name: `funnel_progress.time_in_funnel`
   - Data Layer Version: Version 2
   - Click "Save"

4. **Create funnel_progress.total_steps Variable**:
   - In GTM, go to "Variables" > "User-Defined Variables" > "New"
   - Name: "funnel_progress.total_steps"
   - Variable Type: "Data Layer Variable"
   - Data Layer Variable Name: `funnel_progress.total_steps`
   - Data Layer Version: Version 2
   - Click "Save"

### 3. Create Missing Cookie Variables

1. **Create Cookie - first_touch_source Variable**:
   - In GTM, go to "Variables" > "User-Defined Variables" > "New"
   - Name: "Cookie - first_touch_source"
   - Variable Type: "1st Party Cookie"
   - Cookie Name: `_ga_first_touch_source`
   - Click "Save"

2. **Create Cookie - first_touch_medium Variable**:
   - In GTM, go to "Variables" > "User-Defined Variables" > "New"
   - Name: "Cookie - first_touch_medium"
   - Variable Type: "1st Party Cookie"
   - Cookie Name: `_ga_first_touch_medium`
   - Click "Save"

3. **Create Cookie - first_touch_campaign Variable**:
   - In GTM, go to "Variables" > "User-Defined Variables" > "New"
   - Name: "Cookie - first_touch_campaign"
   - Variable Type: "1st Party Cookie"
   - Cookie Name: `_ga_first_touch_campaign`
   - Click "Save"

### 4. Test and Submit Changes

After creating all missing variables:

1. **Preview Your Changes**:
   - Click the "Preview" button in GTM
   - Enter your MonkeyZ website URL in the Preview mode
   - Visit your website and ensure the new variables are being populated correctly

2. **Validate Fixes**:
   - In GTM, return to the Preview mode
   - Go to the "Variables" tab
   - Check that all the previously missing variables now show values when appropriate events occur

3. **Submit Changes**:
   - Once validated, click "Submit" in GTM
   - Add a descriptive version name like "Fix validation errors - add missing variables"
   - Click "Publish"

## Notes for First-Party Cookie Setup

For proper UTM parameter tracking across sessions, make sure to add code to store the UTM parameters in cookies. This can be done through the following steps:

1. Add a Custom HTML tag in GTM that fires on all pages:

```html
<script>
// Store UTM parameters in cookies
function getUrlParam(name) {
  var paramStr = location.search.substr(1);
  var regex = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
  var result = paramStr.match(regex);
  return result ? decodeURIComponent(result[2]) : "";
}

// Function to set cookies
function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "")  + expires + "; path=/; samesite=lax";
}

// Get UTM parameters
var utmSource = getUrlParam("utm_source");
var utmMedium = getUrlParam("utm_medium");
var utmCampaign = getUrlParam("utm_campaign");
var utmTerm = getUrlParam("utm_term");
var utmContent = getUrlParam("utm_content");

// Set cookies if UTM parameters exist
if (utmSource) {
  setCookie("_ga_first_touch_source", utmSource, 30);
}
if (utmMedium) {
  setCookie("_ga_first_touch_medium", utmMedium, 30);
}
if (utmCampaign) {
  setCookie("_ga_first_touch_campaign", utmCampaign, 30);
}
if (utmTerm) {
  setCookie("_ga_first_touch_term", utmTerm, 30);
}
if (utmContent) {
  setCookie("_ga_first_touch_content", utmContent, 30);
}
</script>
```

2. Set this tag to fire on all pages.
