// Utility for OTP generation and validation
export function generateOTP(length = 6) {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

export function validatePhone(phone) {
  // If phone is empty or null, it's valid (optional)
  if (!phone || phone.trim() === "") {
    return true;
  }
  
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

export function validateStrongPassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  
  let strength = 0;
  if (hasLowerCase) strength += 1;
  if (hasUpperCase) strength += 1;
  if (hasNumbers) strength += 1;
  if (hasSpecialChar) strength += 1;
  
  if (strength < 3) {
    return { 
      isValid: false, 
      message: "Password must contain at least 3 of: lowercase, uppercase, numbers, special characters",
      strength 
    };
  }
  
  return { isValid: true, message: "Password is strong", strength };
}

export function getPasswordStrength(password) {
  if (!password) return 0;
  
  let strength = 0;
  // Length bonus
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  // Contains lowercase
  if (/[a-z]/.test(password)) strength += 1;
  // Contains uppercase
  if (/[A-Z]/.test(password)) strength += 1;
  // Contains numbers
  if (/\d/.test(password)) strength += 1;
  // Contains special character
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  
  return Math.min(strength, 5); // Cap at 5
}
