// Debug Google OAuth Configuration
console.log('=== GOOGLE OAUTH DEBUG INFO ===');
console.log('Current Origin:', window.location.origin);
console.log('Current URL:', window.location.href);
console.log('Google Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
console.log('Environment:', process.env.NODE_ENV);

// Check if client ID is for production or development
const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
if (clientId) {
    if (clientId.includes('googleusercontent.com')) {
        console.log('✅ Valid Google Client ID format');
        if (clientId.includes('-') && clientId.length > 60) {
            console.log('✅ Looks like a proper Google OAuth Client ID');
        } else {
            console.log('⚠️ Client ID format seems unusual');
        }
    } else {
        console.log('❌ Invalid Google Client ID format');
    }
} else {
    console.log('❌ No Google Client ID found in environment');
}

// Check current domain authorization
const currentOrigin = window.location.origin;
const commonAuthorizedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000', 
    'http://127.0.0.1:3000',
    'https://monkeyz.co.il',
    'https://www.monkeyz.co.il'
];

console.log('Current origin:', currentOrigin);
console.log('Common authorized origins that should be added:');
commonAuthorizedOrigins.forEach(origin => {
    console.log(origin === currentOrigin ? `✅ ${origin} (CURRENT)` : `  ${origin}`);
});

console.log('\n🔧 TO FIX THIS ERROR:');
console.log('1. Go to: https://console.cloud.google.com/');
console.log('2. Navigate to: APIs & Services → Credentials');
console.log('3. Edit your OAuth 2.0 Client ID');
console.log(`4. Add "${currentOrigin}" to Authorized JavaScript origins`);
console.log('===============================');
