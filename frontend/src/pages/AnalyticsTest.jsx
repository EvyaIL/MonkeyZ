import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { trackEvent } from "../lib/analytics";

const AnalyticsTest = () => {
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [userSegment, setUserSegment] = useState("");
  
  const testPageView = () => {
    console.log("Testing page view tracking...");
    // Page view should be automatically tracked by the router
    alert("Page view tracking tested. Check console and GTM debug mode.");
  };

  const testEvent = () => {
    console.log("Testing custom event tracking...");
    trackEvent("test_event", {
      event_category: "test",
      event_label: "Test Button Click",
      value: 1
    });
    alert("Custom event tracking tested. Check console and GTM debug mode.");
  };

  const testProductView = () => {
    console.log("Testing product view tracking...");
    trackEvent("view_item", {
      ecommerce: {
        items: [{
          item_id: "test-123",
          item_name: "Test Product",
          price: 99.99,
          currency: 'ILS'
        }]
      }
    });
    alert("Product view tracking tested. Check console and GTM debug mode.");
  };

  const testAddToCart = () => {
    console.log("Testing add to cart tracking...");
    trackEvent("add_to_cart", {
      ecommerce: {
        items: [{
          item_id: "test-123",
          item_name: "Test Product",
          price: 99.99,
          quantity: 1,
          currency: 'ILS'
        }]
      }
    });
    alert("Add to cart tracking tested. Check console and GTM debug mode.");
  };

  const testPurchase = () => {
    console.log("Testing purchase tracking...");
    trackEvent("purchase", {
      ecommerce: {
        transaction_id: `test-${Date.now()}`,
        value: 99.99,
        currency: 'ILS',
        items: [{
          item_id: "test-123",
          item_name: "Test Product",
          price: 99.99,
          quantity: 1
        }]
      }
    });
    alert("Purchase tracking tested. Check console and GTM debug mode.");
  };
  
  const testFunnel = () => {
    console.log("Testing funnel analysis...");
    // Simulate a complete funnel sequence
    trackEvent("view_item", {
      ecommerce: {
        items: [{
          item_id: "test-123",
          item_name: "Test Product",
          price: 99.99,
          currency: 'ILS'
        }]
      }
    });
    
    setTimeout(() => {
      trackEvent("add_to_cart", {
        ecommerce: {
          items: [{
            item_id: "test-123",
            item_name: "Test Product",
            price: 99.99,
            quantity: 1,
            currency: 'ILS'
          }]
        }
      });
      
      setTimeout(() => {
        trackEvent("begin_checkout", {
          ecommerce: {
            items: [{
              item_id: "test-123",
              item_name: "Test Product",
              price: 99.99,
              quantity: 1,
              currency: 'ILS'
            }],
            value: 99.99,
            currency: 'ILS'
          }
        });
        
        setTimeout(() => {
          trackEvent("purchase", {
            ecommerce: {
              transaction_id: `test-${Date.now()}`,
              value: 99.99,
              currency: 'ILS',
              items: [{
                item_id: "test-123",
                item_name: "Test Product",
                price: 99.99,
                quantity: 1
              }]
            }
          });
          alert("Full funnel sequence tested. Check console and GTM debug mode.");
        }, 1000);
      }, 1000);
    }, 1000);
  };
  
  const testUserSegment = () => {
    if (!userSegment) {
      alert("Please select a user segment first.");
      return;
    }
    
    console.log(`Testing user segment: ${userSegment}`);
    trackEvent("user_segment_test", {
      user_properties: {
        segments: [userSegment]
      }
    });
    alert(`User segment "${userSegment}" tracking tested. Check console and GTM debug mode.`);
  };
  
  const testUtmParameters = () => {
    if (!utmSource || !utmMedium || !utmCampaign) {
      alert("Please fill in all UTM fields first.");
      return;
    }
    
    console.log("Testing UTM parameter tracking...");
    
    // Build UTM URL and simulate navigation
    const testUtmUrl = `${window.location.origin}${window.location.pathname}?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`;
    
    // Open in new tab to avoid losing current page
    window.open(testUtmUrl, '_blank');
    
    alert("UTM parameters test started in new tab. Check console and GTM debug mode in that tab.");
  };
  
  const testCrossDeviceTracking = () => {
    console.log("Testing cross-device tracking...");
    
    // Get client ID
    const clientId = localStorage.getItem('ga_client_id') || 'no-client-id-found';
    
    // Send event with client ID
    trackEvent("cross_device_test", {
      client_id: clientId,
      device_type: navigator.userAgent
    });
    
    alert(`Cross-device tracking tested with client ID: ${clientId}. Check console and GTM debug mode.`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <Helmet>
        <title>Analytics Test | MonkeyZ</title>
      </Helmet>

      <div className="max-w-2xl w-full bg-white dark:bg-secondary p-8 rounded-lg shadow-lg border border-base-300 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-primary dark:text-accent mb-6 text-center">
          Analytics Test Page
        </h1>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Use the buttons below to test different analytics tracking events. Open your browser console and Google Tag Manager debug mode to verify the events are being tracked.
            </p>

            <h2 className="text-xl font-semibold text-primary dark:text-accent">Basic Events</h2>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={testPageView}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Test Page View
              </button>

              <button
                onClick={testEvent}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Test Custom Event
              </button>
            </div>
            
            <h2 className="text-xl font-semibold text-primary dark:text-accent mt-6">E-commerce Events</h2>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={testProductView}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Test Product View
              </button>

              <button
                onClick={testAddToCart}
                className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Test Add to Cart
              </button>

              <button
                onClick={testPurchase}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Test Purchase
              </button>
              
              <button
                onClick={testFunnel}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Test Complete Funnel
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-primary dark:text-accent">User Segments</h2>
            <div className="flex flex-col space-y-3">
              <select 
                value={userSegment}
                onChange={(e) => setUserSegment(e.target.value)}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              >
                <option value="">Select a segment</option>
                <option value="recent_purchaser">Recent Purchaser</option>
                <option value="active_customer">Active Customer</option>
                <option value="lapsed_customer">Lapsed Customer</option>
                <option value="frequent_visitor">Frequent Visitor</option>
                <option value="new_visitor">New Visitor</option>
                <option value="high_value_cart">High Value Cart</option>
              </select>
              
              <button
                onClick={testUserSegment}
                className="bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Test User Segment
              </button>
            </div>
            
            <h2 className="text-xl font-semibold text-primary dark:text-accent mt-6">UTM Parameters</h2>
            <div className="flex flex-col space-y-3">
              <input
                type="text"
                placeholder="UTM Source (e.g., google)"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              />
              
              <input
                type="text"
                placeholder="UTM Medium (e.g., cpc)"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              />
              
              <input
                type="text"
                placeholder="UTM Campaign (e.g., summer_sale)"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              />
              
              <button
                onClick={testUtmParameters}
                className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Test UTM Parameters
              </button>
            </div>
            
            <h2 className="text-xl font-semibold text-primary dark:text-accent mt-6">Cross-Device</h2>
            <div className="flex flex-col space-y-3">
              <button
                onClick={testCrossDeviceTracking}
                className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Test Cross-Device Tracking
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded text-sm">
          <h3 className="font-bold mb-2">How to Verify:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open browser console (F12)</li>
            <li>Open GTM debug mode (preview mode)</li>
            <li>Click the buttons above</li>
            <li>Check console logs and GTM events</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTest;
