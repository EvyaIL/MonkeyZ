import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection details
MONGODB_URI = "mongodb+srv://doadmin:MOpg1x782Wj94t56@mongodb1-92cc6b02.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=mongodb1"
DB_NAME = "shop"

async def list_products():
    """List all products in the database"""
    try:
        print("Connecting to MongoDB...")
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client[DB_NAME]
        
        print("Fetching products...")
        products = await db["products"].find({}).to_list(length=1000)
        
        print(f"\nFound {len(products)} products in database:")
        
        # Group products by type (fake vs legitimate)
        fake_products = []
        legitimate_products = []
        
        # Legitimate product names (gibberish names)
        legitimate_names = ["NNNa", "UTa", "knkkmk", "TestNUmb4", "tadddd1", "Homtest"]
        
        for product in products:
            name = product.get('name')
            
            # Handle different name formats
            if isinstance(name, dict):
                display_name = name.get('en') or name.get('he') or str(name)
            else:
                display_name = name
            
            # Categorize products
            if isinstance(display_name, str):
                if display_name.startswith("MonkeyZ"):
                    fake_products.append(product)
                elif display_name in legitimate_names:
                    legitimate_products.append(product)
                else:
                    # Other products, consider them legitimate for now
                    legitimate_products.append(product)
            else:
                # If name isn't a string, categorize as legitimate
                legitimate_products.append(product)
        
        # Display fake products
        print(f"\nFake MonkeyZ Products ({len(fake_products)}):")
        if fake_products:
            for p in fake_products:
                name = p.get('name')
                if isinstance(name, dict):
                    name = name.get('en') or name.get('he') or str(name)
                print(f"- {name}")
        else:
            print("None")
        
        # Display legitimate products
        print(f"\nLegitimate Products ({len(legitimate_products)}):")
        if legitimate_products:
            for p in legitimate_products:
                name = p.get('name')
                if isinstance(name, dict):
                    name = name.get('en') or name.get('he') or str(name)
                is_gibberish = (isinstance(name, str) and name in legitimate_names)
                print(f"- {name}{' (Gibberish)' if is_gibberish else ''}")
        else:
            print("None")
        
        client.close()
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("Starting product listing script...")
    asyncio.run(list_products())
    print("\nScript complete!")
