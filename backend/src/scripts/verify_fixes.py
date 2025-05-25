"""
This script verifies the fixes for key creation and order management
"""
import asyncio
import logging
from beanie import init_beanie, PydanticObjectId
import motor.motor_asyncio
from datetime import datetime
import os
import sys

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

# Import models
from src.models.products.products import Product
from src.models.key.key import Key, KeyRequest

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

async def test_key_creation():
    """Test creating a key and ensuring it's associated with a product"""
    # Connect to MongoDB
    logger.info("Connecting to MongoDB...")
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.shop
    
    # Initialize ODM models
    logger.info("Initializing ODM models...")
    await init_beanie(database=db, document_models=[Product, Key])
    
    # Get a product to test with
    logger.info("Finding a product to test with...")
    product = await Product.find_one()
    if not product:
        logger.error("No products found in database.")
        return
    
    logger.info(f"Using product: {product.name} (ID: {product.id})")
    
    # Create a test key
    test_key_value = f"TEST-{datetime.now().strftime('%H%M%S')}-XXXXX-XXXXX-XXXXX"
    logger.info(f"Creating test key: {test_key_value}")
    
    key = Key(
        product=product.id,
        is_active=True,
        key=test_key_value
    )
    await key.save()
    logger.info(f"Test key created with ID: {key.id}")
    
    # Manually associate key with product
    logger.info(f"Adding key {key.id} to product {product.id}")
    if not product.keys:
        product.keys = {}
    product.keys[str(key.id)] = key.id
    await product.save()
    
    # Verify key was added to product
    updated_product = await Product.get(product.id)
    logger.info(f"Product keys after update: {updated_product.keys}")
    
    # Check if test key is in product's keys
    found = str(key.id) in updated_product.keys
    logger.info(f"Key found in product: {found}")
    
    return found

async def test_order_structure():
    """Test the structure of orders in the database"""
    # Connect to MongoDB
    logger.info("Connecting to MongoDB...")
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.shop
    
    # Check orders collection
    logger.info("Examining orders collection...")
    orders = await db.orders.find().to_list(length=5)
    
    if not orders:
        logger.info("No orders found in database.")
        return False
    
    logger.info(f"Found {len(orders)} orders")
    
    # Check the first order structure
    sample_order = orders[0]
    logger.info(f"Sample order structure: {sample_order}")
    
    # Check required fields
    required_fields = ['customerName', 'email', 'status', 'total', 'items']
    missing_fields = [field for field in required_fields if field not in sample_order]
    
    if missing_fields:
        logger.error(f"Order is missing required fields: {missing_fields}")
        return False
        
    logger.info("Order structure looks correct")
    return True

async def main():
    """Main test function"""
    logger.info("Starting fix verification script...")
    
    # Test key creation and association
    key_test_result = await test_key_creation()
    logger.info(f"Key creation test {'PASSED' if key_test_result else 'FAILED'}")
    
    # Test order structure
    order_test_result = await test_order_structure()
    logger.info(f"Order structure test {'PASSED' if order_test_result else 'FAILED'}")
    
    logger.info("Verification script completed.")

if __name__ == "__main__":
    asyncio.run(main())
