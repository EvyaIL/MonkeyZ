import emailjs from '@emailjs/browser';

emailjs.init(process.env.REACT_APP_EMAILJS_USER_ID || 'OZANGbTigZyYpNfAT'); // Use the correct public key

export function sendOtpEmail({ to_email, otp, lang = 'en' }) {
  // Use environment variables for service/template/user IDs
  const SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_xheer8t';
  const TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID_OTP || 'template_fi5fm2c';
  const USER_ID = process.env.REACT_APP_EMAILJS_USER_ID || 'OZANGbTigZyYpNfAT';

  const passcode = otp || (Math.floor(100000 + Math.random() * 900000).toString());
  const now = new Date();
  const expire = new Date(now.getTime() + 15 * 60000); // 15 minutes from now
  const time = expire.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      to_email,
      passcode,
      time,
      email: to_email,
      otp: passcode,
      lang,
    },
    USER_ID
  );
}

export function sendWelcomeEmail({ to_email, username, lang = 'en' }) {
  // Use environment variables for service/template/user IDs
  const SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_xheer8t';
  const TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID_WELCOME || 'template_iwzazla';
  const USER_ID = process.env.REACT_APP_EMAILJS_USER_ID || 'OZANGbTigZyYpNfAT';

  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      to_email,
      username,
      email: to_email,
      lang,
    },
    USER_ID
  );
}

export function sendPasswordResetEmail({ to_email, reset_link, lang = 'en' }) {
  // Use environment variables for service/template/user IDs
  const SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_xheer8t';
  const TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID_PASSWORD_RESET || 'template_fi5fm2c';
  const USER_ID = process.env.REACT_APP_EMAILJS_USER_ID || 'OZANGbTigZyYpNfAT';

  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      to_email,
      reset_link,
      email: to_email,
      lang,
    },
    USER_ID
  );
}
