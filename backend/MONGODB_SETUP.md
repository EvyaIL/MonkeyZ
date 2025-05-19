# How to Fix MongoDB Authentication Error in DigitalOcean

Your app is encountering a MongoDB authentication error. Here are step-by-step instructions to fix it:

## Option 1: Create a New Database User (Recommended)

1. **Access your MongoDB Database in DigitalOcean**
   - Log into DigitalOcean dashboard
   - Navigate to Databases
   - Select your MongoDB database

2. **Create a New Database User**
   - Find "Users & Settings" or "Database Users"
   - Click "Add User"
   - Create a new user with:
     - Username: `monkeyapp` (use a simple name)
     - Password: Create a strong password without special characters
     - Permissions: readWrite and dbAdmin on the admin database

3. **Update Environment Variables in DigitalOcean App Platform**
   - Go to your app in App Platform
   - Navigate to Settings > Environment Variables
   - Update MONGODB_URI with:
   ```
   MONGODB_URI=mongodb+srv://monkeyapp:YOUR_NEW_PASSWORD@db-mongodb-fra1-43053-462a82bd.mongo.ondigitalocean.com/admin?authSource=admin
   ```
   - Make sure to check "Encrypt" option
   - Save and redeploy your application

## Option 2: Verify Existing Credentials

If you prefer to use the existing credentials:

1. **Check if you've entered the correct password for `doadmin`**
   - Double-check your password directly in the DigitalOcean dashboard

2. **Simplify your connection string in DigitalOcean**
   - Update MONGODB_URI to use a simpler format:
   ```
   MONGODB_URI=mongodb+srv://doadmin:314YWhb7z98t6T0U@db-mongodb-fra1-43053-462a82bd.mongo.ondigitalocean.com/admin?authSource=admin
   ```

3. **Test connection locally**
   - Before deploying, test your connection using the test scripts

## Option 3: Contact DigitalOcean Support

If neither Option 1 nor Option 2 works:
- Take screenshots of your error message
- Include the exact MongoDB URI you're using
- Contact DigitalOcean support for assistance with MongoDB connection issues

## Important Notes

- Make sure there are no quotation marks around the URI value in DigitalOcean
- If you update your database password, update it in DigitalOcean immediately
- After making changes, always redeploy your application or restart the service

---

Remember: Never commit real MongoDB credentials to GitHub!
