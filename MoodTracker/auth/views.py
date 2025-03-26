from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.conf import settings
import requests

# Import our custom Google auth helper instead of firebase_admin
try:
    from google_auth import verify_google_id_token
    print("Successfully imported Google auth helper")
except ImportError as e:
    print(f"Error importing Google auth helper: {e}")
    def verify_google_id_token(token):
        raise Exception("Google auth helper not available. Token validation not possible.")

User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    """
    Google login endpoint.
    """
    try:
        # Get the ID token from the request
        id_token_str = request.data.get('id_token')
        
        if not id_token_str:
            return Response({'detail': 'ID token is required'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Verify the token
        try:
            decoded_token = verify_google_id_token(id_token_str)
        except Exception as e:
            return Response({'detail': f'Token verification failed: {str(e)}'}, 
                           status=status.HTTP_401_UNAUTHORIZED)
        
        # Get user info from the token
        email = decoded_token.get('email')
        if not email:
            return Response({'detail': 'Email not found in token'}, 
                           status=status.HTTP_400_BAD_REQUEST)
                
        # Get or create user based on Google info
        given_name = decoded_token.get('given_name', '')
        family_name = decoded_token.get('family_name', '')
        name = decoded_token.get('name', f"{given_name} {family_name}".strip())
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Create a new user
            username = email.split('@')[0]
            # Ensure username is unique
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
                
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=given_name,
                last_name=family_name,
            )
        
        # Generate or get the token for the user
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}".strip()
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'detail': str(e)}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def google_token_login(request):
    """
    Login using Google OAuth 2.0 access token.
    """
    try:
        access_token = request.data.get('access_token')
        email = request.data.get('email')
        
        if not access_token or not email:
            return Response({'detail': 'Access token and email are required'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Verify the token by making a request to Google
        userinfo_resp = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if userinfo_resp.status_code != 200:
            return Response({'detail': 'Invalid access token'}, 
                           status=status.HTTP_401_UNAUTHORIZED)
        
        userinfo = userinfo_resp.json()
        google_email = userinfo.get('email')
        
        # Verify email matches the one provided
        if email != google_email:
            return Response({'detail': 'Email mismatch'}, 
                           status=status.HTTP_401_UNAUTHORIZED)
                
        # Get or create user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Create a new user
            username = email.split('@')[0]
            # Ensure username is unique
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
                
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=userinfo.get('given_name', ''),
                last_name=userinfo.get('family_name', ''),
            )
        
        # Generate token for the user
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'success': True,
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}".strip()
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'detail': str(e)}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR) 