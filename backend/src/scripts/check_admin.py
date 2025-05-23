from pymongo import MongoClient
from enum import Enum

class Role(Enum):
    manager = 0
    default = 1

def main():
    # Connect to MongoDB
    client = MongoClient('mongodb://localhost:27017/')
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
        
        if current_role != 'manager':
            update = users.update_one(
                {'username': admin_username},
                {'$set': {'role': 'manager'}}
            )
            if update.modified_count:
                print(f"\nUpdated {admin_username}'s role to manager")
            else:
                print("\nNo update needed or update failed")
    else:
        print(f"\nUser {admin_username} not found")

if __name__ == "__main__":
    main()
