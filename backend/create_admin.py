#!/usr/bin/env python3
"""
Script to create an admin account for MonkeyZ
Run this script to create an admin account directly in the database.
"""

import asyncio
import os
import sys
import getpass
import logging
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from src.models.user.user import User, Role
from src.lib.haseing import Hase

logging.basicConfig(level=logging.DEBUG)

async def create_admin():
    print("=== MonkeyZ Admin Account Creator ===")
    
    # Connect to database
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db_name = "shop"
    
    client = AsyncIOMotorClient(mongo_uri)
    database = client[db_name]
    
    # Initialize beanie with the User model
    await init_beanie(database=database, document_models=[User])
    
    # Get admin details
    print("\nEnter admin account details:")
    username = input("Username: ")
    email = input("Email: ")
    password = getpass.getpass("Password (hidden): ")
    confirm_password = getpass.getpass("Confirm Password (hidden): ")
    
    # Validate inputs
    if not username or not email or not password:
        print("Error: Username, email, and password are all required.")
        return
    
    if password != confirm_password:
        print("Error: Passwords do not match.")
        return
    
    if len(password) < 8:
        print("Error: Password must be at least 8 characters long.")
        return
    
    # Check if user already exists
    existing_user_by_username = await User.find_one(User.username == username)
    if existing_user_by_username:
        print("Error: Username already exists. Choose another username.")
        return
    
    existing_user_by_email = await User.find_one(User.email == email)
    if existing_user_by_email:
        print("Error: Email already in use. Choose another email.")
        return
    
    # Create the admin user
    try:
        hashed_password = Hase.bcrypt(password)
        admin_user = User(
            username=username,
            password=hashed_password,
            role=Role.manager,
            email=email,
            phone_number=None
        )
        await admin_user.save()
        print("\nSuccess: Admin account created with manager role!")
        print(f"Username: {username}")
        print(f"Email: {email}")
        print(f"Role: manager")
    except Exception as e:
        print(f"Error creating admin user: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(create_admin())
    except Exception as e:
        logging.error("An error occurred while running the script", exc_info=True)
