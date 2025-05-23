from pymongo import MongoClient
import os
from enum import Enum
from dotenv import load_dotenv

class Role(Enum):
    manager = 0
    default = 1

def main():
    # Load environment variables
    load_dotenv()
    
    # Get MongoDB URI from environment variable or use default
    mongo_uri = os.getenv('MONGO_URI')
    if not mongo_uri:
        print("Error: MONGO_URI environment variable not found")
        return
    
    try:
        # Connect to MongoDB
        client = MongoClient(mongo_uri)
        db = client['monkeyz']
        users = db['User']

        # Print all users and their roles
        print("\nCurrent users and their roles:")
        for user in users.find():
            print(f"Username: {user.get('username')}, Role: {user.get('role')}")

        # Fix admin role if needed
        admin_username = input("\nEnter the admin username to check/fix: ")
        user = users.find_one({'username': admin_username})
        
        if user:
            current_role = user.get('role')
            print(f"\nCurrent role for {admin_username}: {current_role}")
            
            if current_role != Role.manager:
                update = users.update_one(
                    {'username': admin_username},
                    {'$set': {'role': Role.manager}}
                )
                if update.modified_count:
                    print(f"\nUpdated {admin_username}'s role to manager")
                else:
                    print("\nNo update needed")
        else:
            print(f"\nUser {admin_username} not found")

    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
