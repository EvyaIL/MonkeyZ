"""
This debug script is used to test key creation and product association
"""

from beanie import init_beanie, PydanticObjectId
import motor.motor_asyncio
import asyncio
from src.models.products.products import Product
from src.models.key.key import Key

async def main():
    """Test key creation and product association"""
    # Connect to MongoDB
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.shop
    
    # Initialize ODM models
    await init_beanie(database=db, document_models=[Product, Key])
    
    # Get some products
    products = await Product.find_all().to_list()
    if not products:
        print("No products found")
        return
    
    # Take the first product as a test case
    product = products[0]
    print(f"Testing with product: {product.name} (ID: {product.id})")
    
    # Check existing keys
    print(f"Current keys: {len(product.keys or {})}")
    
    # Create a test key
    test_key = Key(
        product=product.id,
        is_active=True,
        key="TEST01-TEST02-TEST03-TEST04-TEST05"
    )
    await test_key.save()
    print(f"Created test key with ID: {test_key.id}")
    
    # Add key to product
    if product.keys is None:
        product.keys = {}
    product.keys[test_key.id] = test_key.id
    await product.save()
    print("Added key to product")
    
    # Verify key was added
    updated_product = await Product.get(product.id)
    print(f"Updated keys: {len(updated_product.keys or {})}")
    
    # Check if the test key is in the product's keys
    found = test_key.id in (updated_product.keys or {})
    print(f"Key found in product: {found}")

if __name__ == "__main__":
    asyncio.run(main())
