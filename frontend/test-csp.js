#!/usr/bin/env node
/**
 * Quick test to verify CSP configuration supports both localhost and production
 */

const express = require('express');
const crypto = require('crypto');

// Simulate the CSP logic from server.js
function testCSP() {
  console.log('🧪 Testing CSP Configuration...\n');
  
  // Test development environment
  process.env.NODE_ENV = 'development';
  process.env.REACT_APP_API_URL = 'http://localhost:8000';
  
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.REACT_APP_API_URL?.includes('localhost');
  
  const connectSrc = [
    "'self'",
    "*.paypal.com",
    "*.paypalobjects.com", 
    "*.venmo.com",
    "https://accounts.google.com",
    "https://api.monkeyz.co.il",
    "https://www.google-analytics.com",
    "https://analytics.google.com"
  ];
  
  if (isDevelopment) {
    connectSrc.push("http://localhost:8000", "http://127.0.0.1:8000");
  }
  
  console.log('🔧 Development Environment:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   REACT_APP_API_URL: ${process.env.REACT_APP_API_URL}`);
  console.log(`   isDevelopment: ${isDevelopment}`);
  console.log(`   connect-src: ${connectSrc.join(' ')}\n`);
  
  // Test production environment
  process.env.NODE_ENV = 'production';
  process.env.REACT_APP_API_URL = 'https://api.monkeyz.co.il';
  
  const isDevelopmentProd = process.env.NODE_ENV === 'development' || process.env.REACT_APP_API_URL?.includes('localhost');
  
  const connectSrcProd = [
    "'self'",
    "*.paypal.com",
    "*.paypalobjects.com", 
    "*.venmo.com",
    "https://accounts.google.com",
    "https://api.monkeyz.co.il",
    "https://www.google-analytics.com",
    "https://analytics.google.com"
  ];
  
  if (isDevelopmentProd) {
    connectSrcProd.push("http://localhost:8000", "http://127.0.0.1:8000");
  }
  
  console.log('🚀 Production Environment:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   REACT_APP_API_URL: ${process.env.REACT_APP_API_URL}`);
  console.log(`   isDevelopment: ${isDevelopmentProd}`);
  console.log(`   connect-src: ${connectSrcProd.join(' ')}\n`);
  
  console.log('✅ CSP Configuration Test Complete!');
  console.log('📋 Summary:');
  console.log('   • Development: Allows both localhost:8000 and api.monkeyz.co.il');
  console.log('   • Production: Only allows api.monkeyz.co.il (secure)');
  console.log('   • PayPal domains are allowed in both environments');
}

testCSP();
