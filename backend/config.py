import os
from supabase import create_client, Client

# Supabase Configuration
SUPABASE_URL = "https://ybsssvczfmbwplzgqxsh.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlic3NzdmN6Zm1id3BsemdxeHNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUyNzU2OSwiZXhwIjoyMDcyMTAzNTY5fQ.Sd4iIlhVlwQeIe4Kv3t06lcwfotmXP7Ba-mMVc31Hpo"

# Database URL
DATABASE_URL = "postgresql://postgres.ybsssvczfmbwplzgqxsh:ikebata3@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

# API Configuration
API_HOST = "0.0.0.0"
API_PORT = 8000

# Initialize Supabase client
def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
