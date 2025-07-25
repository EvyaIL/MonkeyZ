from src.models.products.products import Product
from src.mongodb.product_collection import ProductCollection as AdminProductCollection
from src.mongodb.products_collection import ProductsCollection
from src.mongodb.keys_collection import KeysCollection
from src.mongodb.users_collection import UserCollection
import datetime
import re

class ProductsController:
    """Controller for managing products, including creation, editing, and deletion."""
    
    def __init__(self, product_collection: ProductsCollection, keys_collection: KeysCollection, 
                 user_collection: UserCollection, admin_product_collection: AdminProductCollection):
        """Initialize the controller with required collections.
        
        Args:
            product_collection: The main products collection for frontend display
            keys_collection: Collection for managing keys/IDs
            user_collection: Collection for user management
            admin_product_collection: The admin product collection
        """
        self.product_collection = product_collection
        self.keys_collection = keys_collection
        self.user_collection = user_collection
        self.admin_product_collection = admin_product_collection
    
    async def initialize(self):
        """Initialize any required data or connections."""
        # No additional initialization needed at this time
        pass
    
    async def sync_products(self):
        """Synchronize products between admin collection and main collection."""
        try:
            print("Starting product sync between collections")
            # Get all products from admin collection
            admin_products = await self.admin_product_collection.get_all_products()
            
            for admin_product in admin_products:
                # Convert admin product to dictionary format expected by main collection
                product_dict = admin_product.model_dump()
                
                # Ensure boolean fields are properly converted
                if 'displayOnHomePage' in product_dict:
                    product_dict['displayOnHomePage'] = bool(product_dict['displayOnHomePage'])
                if 'best_seller' in product_dict:
                    product_dict['best_seller'] = bool(product_dict['best_seller'])
                
                # Ensure imageUrl is included
                product_dict['imageUrl'] = getattr(admin_product, 'imageUrl', None)

                try:
                    # Try to update the product in main collection
                    await self.product_collection.update_product_from_dict(admin_product.id, product_dict)
                except ValueError:  # Product doesn't exist in main collection
                    # Create product in main collection
                    await self.product_collection.create_product_from_dict(product_dict)
            
            print(f"Successfully synchronized {len(admin_products)} products")
            return True
        except Exception as e:
            print(f"Error synchronizing products: {e}")
            return False
    
    async def get_products(self, page: int = 1, limit: int = 10) -> list[Product]:
        """Get main products for frontend display with pagination.
        
        Args:
            page: Page number (starting from 1)
            limit: Number of products per page
            
        Returns:
            List of products for the specified page
        """
        return await self.product_collection.get_products(page, limit)
    
    async def get_all_products(self) -> list[dict[str, any]]:
        """Get all products from the main products collection (for public display). Only active products are returned."""
        # Use the main product_collection which has the sanitization logic for public-facing data.
        products = await self.product_collection.get_all_products()
        # The get_all_products in products_collection already filters for active=True
        return products
    
    async def create_product(self, product: Product) -> Product:
        """Create a new product in main collection.
        
        Args:
            product: Product to create
            
        Returns:
            Created product
        """
        return await self.product_collection.create_product(product)
    
    async def create_admin_product(self, product: Product) -> Product:
        """Create a product in admin collection and sync to main collection.
        
        Args:
            product: Admin product to create
            
        Returns:
            Created admin product
        """
        # First create in admin collection
        created_admin_product = await self.admin_product_collection.create_product(product)
        
        # Convert to dictionary format for main collection
        product_dict = created_admin_product.model_dump()
        # Ensure imageUrl is included
        product_dict['imageUrl'] = getattr(created_admin_product, 'imageUrl', None)
        
        try:
            # Create in main products collection
            await self.product_collection.create_product_from_dict(product_dict)
            print(f"Product {product.id} created in both collections")
        except Exception as e:
            print(f"Error creating product in main collection: {e}")
            # Continue even if sync fails - at least it's in admin collection
        
        return created_admin_product
    
    async def update_product(self, product_id: str, product: Product) -> Product:
        """Update a product in main collection.
        
        Args:
            product_id: ID of product to update
            product: Updated product data
            
        Returns:
            Updated product
        """
        return await self.product_collection.update_product(product_id, product)
    
    async def update_admin_product(self, product_id: str, product: Product) -> Product:
        """Update a product in admin collection and sync to main collection.
        
        Args:
            product_id: ID of product to update
            product: Updated product data
            
        Returns:
            Updated admin product
        """
        # First update in admin collection
        updated_admin_product = await self.admin_product_collection.update_product(product_id, product)
        
        # Convert to dictionary format for main collection
        product_dict = updated_admin_product.model_dump()
        # Ensure imageUrl is included
        product_dict['imageUrl'] = getattr(updated_admin_product, 'imageUrl', None)
        
        try:
            # Update in main products collection
            await self.product_collection.update_product_from_dict(product_id, product_dict)
            print(f"Product {product_id} updated in both collections")
        except Exception as e:
            print(f"Error updating product in main collection: {e}")
            # Continue even if sync fails - at least it's updated in admin collection
        
        return updated_admin_product
    
    async def delete_product(self, product_id: str) -> bool:
        """Delete a product from main collection.
        
        Args:
            product_id: ID of product to delete
        
        Returns:
            True if deletion successful, False otherwise
        """
        return await self.product_collection.delete_product(product_id)

    async def delete_admin_product(self, product_id: str) -> bool:
        """Delete a product from admin collection and sync deletion to main collection.
        
        Args:
            product_id: ID of product to delete
        
        Returns:
            True if deletion successful, False otherwise
        """
        # First delete from admin collection
        admin_delete_success = await self.admin_product_collection.delete_product(product_id)
        if admin_delete_success:
            try:
                # Also delete from main products collection
                main_delete_success = await self.product_collection.delete_product(product_id)
                # Ensure the product is not displayed on homepage anymore by setting displayOnHomePage to False
                try:
                    product = await self.product_collection.get_product(product_id)
                    if product:
                        product.displayOnHomePage = False
                        await product.save()
                except Exception:
                    pass
                return main_delete_success
            except Exception:
                return False
        return False
    
    async def get_admin_products(self) -> list[Product]:
        """Get all products from admin collection.
        
        Returns:
            List of all admin products
        """
        return await self.admin_product_collection.get_all_products()
    
    async def get_admin_product(self, product_id: str) -> Product:
        """Get a specific product from admin collection.
        
        Args:
            product_id: ID of product to retrieve
            
        Returns:
            Admin product if found
        """
        return await self.admin_product_collection.get_product(product_id)
    
    async def get_product(self, product_id: str) -> Product:
        """Get a specific product from main collection.
        
        Args:
            product_id: ID of product to retrieve
            
        Returns:
            Product if found
        """
        return await self.product_collection.get_product(product_id)
    
    async def get_best_sellers(self, limit: int = 4) -> list[Product]:
        """Get best selling products.
        
        Args:
            limit: Maximum number of products to return
            
        Returns:
            List of best selling products
        """
        return await self.product_collection.get_best_sellers(limit)
    
    async def get_recent_products(self, limit: int = 4) -> list[Product]:
        """Get recently added products.
        
        Args:
            limit: Maximum number of products to return
        
        Returns:
            List of recently added products
        """
        return await self.product_collection.get_recent_products(limit)
    
    async def get_homepage_products(self, limit: int = 6) -> list[Product]:
        """Get products for homepage display from main shop collection. Only active and displayOnHomePage products are returned."""
        try:
            # Use the shop collection's implementation which properly filters by displayOnHomePage=True
            return await self.product_collection.get_homepage_products(limit)
        except Exception as e:
            print(f"Error getting homepage products: {e}")
            return []

