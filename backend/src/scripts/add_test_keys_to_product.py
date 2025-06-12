"""
This script updates a product in the database to add test keys and set manages_cd_keys to true.
It's useful for testing the key metrics controller and the analytics in the AdminStock page.
"""
import asyncio
import os
import sys
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import random
import string
from dotenv import load_dotenv

# Add the parent directory to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Import models
from src.models.products.products import Product, CDKey

# Load environment variables
load_dotenv()

def generate_test_key(format_string='XXXXX-XXXXX-XXXXX-XXXXX-XXXXX'):
    """Generate a test key in the specified format"""
    key = ""
    for char in format_string:
        if char == 'X':
            key += random.choice(string.ascii_uppercase + string.digits)
        else:
            key += char
    return key

async def add_test_keys_to_product():
    """Add test keys to a product and set manages_cd_keys to true"""
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        print("Error: MONGODB_URI environment variable is not set")
        return
    
    # Connect to MongoDB
    print(f"Connecting to MongoDB: {mongo_uri}")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.get_database("shop")
    await init_beanie(database=db, document_models=[Product])
    
    # Get all products
    products = await Product.find().to_list()
    if not products:
        print("No products found in the database")
        return
    
    # Print available products
    print("\nAvailable products:")
    for i, product in enumerate(products):
        name = product.name.get('en') or next(iter(product.name.values())) if isinstance(product.name, dict) else product.name
        print(f"{i}: {name} (ID: {product.id})")
    
    # Select a product
    try:
        selection = int(input("\nSelect a product index to add keys to: "))
        selected_product = products[selection]
    except (ValueError, IndexError):
        print("Invalid selection")
        return
    
    # Get product name
    product_name = selected_product.name.get('en') or next(iter(selected_product.name.values())) if isinstance(selected_product.name, dict) else selected_product.name
    print(f"\nSelected product: {product_name} (ID: {selected_product.id})")
    
    # Ask how many keys to add
    try:
        num_keys = int(input("How many keys would you like to add? "))
        if num_keys <= 0:
            print("Number of keys must be positive")
            return
    except ValueError:
        print("Invalid number")
        return
    
    # Ask how many should be marked as used
    try:
        num_used = int(input(f"How many of the {num_keys} keys should be marked as used? "))
        if num_used < 0 or num_used > num_keys:
            print(f"Number of used keys must be between 0 and {num_keys}")
            return
    except ValueError:
        print("Invalid number")
        return
    
    # Add keys to the product
    print(f"\nAdding {num_keys} keys to product {product_name}...")
    
    # Initialize cdKeys array if it doesn't exist
    if not hasattr(selected_product, 'cdKeys') or selected_product.cdKeys is None:
        selected_product.cdKeys = []
    
    # Generate and add the keys
    for i in range(num_keys):
        is_used = i < num_used
        
        # Create a new key
        new_key = CDKey(
            key=generate_test_key(),
            isUsed=is_used,
            addedAt=datetime.utcnow()
        )
        
        # If the key is used, set the usedAt and orderId
        if is_used:
            new_key.usedAt = datetime.utcnow()
            new_key.orderId = None  # Normally would be an order ID
        
        # Add the key to the product
        selected_product.cdKeys.append(new_key)
    
    # Set manages_cd_keys to true
    selected_product.manages_cd_keys = True
    
    # Save the product
    await selected_product.save()
    print(f"Successfully added {num_keys} keys to product {product_name}")
    print(f"- {num_keys - num_used} available keys")
    print(f"- {num_used} used keys")
    print(f"manages_cd_keys flag set to true")

if __name__ == "__main__":
    asyncio.run(add_test_keys_to_product())
