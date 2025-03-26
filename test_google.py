try:
    import google
    print("Google module is available!")
    
    try:
        from google.oauth2 import id_token
        print("Google OAuth2 id_token module is available!")
    except ImportError as e:
        print(f"Error importing google.oauth2.id_token: {e}")
        
except ImportError as e:
    print(f"Error importing google: {e}")
    
    # Check if googleapiclient is available separately
    try:
        import googleapiclient
        print("But googleapiclient is available!")
    except ImportError:
        print("googleapiclient is also not available")