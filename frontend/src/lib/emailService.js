import emailjs from '@emailjs/browser';

// Initialize with the public key from environment variable
emailjs.init(process.env.REACT_APP_EMAILJS_PUBLIC_KEY);

export function sendOtpEmail({ to_email, otp, lang = 'en' }) {
  const passcode = otp || (Math.floor(100000 + Math.random() * 900000).toString());
  const now = new Date();
  const expire = new Date(now.getTime() + 15 * 60000); // 15 minutes from now
  const time = expire.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return emailjs.send(
    process.env.REACT_APP_EMAILJS_SERVICE_ID,
    process.env.REACT_APP_EMAILJS_OTP_TEMPLATE,
    {
      to_email,
      passcode,
      time,
      email: to_email,
      otp: passcode,
      lang,
    }
  ).then(
    (result) => {
      console.log('[EmailJS OTP] Success:', result);
      return result;
    },
    (error) => {
      console.error('[EmailJS OTP] Error:', error);
      throw error;
    }
  );
}

export function sendWelcomeEmail({ to_email, username, lang = 'en' }) {
  return emailjs.send(
    process.env.REACT_APP_EMAILJS_SERVICE_ID,
    process.env.REACT_APP_EMAILJS_WELCOME_TEMPLATE,
    {
      to_email,
      username,
      email: to_email,
      lang,
    }
  );
}

export function sendPasswordResetEmail({ to_email, reset_link, lang = 'en' }) {
  return emailjs.send(
    process.env.REACT_APP_EMAILJS_SERVICE_ID,
    process.env.REACT_APP_EMAILJS_RESET_TEMPLATE,
    {
      to_email,
      reset_link,
      email: to_email,
      lang,
    }
  );
}
