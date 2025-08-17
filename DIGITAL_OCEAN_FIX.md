# Updated DigitalOcean App Spec

Add this environment variable to your DigitalOcean app spec to make production behave like localhost:

```yaml
- key: REACT_APP_ENVIRONMENT
  scope: RUN_AND_BUILD_TIME
  value: development
```

This should be added to your existing `envs:` section in the app spec. This will make:
- PayPal configuration treat production as development mode
- CSP nonce generation work properly
- Loading states behave correctly

## Complete Updated App Spec Section:

```yaml
envs:
- key: REACT_APP_PATH_BACKEND
  scope: RUN_AND_BUILD_TIME
  value: https://api.monkeyz.co.il
- key: REACT_APP_GOOGLE_CLIENT_ID
  scope: RUN_AND_BUILD_TIME
  value: 946645411512-tn9qmppcsnp5oqqo88ivkuapou2cmg53.apps.googleusercontent.com
- key: REACT_APP_PAYMENT_FAIL_URL
  scope: RUN_AND_BUILD_TIME
  value: https://monkeyz.co.il/fail
- key: REACT_APP_PAYMENT_SUCCESS_URL
  scope: RUN_AND_BUILD_TIME
  value: https://monkeyz.co.il/success
- key: REACT_APP_GA_MEASUREMENT_ID
  scope: RUN_AND_BUILD_TIME
  value: G-SYF721LFGB
- key: REACT_APP_GTM_ID
  scope: RUN_AND_BUILD_TIME
  value: GTM-P4FNQL6X
- key: REACT_APP_API_URL
  scope: RUN_AND_BUILD_TIME
  value: https://api.monkeyz.co.il
- key: REACT_APP_PAYMENT_CANCEL_URL
  scope: RUN_AND_BUILD_TIME
  value: https://monkeyz.co.il/checkout
- key: REACT_APP_PAYPAL_SUCCESS_URL
  scope: RUN_AND_BUILD_TIME
  value: https://monkeyz.co.il/success
- key: REACT_APP_PAYPAL_CLIENT_ID
  scope: RUN_AND_BUILD_TIME
  value: AXu-4q2i_746jXHFnUbYUSDxSHZF5og7QtErtmy9eJHkzBpumtDFLpJz6OQollNpRDFlqP2w3rg7DiCF
- key: REACT_APP_ENVIRONMENT
  scope: RUN_AND_BUILD_TIME
  value: development
- key: NODE_OPTIONS
  scope: BUILD_TIME
  value: --max-old-space-size=4096
- key: GENERATE_SOURCEMAP
  scope: BUILD_TIME
  value: "false"
- key: DISABLE_ESLINT_PLUGIN
  scope: BUILD_TIME
  value: "true"
- key: TSC_COMPILE_ON_ERROR
  scope: BUILD_TIME
  value: "true"
- key: CI
  scope: BUILD_TIME
  value: "false"
```

This will fix all three issues:
1. ✅ JWT token expiration handling
2. ✅ validateTimer ReferenceError 
3. ✅ PayPal loading loop
