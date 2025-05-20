import emailjs from '@emailjs/browser';

emailjs.init('OZANGbTigZyYpNfAT'); // Use the correct public key

export function sendOtpEmail({ to_email, otp, lang = 'en' }) {
  // Always generate a passcode if not provided
  const passcode = otp || (Math.floor(100000 + Math.random() * 900000).toString());
  const now = new Date();
  const expire = new Date(now.getTime() + 15 * 60000); // 15 minutes from now
  const time = expire.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  // Debug: log what is being sent
  console.log('[EmailJS OTP] Sending:', {
    service: 'service_xheer8t',
    template: 'template_fi5fm2c',
    to_email,
    passcode,
    time,
    email: to_email,
    otp: passcode,
    lang,
  });
  return emailjs.send(
    'service_xheer8t',
    'template_fi5fm2c',
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
    'service_xheer8t',
    'template_iwzazla',
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
    'service_xheer8t',
    'template_fi5fm2c',
    {
      to_email,
      reset_link,
      email: to_email,
      lang,
    }
  );
}
