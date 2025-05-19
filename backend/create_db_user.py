#!/usr/bin/env python3
# filepath: create_db_user.py
import os
import sys
from pymongo import MongoClient
from pymongo.errors import OperationFailure
from dotenv import load_dotenv

def main():
    """Create a database user in MongoDB instance"""
    load_dotenv()
    
    # Get MongoDB URI from environment
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        print("Error: MONGODB_URI environment variable is not set")
        return 1
    
    # Connect to MongoDB without authentication
    # Extract the host from the URI
    try:
        if "+srv" in mongo_uri:
            host = mongo_uri.split("@")[1].split("/")[0]
            print(f"Connecting to MongoDB host: {host}")
        else:
            parts = mongo_uri.split("@")
            if len(parts) > 1:
                host = parts[1].split("/")[0]
                print(f"Connecting to MongoDB host: {host}")
            else:
                print("Could not parse host from URI")
                return 1
        
        # Connect to MongoDB with admin rights
        print("Attempting to connect to MongoDB...")
        client = MongoClient(mongo_uri)
        
        # Check if connection is established
        print("Testing connection...")
        client.admin.command("ping")
        print("Connection successful!")
        
        # Create a new user with less complex password
        new_username = "monkeyapp"
        new_password = "monkeyzPassword123"
        
        try:
            print(f"Creating new user {new_username}...")
            client.admin.command(
                "createUser",
                new_username,
                pwd=new_password,
                roles=[
                    {"role": "readWrite", "db": "admin"},
                    {"role": "dbAdmin", "db": "admin"}
                ]
            )
            print(f"User {new_username} created successfully!")
            
            # Display the new connection string
            # Replace credentials in the original URI
            if "+srv" in mongo_uri:
                old_creds = mongo_uri.split("@")[0]
                new_uri = mongo_uri.replace(
                    old_creds, 
                    f"mongodb+srv://{new_username}:{new_password}"
                )
            else:
                old_creds = mongo_uri.split("@")[0]
                new_uri = mongo_uri.replace(
                    old_creds,
                    f"mongodb://{new_username}:{new_password}"
                )
            
            print("\nUse this new MongoDB URI in your .env file and Digital Ocean:")
            print(new_uri)
            print("\nUpdate the MONGODB_URI environment variable in Digital Ocean with this value.")
            
        except OperationFailure as e:
            if "already exists" in str(e):
                print(f"User {new_username} already exists.")
            elif "not authorized" in str(e):
                print("Not authorized to create users. Make sure your credentials have admin rights.")
                print("For Digital Ocean MongoDB, you need to use the 'doadmin' account.")
            else:
                print(f"Operation failed: {str(e)}")
            return 1
        
        return 0
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
