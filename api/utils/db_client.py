import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Carregar credenciais
supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Credenciais do Supabase ausentes nas variáveis de ambiente.")

# Cliente Supabase singleton
db: Client = create_client(supabase_url, supabase_key)
