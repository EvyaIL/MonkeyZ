import os
from dotenv import load_dotenv
import boto3

# Load environment variables
load_dotenv()

def test_aws_connection():
    try:
        # Initialize S3 client for product images
        s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY"),
            aws_secret_access_key=os.getenv("AWS_SECRET_KEY")
        )
        
        # Get list of buckets to test connection
        response = s3_client.list_buckets()
        
        print("AWS S3 Connection Successful!")
        print(f"Available buckets: {[bucket['Name'] for bucket in response['Buckets']]}")
        
        # Check if our target bucket exists
        target_bucket = os.getenv("S3_BUCKET_NAME")
        if target_bucket in [bucket['Name'] for bucket in response['Buckets']]:
            print(f"Target bucket '{target_bucket}' exists")
        else:
            print(f"Target bucket '{target_bucket}' does not exist")
            
    except Exception as e:
        print(f"Error connecting to AWS S3: {str(e)}")

def check_env_vars():
    required_vars = [
        "AWS_ACCESS_KEY", 
        "AWS_SECRET_KEY", 
        "S3_BUCKET_NAME",
        "DISCORD_BOT_TOKEN",
        "DISCORD_CLIENT_ID",
        "DISCORD_CLIENT_SECRET"
    ]
    
    missing = []
    for var in required_vars:
        if not os.getenv(var):
            missing.append(var)
    
    if missing:
        print(f"Missing environment variables: {', '.join(missing)}")
    else:
        print("All required environment variables are present")

if __name__ == "__main__":
    check_env_vars()
    # Only test AWS connection if credentials are available
    if os.getenv("AWS_ACCESS_KEY") and os.getenv("AWS_SECRET_KEY"):
        test_aws_connection()
