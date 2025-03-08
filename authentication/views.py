from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    try:
        logger.info(f"Register request data: {request.data}")
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            logger.warning("Missing email or password")
            return Response(
                {'message': 'Please provide both email and password'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if User.objects.filter(email=email).exists():
            logger.warning(f"User with email {email} already exists")
            return Response(
                {'message': 'User with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user = User.objects.create(
            email=email,
            username=email,
            password=make_password(password)
        )
        
        refresh = RefreshToken.for_user(user)
        logger.info(f"Successfully created user with email: {email}")
        
        return Response({
            'token': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email
            }
        })
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return Response(
            {'message': 'Registration failed. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    try:
        logger.info(f"Login request data: {request.data}")
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            logger.warning("Missing email or password")
            return Response(
                {'message': 'Please provide both email and password'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user = User.objects.filter(email=email).first()
        
        if user is None or not user.check_password(password):
            logger.warning(f"Invalid login attempt for email: {email}")
            return Response(
                {'message': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        refresh = RefreshToken.for_user(user)
        logger.info(f"Successful login for user: {email}")
        
        return Response({
            'token': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email
            }
        })
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return Response(
            {'message': 'Login failed. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def logout(request):
    try:
        # Client should remove the token
        return Response({'message': 'Successfully logged out'})
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 