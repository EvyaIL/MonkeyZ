from datetime import datetime, timedelta
from typing import List, Dict, Any

class KeyMetricsController:
    """Controller for key metrics operations."""
    
    def __init__(self, admin_product_collection, keys_collection):
        self.admin_product_collection = admin_product_collection
        self.keys_collection = keys_collection
        
    async def get_key_metrics(self):
        """
        Get metrics about key usage and availability.
        
        Returns:
            dict: Key metrics including total, available, used keys, and product-specific metrics
        """
        # Initialize metrics
        total_keys = 0
        available_keys = 0
        used_keys = 0
        expired_keys = 0
        low_stock_products = 0
        key_usage_by_product = []
        
        try:
            # Get all products
            products = await self.admin_product_collection.get_all_products()
            
            # For each product, fetch and analyze its keys
            for product in products:
                product_id = str(product.get('_id') or product.get('id'))
                product_name = product.get('name', 'Unknown Product')
                
                # Get keys for this product
                product_keys = await self.keys_collection.get_keys_by_product_id(product_id)
                
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
            }
            
        # Calculate average usage time if possible
        average_key_usage_time = None
        try:
            used_keys_with_timestamps = []
            for product in products:
                product_id = str(product.get('_id') or product.get('id'))
                product_keys = await self.keys_collection.get_keys_by_product_id(product_id)
                used_keys_with_timestamps.extend([
                    key for key in product_keys 
                    if key.get('status') == 'used' and key.get('issuedAt') and key.get('usedAt')
                ])
            
            if used_keys_with_timestamps:
                usage_times = []
                for key in used_keys_with_timestamps:
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
        
        return {
            'totalKeys': total_keys,
            'availableKeys': available_keys,
            'usedKeys': used_keys,
            'expiredKeys': expired_keys,
            'lowStockProducts': low_stock_products,
            'averageKeyUsageTime': average_key_usage_time,
            'keyUsageByProduct': key_usage_by_product
        }
