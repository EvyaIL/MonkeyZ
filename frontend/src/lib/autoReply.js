// Utility for sending automatic email replies
import emailjs from '@emailjs/browser';

// EmailJS configuration for auto-reply
const AUTO_REPLY_SERVICE_ID = "service_xheer8t";
const AUTO_REPLY_TEMPLATE_ID = "template_auto_reply"; // Create this template in EmailJS
const PUBLIC_KEY = "OZANGbTigZyYpNfAT";

/**
 * Send an automatic reply to a user who submitted a contact form
 * 
 * @param {Object} params - Parameters for auto-reply
 * @param {string} params.to_name - Recipient's name
 * @param {string} params.to_email - Recipient's email
 * @param {string} params.subject - Email subject
 * @returns {Promise<EmailJSResponseStatus>} - Promise with the response
 */
export const sendAutoReply = async ({ to_name, to_email, subject = 'Thank you for contacting MonkeyZ' }) => {
  try {
    const templateParams = {
      to_name,
      to_email,
      subject,
      message: `Dear ${to_name},

Thank you for reaching out to MonkeyZ. We have received your message and will get back to you as soon as possible, usually within 24-48 business hours.

In the meantime, you might find answers to common questions in our FAQ section at https://www.monkeyz.co.il/faq.

Best regards,
The MonkeyZ Team`
    };

    return await emailjs.send(
      AUTO_REPLY_SERVICE_ID,
      AUTO_REPLY_TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );
  } catch (error) {
    console.error('Error sending auto-reply:', error);
    throw error;
  }
};
