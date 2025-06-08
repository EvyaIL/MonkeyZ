#!/usr/bin/env python3
"""
This script tests if product tags (new, best seller, discount percentage) 
are properly set on products and will be displayed correctly on the frontend.
"""

import asyncio
from src.mongodb.products_collection import ProductsCollection
from src.models.products.products import Product
import json

async def test_product_tags():
    """Test if product tags are correctly set in the database."""
    print("Testing product tags display...")
    
    # Initialize the products collection
    products_collection = ProductsCollection()
    await products_collection.connection()
    await products_collection.initialize()
    
    # Get all products
    products = await products_collection.get_all_products()
    print(f"Found {len(products)} total products")
    
    # Check tag statistics
    new_products = [p for p in products if p.is_new or p.isNew]
    best_sellers = [p for p in products if p.best_seller or p.isBestSeller]
    discounted = [p for p in products if p.discount_percentage > 0 or p.discountPercentage > 0]
    homepage_products = [p for p in products if p.display_on_homepage or p.displayOnHomepage]
    
    print(f"Products with 'New' tag: {len(new_products)}")
    print(f"Products with 'Best Seller' tag: {len(best_sellers)}")
    print(f"Products with discount: {len(discounted)}")
    print(f"Products marked for homepage: {len(homepage_products)}")
    
    # Test get_homepage_products method
    homepage_products_method = await products_collection.get_homepage_products()
    print(f"Homepage products from method: {len(homepage_products_method)}")
    
    # Test get_best_sellers method
    best_sellers_method = await products_collection.get_best_sellers()
    print(f"Best sellers from method: {len(best_sellers_method)}")
    
    # Test product "H" to ensure it works
    product_h = await products_collection.get_product_by_name("H")
    if product_h:
        print(f"Product 'H' found with ID: {product_h.id}")
        print(f"Tags for Product 'H':")
        print(f"  - New: {product_h.is_new or product_h.isNew}")
        print(f"  - Best Seller: {product_h.best_seller or product_h.isBestSeller}")
        print(f"  - Discount: {product_h.discount_percentage or product_h.discountPercentage}%")
        print(f"  - Homepage: {product_h.display_on_homepage or product_h.displayOnHomepage}")
    else:
        print("Product 'H' not found")
    
    # Close the connection
    await products_collection.disconnect()
    print("Product tag testing complete.")

if __name__ == "__main__":
    asyncio.run(test_product_tags())
