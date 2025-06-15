from datetime import datetime, timedelta
from typing import List, Dict, Any
import time
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from .key_controller import KeyController
from beanie.odm.fields import PydanticObjectId # Ensure this is imported
import logging # Make sure logging is imported

logger = logging.getLogger(__name__) # Add this if not already present at the top

class KeyMetricsController:
    """Controller for key metrics operations."""
    
    def __init__(self, admin_product_collection, keys_collection): # keys_collection might be None now
        self.admin_product_collection = admin_product_collection
        self.keys_collection = keys_collection # Keep for now, might be None or used by KeyController if it's still needed
        self._metrics_cache = {}
        self._cache_time = None
        self._cache_ttl = 300  # 5 minutes cache TTL

    async def _should_use_cache(self) -> bool: # Temporarily disabled in get_key_metrics
        """Check if we should use cached metrics."""
        if not self._cache_time or not self._metrics_cache:
            return False
        age = (datetime.now() - self._cache_time).total_seconds()
        return age < self._cache_ttl

    def _update_cache(self, metrics: Dict[str, Any]) -> None: # Temporarily disabled in get_key_metrics
        """Update the metrics cache."""
        self._metrics_cache = metrics
        self._cache_time = datetime.now()

    async def get_key_metrics(self, current_user: dict) -> dict:
        """
        Get metrics about key usage and availability, sourcing keys from product.cdKeys.
        """
        # if await self._should_use_cache(): # Temporarily disable cache check
        #     print("KeyMetricsController: Returning CACHED metrics.") 
        #     return self._metrics_cache
        # logger.info("KeyMetricsController: Cache check SKIPPED. Calculating fresh metrics from product.cdKeys.")
        # Temporarily disable cache for debugging if it exists, or ensure it's not causing stale data
        # For example, if self.cache is a simple dict:
        # if "key_metrics" in self.cache:
        #     del self.cache["key_metrics"]
        # logger.info("KeyMetricsController: Cache check SKIPPED. Calculating fresh metrics from product.cdKeys.")
        # Or if it's a more complex cache, ensure you have a way to bypass/invalidate for this call.
        # For now, assuming direct fetching as per previous logs.

        products_for_metrics = await self.admin_product_collection.get_all_products()
        
        # Enhanced logging for fetched products
        product_details_for_log = []
        if products_for_metrics:
            for p_idx, p in enumerate(products_for_metrics):
                product_details_for_log.append({
                    "index": p_idx,
                    "id": str(p.id) if p.id else "N/A",
                    "name": p.name.get('en', 'N/A') if isinstance(p.name, dict) else str(p.name),
                    "manages_cd_keys": p.manages_cd_keys,
                    "cdKeys_count": len(p.cdKeys) if p.cdKeys else 0,
                    "imageUrl": p.imageUrl if hasattr(p, 'imageUrl') else 'N/A'
                })
        logger.info(f"KeyMetricsController: Fetched {len(products_for_metrics)} products. Details: {product_details_for_log}")

        total_keys = 0
        available_keys = 0
        used_keys = 0
        expired_keys = 0  # Assuming 0 for now, as 'expired' status is not clear from embedded structure
        low_stock_products = 0
        key_usage_by_product = []
        
        usage_times = [] # For average calculation

        try:
            # KeyController initialization might still be needed if other parts of it are used,
            # but it won't be used for fetching all keys here.
            key_controller = None 
            try:
                logger.info("KeyMetricsController: Attempting to initialize KeyController (though not for fetching all keys)...")
                if self.keys_collection: # Check if keys_collection is provided
                    key_controller = KeyController(
                        self.admin_product_collection, 
                        self.keys_collection, 
                        self.keys_collection # Assuming KeyController expects a db_client like object here
                    )
                    await key_controller.initialize()
                    logger.info("KeyMetricsController: KeyController initialized successfully.")
                else:
                    logger.info("KeyMetricsController: self.keys_collection is None. Skipping KeyController initialization.")
            except Exception as e_kc_init:
                import traceback
                logger.warning(f"KeyMetricsController: WARNING during KeyController instantiation or initialization: {e_kc_init}")
                traceback.print_exc()
                key_controller = None

            for i, product in enumerate(products_for_metrics):
                product_id_str = str(product.id)
                product_name_str = product.name.get('en', 'Unknown Product') if isinstance(product.name, dict) else str(product.name)
                
                logger.info(f"KeyMetricsController: Processing product #{i}: ID={product_id_str}, Name='{product_name_str}', ManagesCDKeys={product.manages_cd_keys}")
                product_total_keys_count = 0
                product_available_keys_count = 0
                product_used_keys_count = 0
                # product_expired_keys_count = 0 # Assuming 0 for now

                manages_cd_keys = getattr(product, 'manages_cd_keys', False)
                
                if i < 5 or i % 50 == 0: # Log some products
                    logger.info(f"KeyMetricsController: Processing product #{i}: ID={product_id_str}, Name='{product_name_str}', ManagesCDKeys={manages_cd_keys}")

                if manages_cd_keys and product.cdKeys:
                    embedded_keys = getattr(product, 'cdKeys', [])
                    if isinstance(embedded_keys, list):
                        product_total_keys_count = len(embedded_keys)
                        for emb_key_idx, key_obj in enumerate(embedded_keys):
                            # Check if key_obj is an instance of a class we expect (e.g., CDKey model)
                            # For now, we'll rely on hasattr checks for robustness.
                            
                            # Use attribute access instead of .get()
                            is_used = getattr(key_obj, 'isUsed', False) 
                            key_str_val = getattr(key_obj, 'key', 'N/A') # For logging
                            
                            if is_used:
                                product_used_keys_count += 1
                            else:
                                product_available_keys_count += 1
                            
                            if is_used:
                                added_at_val = getattr(key_obj, 'addedAt', None)
                                used_at_val = getattr(key_obj, 'usedAt', None)

                                if added_at_val and used_at_val:
                                    try:
                                        if isinstance(added_at_val, str):
                                            if added_at_val.endswith('Z'): added_at_val = added_at_val[:-1] + '+00:00'
                                            added_at_dt = datetime.fromisoformat(added_at_val)
                                        elif isinstance(added_at_val, datetime):
                                            added_at_dt = added_at_val
                                        else: added_at_dt = None

                                        if isinstance(used_at_val, str):
                                            if used_at_val.endswith('Z'): used_at_val = used_at_val[:-1] + '+00:00'
                                            used_at_dt = datetime.fromisoformat(used_at_val)
                                        elif isinstance(used_at_val, datetime):
                                            used_at_dt = used_at_val
                                        else: used_at_dt = None
                                            
                                        if added_at_dt and used_at_dt:
                                            time_diff_seconds = (used_at_dt - added_at_dt).total_seconds()
                                            if time_diff_seconds >= 0: 
                                                usage_times.append(time_diff_seconds / 3600) 
                                            else:
                                                if emb_key_idx < 3 and (i < 5 or i % 50 == 0):
                                                    logger.warning(f"KeyMetricsController: Product {product_id_str} - Key {key_str_val} has usedAt ({used_at_val}) before addedAt ({added_at_val}). Skipping for avg time.")
                                    except Exception as e_date:
                                        if emb_key_idx < 3 and (i < 5 or i % 50 == 0):
                                            logger.warning(f"KeyMetricsController: Product {product_id_str} - Error parsing dates for key {key_str_val}: {e_date}")
                        
                        if (i < 5 or i % 50 == 0) and product_total_keys_count > 0:
                             logger.info(f"KeyMetricsController: Product {product_id_str} - Embedded keys counts: Total={product_total_keys_count}, Available={product_available_keys_count}, Used={product_used_keys_count}")

                    else:
                        if i < 5 or i % 50 == 0:
                            logger.warning(f"KeyMetricsController: Product {product_id_str} - 'cdKeys' attribute is not a list (type: {type(embedded_keys)}).")
                else: 
                    logger.info(f"KeyMetricsController: Product {product_id_str} - 'manages_cd_keys' is {product.manages_cd_keys} or cdKeys list is empty/None. Embedded keys processed: 0")

                total_keys += product_total_keys_count
                available_keys += product_available_keys_count
                used_keys += product_used_keys_count

                min_stock_threshold_val = getattr(product, 'minStockAlert', 10)
                min_stock_threshold = min_stock_threshold_val if min_stock_threshold_val is not None else 10
                if manages_cd_keys and product_available_keys_count <= min_stock_threshold:
                    low_stock_products += 1
                
                key_usage_by_product.append({
                    'productId': product_id_str,
                    'productName': product_name_str,
                    'totalKeys': product_total_keys_count,
                    'availableKeys': product_available_keys_count,
                    'usedKeys': product_used_keys_count
                })
        
        except Exception as e:
            import traceback
            logger.error(f"Error calculating key metrics from product.cdKeys (Type: {type(e)}): {str(e)}")
            logger.error("Full traceback for key metrics calculation error:")
            traceback.print_exc()
            return {
                'totalKeys': 0, 'availableKeys': 0, 'usedKeys': 0, 'expiredKeys': 0,
                'lowStockProducts': 0, 'averageKeyUsageTime': None, 'keyUsageByProduct': []
            }
            
        average_key_usage_time_val = None
        if usage_times:
            average_key_usage_time_val = sum(usage_times) / len(usage_times)
        
        # self._update_cache({ # Temporarily disable cache update
        #     'totalKeys': total_keys,
        #     'availableKeys': available_keys,
        #     'usedKeys': used_keys,
        #     'expiredKeys': expired_keys,
        #     'lowStockProducts': low_stock_products,
        #     'averageKeyUsageTime': average_key_usage_time_val,
        #     'keyUsageByProduct': key_usage_by_product
        # })
        # print("KeyMetricsController: Cache update SKIPPED.")

        final_metrics_to_return = {
            'totalKeys': total_keys,
            'availableKeys': available_keys,
            'usedKeys': used_keys,
            'expiredKeys': expired_keys, 
            'lowStockProducts': low_stock_products,
            'averageKeyUsageTime': average_key_usage_time_val,
            'keyUsageByProduct': key_usage_by_product        }
        logger.info(f"KeyMetricsController: FINAL metrics from product.cdKeys being returned: {final_metrics_to_return}")
        return final_metrics_to_return

    async def get_key_metrics_diagnostic(self, current_user: dict) -> dict:
        """
        Get metrics about key usage and availability, sourcing keys from product.cdKeys.
        """
        products_for_metrics = []
        try:
            products_for_metrics = await self.admin_product_collection.get_all_products()
            if not products_for_metrics:
                logger.warning("get_all_products() returned an empty list or None.")
        except Exception as e:
            logger.error(f"Error calling get_all_products(): {e}")
            products_for_metrics = []

        total_keys_overall = 0
        available_keys_overall = 0
        used_keys_overall = 0
        expired_keys_overall = 0  # Not directly derived from current cdKey structure, remains 0
        low_stock_products_overall = 0
        key_usage_by_product_list = []
        usage_times_overall = [] # For average calculation

        for i, product in enumerate(products_for_metrics):
            product_id_str = str(product.id) if product.id else f"N/A_ID_IDX_{i}"
            # Ensure product.name is accessed safely, especially if it could be a string directly
            if isinstance(product.name, dict):
                product_name_str = product.name.get('en', f'Unknown Product IDX {i}')
            else:
                product_name_str = str(product.name) if product.name else f'Unnamed Product IDX {i}'
            
            manages_cd_keys_attr = getattr(product, 'manages_cd_keys', False)

            product_total_keys = 0
            product_available_keys = 0
            product_used_keys = 0

            if manages_cd_keys_attr and hasattr(product, 'cdKeys') and product.cdKeys:
                embedded_keys = product.cdKeys # Should be List[CDKey]
                
                if isinstance(embedded_keys, list):
                    product_total_keys = len(embedded_keys)
                    for emb_key_idx, key_obj in enumerate(embedded_keys):
                        # Assuming key_obj is an instance of CDKey model or a dict-like object
                        key_value_str = getattr(key_obj, 'key', 'N/A_KEY_VALUE')
                        is_used_attr = getattr(key_obj, 'isUsed', False) 
                        
                        if is_used_attr:
                            product_used_keys += 1
                        else:
                            product_available_keys += 1
                        
                        if is_used_attr: # Logic for averageKeyUsageTime
                            added_at_val = getattr(key_obj, 'addedAt', None)
                            used_at_val = getattr(key_obj, 'usedAt', None)
                            if added_at_val and used_at_val:
                                try:
                                    # Ensure datetime objects for calculation
                                    added_at_dt = added_at_val if isinstance(added_at_val, datetime) else datetime.fromisoformat(str(added_at_val).replace('Z', '+00:00'))
                                    used_at_dt = used_at_val if isinstance(used_at_val, datetime) else datetime.fromisoformat(str(used_at_val).replace('Z', '+00:00'))
                                    
                                    if added_at_dt and used_at_dt: # Redundant check, but safe
                                        time_diff_seconds = (used_at_dt - added_at_dt).total_seconds()
                                        if time_diff_seconds >= 0:
                                            usage_times_overall.append(time_diff_seconds / 3600) # hours
                                        else:
                                            logger.warning(f"Key '{key_value_str}' (Product: {product_id_str}) has usedAt before addedAt. Skipping for avg time.")
                                except Exception as e_date:
                                    logger.warning(f"Error parsing dates for key '{key_value_str}' (Product: {product_id_str}): {e_date}")

            total_keys_overall += product_total_keys
            available_keys_overall += product_available_keys
            used_keys_overall += product_used_keys

            # Low stock calculation
            min_stock_threshold_val = getattr(product, 'minStockAlert', 10) 
            min_stock_threshold = min_stock_threshold_val if isinstance(min_stock_threshold_val, (int, float)) and min_stock_threshold_val is not None else 10
            
            if manages_cd_keys_attr and product_available_keys <= min_stock_threshold and product_total_keys > 0 : # Only count if it manages keys and has keys
                low_stock_products_overall += 1
            
            key_usage_by_product_list.append({
                "productId": product_id_str,
                "productName": product_name_str,
                "totalKeys": product_total_keys,
                "availableKeys": product_available_keys,
                "usedKeys": product_used_keys
                # Add other per-product stats if needed by frontend, e.g., status counts
            })

        average_key_usage_time_final = None
        if usage_times_overall:
            average_key_usage_time_final = sum(usage_times_overall) / len(usage_times_overall)

        final_metrics = {
            "totalKeys": total_keys_overall,
            "availableKeys": available_keys_overall,
            "usedKeys": used_keys_overall,
            "expiredKeys": expired_keys_overall, 
            "lowStockProducts": low_stock_products_overall,
            "averageKeyUsageTime": average_key_usage_time_final,
            "keyUsageByProduct": key_usage_by_product_list
        }
        
        logger.info(f"Key metrics calculated: {total_keys_overall} total, {available_keys_overall} available, {used_keys_overall} used, {low_stock_products_overall} low stock products")
        return final_metrics

    # ... (other methods, if any)
