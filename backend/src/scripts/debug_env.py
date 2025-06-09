# Temporary debug script to check if .env is loaded and MongoDB URI is visible
import os
from dotenv import load_dotenv

print('Current working directory:', os.getcwd())
expected_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env'))
print('Expected .env path:', expected_env_path)
print('File exists:', os.path.isfile(expected_env_path))
load_dotenv(dotenv_path=expected_env_path)
print('MONGODB_URI:', os.getenv('MONGODB_URI'))
