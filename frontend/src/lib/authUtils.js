// Utility for OTP generation and validation
export function generateOTP(length = 6) {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

export function validatePhone(phone) {
  // 05XXXXXXXX or +972XXXXXXXXX (up to 15 digits)
  if (/^05\d{8}$/.test(phone)) return true;
  if (/^\+972\d{8,12}$/.test(phone) && phone.length <= 15) return true;
  return false;
}

export function validateEmail(email) {
  // More comprehensive email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export function validatePassword(password) {
  return typeof password === "string" && password.length >= 8;
}
