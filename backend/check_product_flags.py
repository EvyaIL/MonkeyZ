import asyncio
import os
import json
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

async def check_products_with_flags():
    """Check for products with special flags like best_seller and display_on_homepage."""
    mongo_uri = os.getenv("MONGODB_URI")
    
    if not mongo_uri:
        print("MONGODB_URI environment variable is not set.")
        return
    
    print(f"Connecting to MongoDB...")
    
    try:
        # Create client
        client = AsyncIOMotorClient(mongo_uri)
        
        # Test connection with ping
        await client.admin.command('ping')
        print("Connected successfully!")
        
        # Get shop database
        db = client.get_database("shop")
        
        # Check products collection
        products_collection = db.products
        
        # Count total products
        total_count = await products_collection.count_documents({})
        print(f"Total products in database: {total_count}")
        
        # Check for products with best_seller flag
        best_seller_count = await products_collection.count_documents({"best_seller": True})
        print(f"Products marked as best_seller: {best_seller_count}")
        
        # Check for products with display_on_homepage flag
        homepage_count = await products_collection.count_documents({"display_on_homepage": True})
        print(f"Products marked for homepage display: {homepage_count}")
        
        # Check for products with is_new flag
        new_count = await products_collection.count_documents({"is_new": True})
        print(f"Products marked as new: {new_count}")
        
        # Get a sample product to inspect its structure
        if total_count > 0:
            sample_product = await products_collection.find_one({})
            print("\nSample product structure:")
            print(json.dumps(sanitize_for_json(sample_product), indent=2))
            
            # Create test products with flags if needed
            if best_seller_count == 0 or homepage_count == 0 or new_count == 0:
                print("\nCreating test products with flags...")
                await create_test_products(products_collection)
        else:
            print("No products found in the database.")
            print("\nCreating test products with flags...")
            await create_test_products(products_collection)
            
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        client.close()

async def create_test_products(collection):
    """Create test products with various flags set."""
    try:
        # Base product template
        base_product = {
            "name": "Test Product",
            "description": "This is a test product description",
            "price": 99,
            "active": True,
            "created_at": datetime.now(),
            "keys": {}
        }
        
        # Create a best seller product
        best_seller = {**base_product, 
                       "name": "Test Best Seller Product", 
                       "best_seller": True,
                       "display_on_homepage": False,
                       "is_new": False}
                       
        result = await collection.insert_one(best_seller)
        print(f"Created best_seller product with ID: {result.inserted_id}")
        
        # Create a homepage product
        homepage = {**base_product, 
                    "name": "Test Homepage Product", 
                    "best_seller": False,
                    "display_on_homepage": True,
                    "is_new": False}
                    
        result = await collection.insert_one(homepage)
        print(f"Created display_on_homepage product with ID: {result.inserted_id}")
        
        # Create a new product
        new_product = {**base_product, 
                       "name": "Test New Product", 
                       "best_seller": False,
                       "display_on_homepage": False,
                       "is_new": True,
                       "discountPercentage": 13}
                       
        result = await collection.insert_one(new_product)
        print(f"Created is_new product with ID: {result.inserted_id}")
        
        # Create a product with all flags
        all_flags = {**base_product, 
                     "name": "Super Test Product", 
                     "best_seller": True,
                     "display_on_homepage": True,
                     "is_new": True,
                     "discountPercentage": 25}
                     
        result = await collection.insert_one(all_flags)
        print(f"Created product with all flags with ID: {result.inserted_id}")
        
    except Exception as e:
        print(f"Error creating test products: {str(e)}")

def sanitize_for_json(obj):
    """Convert MongoDB document to JSON serializable format."""
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_for_json(i) for i in obj]
    elif isinstance(obj, datetime):
        return obj.isoformat()
    elif str(type(obj)) == "<class 'bson.objectid.ObjectId'>":
        return str(obj)
    else:
        return obj

# Run the async function
if __name__ == "__main__":
    asyncio.run(check_products_with_flags())
