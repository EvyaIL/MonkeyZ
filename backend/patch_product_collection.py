# Field names patch for ProductsCollection class
import asyncio
from beanie import PydanticObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import datetime
import traceback
import certifi

# Load environment variables
load_dotenv()

# Add this patch to handle inconsistent field naming
async def patch_product_collection():
    """
    Patches the product collections to handle both naming conventions:
    - snake_case: is_new, best_seller, display_on_homepage
    - camelCase: isNew, isBestSeller, displayOnHomepage
    
    This allows the API to work with products using either naming convention.
    """
    try:
        # Get MongoDB URI from environment
        mongodb_uri = os.getenv("MONGODB_URI")
        if not mongodb_uri:
            print("MONGODB_URI not found in environment variables")
            return False
            
        print(f"Using MongoDB URI: {mongodb_uri}")
        
        # Connect to MongoDB
        client = AsyncIOMotorClient(
            mongodb_uri,
            tlsCAFile=certifi.where()
        )
        
        print("Connected to MongoDB")
        
        # Patch source code of products_collection.py
        src_file_path = "src/mongodb/products_collection.py"
        if not os.path.exists(src_file_path):
            print(f"Source file not found: {src_file_path}")
            return False
        
        # Read current file
        with open(src_file_path, "r") as file:
            content = file.read()
        
        # Check if already patched
        if "# --- Field naming patch applied ---" in content:
            print("Product collection already patched.")
            return True
        
        # Apply patch: Update get_best_sellers method
        old_best_sellers_code = """async def get_best_sellers(self) -> list[Product]:
        \"\"\"
        Retrieves all the best sellers products from the database.

        Returns:
            list[Product]: A list of all best sellers products in the database.
        \"\"\"
        try:
            return await Product.find_many(Product.best_seller == True, Product.active == True).to_list()
        except Exception as e:
            print(f"Error in get_best_sellers: {str(e)}")
            return []"""
        
        new_best_sellers_code = """async def get_best_sellers(self) -> list[Product]:
        \"\"\"
        Retrieves all the best sellers products from the database.
        Handles both best_seller and isBestSeller field names.

        Returns:
            list[Product]: A list of all best sellers products in the database.
        \"\"\"
        try:
            # Try with snake_case field name
            best_sellers = await Product.find_many(Product.best_seller == True, Product.active == True).to_list()
            
            # If empty, try with camelCase field name
            if not best_sellers:
                best_sellers = await Product.find_many(Product.isBestSeller == True, Product.active == True).to_list()
                
            return best_sellers
        except Exception as e:
            print(f"Error in get_best_sellers: {str(e)}")
            # Fall back to active products if error occurs
            try:
                return await Product.find_many(Product.active == True).limit(8).to_list()
            except Exception as e2:
                print(f"Error in get_best_sellers fallback: {str(e2)}")
                return []"""
        
        # Apply patch: Update get_homepage_products method
        old_homepage_code = """async def get_homepage_products(self, limit: int) -> list[Product]:
        \"\"\"
        Retrieves products marked for display on the homepage.

        Args:
            limit (int): The maximum number of products to retrieve.

        Returns:
            list[Product]: A list of products marked for display on the homepage.
        \"\"\"
        try:
            return await Product.find_many(Product.display_on_homepage == True, Product.active == True).limit(limit).to_list()
        except Exception as e:
            print(f"Error in get_homepage_products: {str(e)}")
            # If there's an error with display_on_homepage field, fall back to active products
            return await Product.find_many(Product.active == True).limit(limit).to_list()"""
        
        new_homepage_code = """async def get_homepage_products(self, limit: int) -> list[Product]:
        \"\"\"
        Retrieves products marked for display on the homepage.
        Handles both display_on_homepage and displayOnHomepage field names.

        Args:
            limit (int): The maximum number of products to retrieve.

        Returns:
            list[Product]: A list of products marked for display on the homepage.
        \"\"\"
        try:
            # Try with snake_case field name
            homepage_products = await Product.find_many(Product.display_on_homepage == True, Product.active == True).limit(limit).to_list()
            
            # If empty, try with camelCase field name
            if not homepage_products:
                homepage_products = await Product.find_many(Product.displayOnHomepage == True, Product.active == True).limit(limit).to_list()
                
            return homepage_products
        except Exception as e:
            print(f"Error in get_homepage_products: {str(e)}")
            # Fall back to active products if error occurs
            try:
                return await Product.find_many(Product.active == True).limit(limit).to_list()
            except Exception as e2:
                print(f"Error in get_homepage_products fallback: {str(e2)}")
                return []"""
        
        # Apply patches
        content = content.replace(old_best_sellers_code, new_best_sellers_code)
        content = content.replace(old_homepage_code, new_homepage_code)
        
        # Add marker comment
        content += "\n\n# --- Field naming patch applied ---\n"
        
        # Save patched file
        with open(src_file_path, "w") as file:
            file.write(content)
        
        print(f"Successfully patched {src_file_path} to handle field naming inconsistencies")
        return True
        
    except Exception as e:
        print(f"Error patching product collection: {str(e)}")
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    print("Applying product collection field naming patch...")
    asyncio.run(patch_product_collection())
