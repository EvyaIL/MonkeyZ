from datetime import datetime, timedelta
from typing import List, Optional, Dict, Tuple
from .products import Product, DigitalCode
from uuid import uuid4


class DigitalCodeManager:
    @staticmethod
    async def add_codes(product: Product, codes: List[str], activation_urls: Optional[List[str]] = None) -> Product:
        """Add new digital codes to a product"""
        if activation_urls and len(codes) != len(activation_urls):
            raise ValueError("If providing activation URLs, they must match the number of codes")

        for idx, code in enumerate(codes):
            code_id = str(uuid4())
            digital_code = DigitalCode(
                code=code,
                activation_url=activation_urls[idx] if activation_urls else None,
                is_used=False
            )
            product.digital_codes[code_id] = digital_code

        await product.save()
        return product

    @staticmethod
    async def assign_code(product: Product, user_id: str) -> Tuple[str, Optional[str]]:
        """Assign an unused code to a user"""
        available_codes = [
            (code_id, code_data) 
            for code_id, code_data in product.digital_codes.items() 
            if not code_data.is_used
        ]

        if not available_codes:
            raise ValueError("No codes available")

        code_id, code_data = available_codes[0]
        code_data.is_used = True
        code_data.used_by = user_id
        code_data.used_at = datetime.now()

        if product.expiry_days:
            code_data.expiry_date = datetime.now() + timedelta(days=product.expiry_days)

        product.digital_codes[code_id] = code_data
        await product.save()

        return code_data.code, code_data.activation_url

    @staticmethod
    async def get_available_codes_count(product: Product) -> int:
        """Get the count of unused codes"""
        return len([code for code in product.digital_codes.values() if not code.is_used])

    @staticmethod
    async def check_code_availability(product: Product) -> Dict:
        """Check code availability and return stock status"""
        available_count = await DigitalCodeManager.get_available_codes_count(product)
        is_low_stock = available_count <= product.stock_threshold
        is_out_of_stock = available_count == 0

        return {
            "available_count": available_count,
            "is_low_stock": is_low_stock,
            "is_out_of_stock": is_out_of_stock,
            "threshold": product.stock_threshold
        }

    @staticmethod
    async def revoke_code(product: Product, code_id: str) -> Product:
        """Revoke a used code and make it available again"""
        if code_id not in product.digital_codes:
            raise ValueError("Code not found")

        code_data = product.digital_codes[code_id]
        code_data.is_used = False
        code_data.used_by = None
        code_data.used_at = None
        code_data.expiry_date = None

        product.digital_codes[code_id] = code_data
        await product.save()
        return product

    @staticmethod
    async def delete_code(product: Product, code_id: str) -> Product:
        """Delete a code from the product"""
        if code_id not in product.digital_codes:
            raise ValueError("Code not found")

        del product.digital_codes[code_id]
        await product.save()
        return product

    @staticmethod
    async def update_code(
        product: Product,
        code_id: str,
        new_code: Optional[str] = None,
        new_activation_url: Optional[str] = None
    ) -> Product:
        """Update code details"""
        if code_id not in product.digital_codes:
            raise ValueError("Code not found")

        code_data = product.digital_codes[code_id]
        if new_code:
            code_data.code = new_code
        if new_activation_url is not None:  # Allow setting to None
            code_data.activation_url = new_activation_url

        product.digital_codes[code_id] = code_data
        await product.save()
        return product
