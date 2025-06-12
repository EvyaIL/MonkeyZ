from datetime import datetime, timedelta
from typing import List, Dict, Any
import time
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from src.controller.key_controller import KeyController
from src.models.key.key import Key, KeyStatus # Modified import

class KeyMetricsController:
    """Controller for key metrics operations."""
    
    def __init__(self, product_collection, keys_collection): # Changed products_collection to product_collection
        self.product_collection = product_collection # Changed products_collection to product_collection
        self.keys_collection = keys_collection
        self._metrics_cache = {}
        self._cache_time = None
        self._cache_ttl = 300  # 5 minutes cache TTL
        
    async def _should_use_cache(self) -> bool:
        """Check if we should use cached metrics."""
        if not self._cache_time or not self._metrics_cache:
            return False
        age = (datetime.now() - self._cache_time).total_seconds()
        return age < self._cache_ttl
        
    def _update_cache(self, metrics: Dict[str, Any]) -> None:
        """Update the metrics cache."""
        self._metrics_cache = metrics
        self._cache_time = datetime.now()
        
    async def get_key_metrics(self):
        """
        Get metrics about key usage and availability.
        
        Returns:
            dict: Key metrics including total, available, used keys, and product-specific metrics
        """
        # Check cache first
        if await self._should_use_cache():
            return self._metrics_cache
        
        # Initialize metrics
        total_keys = 0
        available_keys = 0
        used_keys = 0
        expired_keys = 0
        low_stock_products = 0
        key_usage_by_product = []
        
        try:
            # Get all products with key management settings in a single query
            products = await self.product_collection.get_all_products() # Changed products_collection to product_collection
            
            # Debug - show number of products found
            print(f"Found {len(products)} products")
            
            # Initialize a user collection for the key controller
            from src.mongodb.users_collection import UserCollection
            user_collection = UserCollection()
            await user_collection.initialize()
            
            # Create KeyController instance for optimized key fetching
            key_controller = KeyController(self.product_collection, self.keys_collection, user_collection) # Changed products_collection to product_collection
            await key_controller.initialize()

            # Initialize metrics tracking
            keys_by_product = defaultdict(list)
            product_processing_count = 0
            
            try:
                # Get all keys using batch processing
                batch_count = 0
                async for key in Key.find_all(): # Modified line
                    try:
                        # Handle all possible attribute names for product_id
                        product_id = None
                        if hasattr(key, 'product'):
                            product_id = str(key.product)
                        elif hasattr(key, 'productId'):
                            product_id = str(key.productId)
                        elif hasattr(key, 'product_id'):
                            product_id = str(key.product_id)

                        # Try dictionary access for flexibility
                        if not product_id and hasattr(key, 'get'):
                            product_id = str(key.get('product_id') or key.get('productId') or key.get('product') or '')

                        if not product_id:
                            print(f"Warning: Key without product_id found.")
                            continue

                        keys_by_product[product_id].append(key)
                        product_processing_count += 1
                    except Exception as e:
                        print(f"Error processing key: {e}")
                        continue
            finally:
                pass
                # Always clean up controller resources
                # await key_controller.disconnect() # Removed this line
            
            # Process products with their pre-grouped keys
            for product in products:
                # Handle Product object or dict
                product_id = None
                if hasattr(product, "id") and product.id:
                    product_id = str(product.id)
                elif hasattr(product, "_id") and product._id: # Beanie uses _id for the document ID
                    product_id = str(product._id)
                # else:
                    # Fallback if direct attribute access fails, though less likely with Beanie docs
                    # product_id = str(await product.get("_id") or await product.get("id"))

                # Get product name
                product_name = "Unknown Product"
                if hasattr(product, "name"):
                    if isinstance(product.name, dict):
                        name_dict = product.name
                        product_name = name_dict.get("en") or next(iter(name_dict.values()), "Unknown Product")
                    elif product.name: # Check if product.name is not None or empty
                        product_name = str(product.name)
                # else:
                    # Fallback for name if direct attribute access fails
                    # name_value = await product.get("name", "Unknown Product")
                    # if isinstance(name_value, dict):
                    #     product_name = name_value.get("en") or next(iter(name_value.values()), "Unknown Product")
                    # else:
                    #     product_name = str(name_value)
                
                print(f"Processing product: {product_id} - {product_name}")
                
                # Get pre-grouped keys for this product
                product_keys = keys_by_product.get(product_id, [])
                
                # Also get cdKeys directly from the product if they exist
                cd_keys = []
                
                # Check if product has cdKeys attribute (handle both object and dict)
                if hasattr(product, "cdKeys"):
                    cd_keys = product.cdKeys or []
                elif isinstance(product, dict) and "cdKeys" in product:
                    cd_keys = product["cdKeys"] or []
                
                if cd_keys:
                    print(f"Found {len(cd_keys)} cdKeys directly in product {product_id}")
                    
                    # Add these cdKeys to the product_keys for counting
                    for cd_key in cd_keys:
                        # First check if it is a Pydantic model or dict
                        if hasattr(cd_key, "dict"):
                            # It is likely a Pydantic model
                            try:
                                is_used = cd_key.isUsed
                            except:
                                is_used = False
                        else:
                            # Treat as a dict
                            is_used = cd_key.get("isUsed", False) if isinstance(cd_key, dict) else False
                        
                        # Convert to a key-like object with properties we check elsewhere
                        key_obj = type("CDKeyWrapper", (), {
                            "status": "used" if is_used else "available",
                            "isUsed": is_used,
                        })
                        product_keys.append(key_obj)
                
                # Count different key states
                product_total_keys = len(product_keys)
                
                # Log the keys for debugging
                print(f"Product {product_id} ({product_name}) has {product_total_keys} keys")
                
                # Count available and used keys for this product
                product_available_keys = 0
                product_used_keys = 0
                product_expired_keys = 0
                
                for key in product_keys:
                    if hasattr(key, "status"):
                        status = str(getattr(key, "status", "")).lower()
                        if status == "available" or status == str(KeyStatus.AVAILABLE).lower():
                            product_available_keys += 1
                        elif status == "used" or status == str(KeyStatus.USED).lower():
                            product_used_keys += 1
                        elif status == "expired" or status == str(KeyStatus.EXPIRED).lower():
                            product_expired_keys += 1
                    elif hasattr(key, "isUsed"):
                        if getattr(key, "isUsed"):
                            product_used_keys += 1
                        else:
                            product_available_keys += 1
                
                # Update overall counts
                total_keys += product_total_keys
                available_keys += product_available_keys
                used_keys += product_used_keys
                expired_keys += product_expired_keys
                
                # Check if product is low on stock
                min_stock_threshold = getattr(product, "minStockAlert", 10)
                if isinstance(product, dict):
                    min_stock_threshold = product.get("minStockAlert", 10)
                    
                if product_available_keys <= min_stock_threshold:
                    low_stock_products += 1
                
                # Add product-specific metrics
                key_usage_by_product.append({
                    "productId": product_id,
                    "productName": product_name,
                    "totalKeys": product_total_keys,
                    "availableKeys": product_available_keys,
                    "usedKeys": product_used_keys
                })
                
        except Exception as e:
            import traceback
            print(f"Error calculating key metrics: {str(e)}")
            print(f"Stack trace: {traceback.format_exc()}")
            
            # Return default values with error info in case of error
            return {
                "totalKeys": 0,
                "availableKeys": 0,
                "usedKeys": 0,
                "expiredKeys": 0,
                "lowStockProducts": 0,
                "keyUsageByProduct": [],
                "error": str(e)
            }
        
        # Result dictionary
        result = {
            "totalKeys": total_keys,
            "availableKeys": available_keys,
            "usedKeys": used_keys,
            "expiredKeys": expired_keys,
            "lowStockProducts": low_stock_products,
            "keyUsageByProduct": key_usage_by_product
        }
        
        # Update cache
        self._update_cache(result)
        
        return result
