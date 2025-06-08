import requests
import asyncio
import motor.motor_asyncio
from dotenv import load_dotenv
import os
import certifi
import json
from datetime import datetime
import traceback

# Load environment variables
load_dotenv()

# MongoDB connection string
MONGODB_URI = os.getenv("MONGODB_URI") or "mongodb+srv://doadmin:MOpg1x782Wj94t56@mongodb1-92cc6b02.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=mongodb1"

# API base URL
API_BASE_URL = "http://localhost:8000"

async def fix_mongodb_products():
    """Fix MongoDB products to ensure they have correct fields"""
    try:
        print("\n===== FIXING MONGODB PRODUCTS =====")
        # Connect to MongoDB
        client = motor.motor_asyncio.AsyncIOMotorClient(
            MONGODB_URI,
            tlsCAFile=certifi.where()
        )
        
        print("Connected to MongoDB")
        
        # Ensure products exist in admin.products collection
        admin_products = client.admin.products
        products_count = await admin_products.count_documents({})
        print(f"Found {products_count} products in admin.products")
        
        # Create test products if none exist
        if products_count == 0:
            print("Creating test products in admin.products...")
            
            # Create sample products with both naming conventions
            test_products = [
                {
                    "name": "Premium VPN Service",
                    "description": "Secure your connection with our top-rated VPN service.",
                    "price": 49.99,
                    "imageUrl": "https://images.unsplash.com/photo-1563013544-824ae1b704d3",
                    "active": True,
                    "category": "Security",
                    "is_new": True,
                    "isNew": True,
                    "best_seller": True,
                    "isBestSeller": True,
                    "display_on_homepage": True,
                    "displayOnHomepage": True,
                    "discountPercentage": 15,
                    "metadata": {},
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                },
                {
                    "name": "Windows 11 Pro License",
                    "description": "Genuine Windows 11 Pro license key with lifetime activation.",
                    "price": 129.99,
                    "imageUrl": "https://images.unsplash.com/photo-1624571409108-e9a41746af53",
                    "active": True,
                    "category": "Operating Systems",
                    "is_new": True,
                    "isNew": True,
                    "best_seller": False,
                    "isBestSeller": False,
                    "display_on_homepage": True,
                    "displayOnHomepage": True,
                    "discountPercentage": 0,
                    "metadata": {},
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                },
                {
                    "name": "Password Manager Pro",
                    "description": "Secure password management solution with end-to-end encryption.",
                    "price": 39.99,
                    "imageUrl": "https://images.unsplash.com/photo-1633265486064-086b219458ec",
                    "active": True,
                    "category": "Security",
                    "is_new": False,
                    "isNew": False,
                    "best_seller": True,
                    "isBestSeller": True,
                    "display_on_homepage": True,
                    "displayOnHomepage": True,
                    "discountPercentage": 10,
                    "metadata": {},
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                },
                {
                    "name": "Cloud Storage 1TB",
                    "description": "1TB of secure cloud storage with automatic backup.",
                    "price": 79.99,
                    "imageUrl": "https://images.unsplash.com/photo-1614064641938-3bbee52942c7",
                    "active": True,
                    "category": "Storage",
                    "is_new": False,
                    "isNew": False,
                    "best_seller": False,
                    "isBestSeller": False,
                    "display_on_homepage": False,
                    "displayOnHomepage": False,
                    "discountPercentage": 20,
                    "metadata": {},
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
            ]
            
            # Insert products into admin.products
            result = await admin_products.insert_many(test_products)
            print(f"Added {len(result.inserted_ids)} test products to admin.products")
        
        # Update all products to ensure they have both naming conventions
        all_products = await admin_products.find({}).to_list(length=None)
        
        for product in all_products:
            product_id = product["_id"]
            
            # Get existing values with fallbacks
            is_new = product.get("is_new", False) or product.get("isNew", False)
            best_seller = product.get("best_seller", False) or product.get("isBestSeller", False)
            display_on_homepage = product.get("display_on_homepage", False) or product.get("displayOnHomepage", False)
            discount = product.get("discountPercentage", 0)
            
            # Update product with both naming conventions
            await admin_products.update_one(
                {"_id": product_id},
                {
                    "$set": {
                        "is_new": is_new,
                        "isNew": is_new,
                        "best_seller": best_seller,
                        "isBestSeller": best_seller,
                        "display_on_homepage": display_on_homepage,
                        "displayOnHomepage": display_on_homepage,
                        "discountPercentage": discount,
                        "active": True,
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            
            print(f"Updated product: {product.get('name', 'unknown')}")
        
        # Copy products to shop.Product collection
        shop_products = client.shop.Product
        
        # Clear existing products
        await shop_products.delete_many({})
        
        # Copy current admin products to shop.Product
        all_products = await admin_products.find({}).to_list(length=None)
        
        for product in all_products:
            # Remove _id field to avoid conflicts
            product_id = product.pop("_id", None)
            
            # Insert into shop.Product
            await shop_products.insert_one(product)
            
            print(f"Copied product to shop.Product: {product.get('name', 'unknown')}")
        
        shop_count = await shop_products.count_documents({})
        print(f"Total products in shop.Product: {shop_count}")
        
        print("\nMongoDB products fixed successfully")
        return True
        
    except Exception as e:
        print(f"Error fixing MongoDB products: {str(e)}")
        print(traceback.format_exc())
        return False

def test_api_endpoints():
    """Test API endpoints to verify they work correctly"""
    print("\n===== TESTING API ENDPOINTS =====")
    
    endpoints = [
        "/product/all",
        "/product/homepage",
        "/product/best-sellers",
        "/product/recent"
    ]
    
    success_count = 0
    
    for endpoint in endpoints:
        url = f"{API_BASE_URL}{endpoint}"
        print(f"\nTesting endpoint: {url}")
        
        try:
            response = requests.get(url)
            print(f"Status code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    print(f"Success! Received {len(data)} products")
                    
                    if len(data) > 0:
                        # Print first product details
                        first_product = data[0]
                        print("\nSample product:")
                        print(f"Name: {first_product.get('name', 'Unknown')}")
                        print(f"Best seller: {first_product.get('best_seller', False) or first_product.get('isBestSeller', False)}")
                        print(f"New: {first_product.get('is_new', False) or first_product.get('isNew', False)}")
                        print(f"Homepage: {first_product.get('display_on_homepage', False) or first_product.get('displayOnHomepage', False)}")
                        print(f"Discount: {first_product.get('discountPercentage', 0)}%")
                        
                        success_count += 1
                    else:
                        print("Warning: No products returned")
                else:
                    print(f"Warning: Response is not a list: {data}")
            else:
                print(f"Error: {response.text}")
                
        except Exception as e:
            print(f"Error testing endpoint: {str(e)}")
    
    print(f"\nEndpoint tests completed: {success_count}/{len(endpoints)} successful")
    return success_count == len(endpoints)

async def main():
    """Main function to fix MongoDB and test API"""
    # Fix MongoDB products
    mongodb_fixed = await fix_mongodb_products()
    
    if mongodb_fixed:
        # Test API endpoints
        api_working = test_api_endpoints()
        
        if api_working:
            print("\n✅ ALL FIXES COMPLETED SUCCESSFULLY!")
            print("Products should now display correctly with proper tags.")
            print("Please restart the frontend application to see the changes.")
        else:
            print("\n❌ API ENDPOINTS STILL HAVE ISSUES")
            print("Please check the backend server logs for more details.")
            print("You may need to restart the backend server.")
    else:
        print("\n❌ FAILED TO FIX MONGODB PRODUCTS")
        print("Please check MongoDB connection and permissions.")

if __name__ == "__main__":
    asyncio.run(main())
