import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import re

MONGODB_URI = "mongodb+srv://doadmin:MOpg1x782Wj94t56@mongodb1-92cc6b02.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=mongodb1"
DB_NAME = "shop"

# List of legitimate product names with gibberish names to keep
LEGITIMATE_PRODUCTS = [
    "NNNa", "UTa", "knkkmk", "TestNUmb4", "tadddd1", "Homtest"
]

async def remove_fake_monkeyz_products():
    """Remove fake MonkeyZ products from the database while keeping legitimate ones"""
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    
    print("Searching for fake MonkeyZ products...")
    
    # Find and list all products first
    all_products = await db["products"].find({}).to_list(length=1000)
    
    print(f"Found {len(all_products)} total products in database.")
    
    # Identify fake products (those starting with "MonkeyZ" and not in the legitimate list)
    fake_products = []
    legitimate_products = []
    
    for product in all_products:
        product_name = product.get('name')
        
        # Handle different name formats (string or object)
        if isinstance(product_name, dict):
            # Try to get English name first, then Hebrew, then stringify the object
            display_name = product_name.get('en') or product_name.get('he') or str(product_name)
        else:
            display_name = product_name
            
        # Check if this is a fake product (starts with MonkeyZ and not in legitimate list)
        is_fake = False
        
        if isinstance(display_name, str):
            if display_name.startswith("MonkeyZ") and display_name not in LEGITIMATE_PRODUCTS:
                is_fake = True
                fake_products.append(product)
            else:
                legitimate_products.append(product)
        else:
            # If name isn't a string, consider it legitimate
            legitimate_products.append(product)
    
    print(f"\nFound {len(fake_products)} fake MonkeyZ products to remove:")
    for product in fake_products:
        name = product.get('name')
        if isinstance(name, dict):
            name = name.get('en') or name.get('he') or str(name)
        print(f"- {name} (ID: {product.get('_id')})")
    
    # Remove the fake products
    removed_count = 0
    if fake_products:
        confirm = input("\nDo you want to proceed with removal? (y/n): ")
        if confirm.lower() == 'y':
            for product in fake_products:
                result = await db["products"].delete_one({"_id": product["_id"]})
                name = product.get('name')
                if isinstance(name, dict):
                    name = name.get('en') or name.get('he') or str(name)
                
                if result.deleted_count > 0:
                    print(f"✓ Removed: {name}")
                    removed_count += 1
                else:
                    print(f"✗ Failed to remove: {name}")
            
            print(f"\nRemoval complete! Removed {removed_count} fake products.")
        else:
            print("Removal cancelled.")
    else:
        print("No fake products found to remove.")
    
    # Show remaining products
    print("\nRemaining products:")
    remaining_products = await db["products"].find({}).to_list(length=1000)
    for p in remaining_products:
        name = p.get('name')
        if isinstance(name, dict):
            name = name.get('en') or name.get('he') or str(name)
        print(f"- {name}")
    
    client.close()

if __name__ == "__main__":
    try:
        asyncio.run(remove_fake_monkeyz_products())
    except Exception as e:
        print(f"Error running script: {e}")
        import traceback
        traceback.print_exc()