from datetime import datetime, timedelta
from typing import List, Dict, Any
import time
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from src.controller.key_controller import KeyController

class KeyMetricsController:
    """Controller for key metrics operations."""
    
    def __init__(self, admin_product_collection, keys_collection):
        self.admin_product_collection = admin_product_collection
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
            # Ensure collections are initialized
            if hasattr(self.keys_collection, 'initialize') and (not hasattr(self.keys_collection, 'is_connected') or not self.keys_collection.is_connected):
                try:
                    await self.keys_collection.initialize()
                except Exception as e:
                    print(f"Error initializing keys_collection: {e}")
                    # Return minimal metrics if initialization fails
                    return {
                        "totalKeys": 0,
                        "availableKeys": 0, 
                        "usedKeys": 0,
                        "expiredKeys": 0,
                        "lowStockProducts": 0,
                        "keyUsageByProduct": []
                    }
            
            if hasattr(self.admin_product_collection, 'initialize') and (not hasattr(self.admin_product_collection, 'is_connected') or not self.admin_product_collection.is_connected):
                try:
                    await self.admin_product_collection.initialize()
                except Exception as e:
                    print(f"Error initializing admin_product_collection: {e}")
                    # Return minimal metrics if initialization fails
                    return {
                        "totalKeys": 0,
                        "availableKeys": 0, 
                        "usedKeys": 0,
                        "expiredKeys": 0,
                        "lowStockProducts": 0,
                        "keyUsageByProduct": []
                    }
            
            # Get all products with key management settings in a single query
            products = await self.admin_product_collection.get_all_products()
              # Create KeyController instance for optimized key fetching
            key_controller = KeyController(self.admin_product_collection, self.keys_collection, None)
            await key_controller.initialize()

            # Initialize metrics tracking
            keys_by_product = defaultdict(list)
            product_processing_count = 0
            last_log_time = time.time()
            batch_size = 1000

            try:                # Get all keys using the optimized batch processing
                batch_count = 0
                async for key in self.keys_collection.get_all_keys(batch_size):
                    try:
                        # Handle both possible attribute names
                        product_id = None
                        if hasattr(key, 'product'):
                            product_id = str(key.product)
                        elif hasattr(key, 'productId'):
                            product_id = str(key.productId)

                        if not product_id:
                            continue

                        keys_by_product[product_id].append(key)
                        
                        # Log progress for long-running operations
                        product_processing_count += 1
                        batch_count += 1
                        
                        if batch_count >= batch_size:
                            current_time = time.time()
                            if current_time - last_log_time >= 5:  # Log every 5 seconds
                                print(f"Processed {product_processing_count} keys...")
                                last_log_time = current_time
                            batch_count = 0
                            
                    except Exception as e:
                        print(f"Error processing key: {e}")
                        continue

            finally:
                # Always clean up controller resources
                await key_controller.disconnect()# Process products with their pre-grouped keys
            for product in products:
                product_id = str(product.get('_id') or product.get('id'))
                product_name = product.get('name', 'Unknown Product')
                
                # Get pre-grouped keys for this product
                product_keys = keys_by_product.get(product_id, [])
                
                # Count different key states
                product_total_keys = len(product_keys)
                product_available_keys = sum(1 for key in product_keys if key.get('status') == 'available')
                product_used_keys = sum(1 for key in product_keys if key.get('status') == 'used')
                product_expired_keys = sum(1 for key in product_keys if key.get('status') == 'expired')
                
                # Update overall counts
                total_keys += product_total_keys
                available_keys += product_available_keys
                used_keys += product_used_keys
                expired_keys += product_expired_keys
                
                # Check if product is low on stock
                min_stock_threshold = product.get('minStockAlert', 10)
                if product_available_keys <= min_stock_threshold:
                    low_stock_products += 1
                
                # Add product-specific metrics
                key_usage_by_product.append({
                    'productId': product_id,
                    'productName': product_name,
                    'totalKeys': product_total_keys,
                    'availableKeys': product_available_keys,
                    'usedKeys': product_used_keys
                })
        
        except Exception as e:
            print(f"Error calculating key metrics: {str(e)}")
            # Return default values in case of error
            return {
                'totalKeys': 0,
                'availableKeys': 0,
                'usedKeys': 0,
                'expiredKeys': 0,
                'lowStockProducts': 0,
                'keyUsageByProduct': []
            }            # Calculate average usage time more efficiently using the already processed keys
        average_key_usage_time = None
        try:
            usage_times = []
            # Use already processed keys from keys_by_product
            for product_keys in keys_by_product.values():
                for key in product_keys:
                    if key.get('status') == 'used' and key.get('issuedAt') and key.get('usedAt'):
                        issued_at = key.get('issuedAt')
                        used_at = key.get('usedAt')
                        if issued_at and used_at:
                            # Calculate time difference in hours
                            time_diff = (used_at - issued_at).total_seconds() / 3600
                            usage_times.append(time_diff)
                
                if usage_times:
                    average_key_usage_time = sum(usage_times) / len(usage_times)
        except Exception as e:
            print(f"Error calculating average key usage time: {str(e)}")
        
        # Update cache with the new metrics
        self._update_cache({
            'totalKeys': total_keys,
            'availableKeys': available_keys,
            'usedKeys': used_keys,
            'expiredKeys': expired_keys,
            'lowStockProducts': low_stock_products,
            'averageKeyUsageTime': average_key_usage_time,
            'keyUsageByProduct': key_usage_by_product
        })
        
        return {
            'totalKeys': total_keys,
            'availableKeys': available_keys,
            'usedKeys': used_keys,
            'expiredKeys': expired_keys,
            'lowStockProducts': low_stock_products,
            'averageKeyUsageTime': average_key_usage_time,
            'keyUsageByProduct': key_usage_by_product
        }
