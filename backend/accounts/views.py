from django.shortcuts import render
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import User
from rest_framework.parsers import JSONParser
from django.contrib.auth.hashers import make_password
from django.http import JsonResponse
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from mongoDBConnector import get_user_financial_info, add_transaction, update_budget
from mongoDBConnector import reset_month as RM, remove_budget as RB
import re
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

def is_valid_email(email):
    """Check if the email format is valid."""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None

@api_view(['POST'])
def register_user(request):
    if request.method == 'POST' and is_valid_email(request.data.get('email', '')):
        # Get data from the request
        data = request.data
        email = data.get('email')
        password = data.get('password')

        # Check if all fields are provided
        if not email or not password:
            return Response({"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already exists"}, status=status.HTTP_400_BAD_REQUEST)

        # Create the new user
        user = User.objects.create(
            username=email,
            email=email,
            password=make_password(password)  # Hash the password
        )

        # Generate refresh and access tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        # Return the tokens along with user data
        user_financial_data = get_user_financial_info(email)
        return Response({
            "message": "User created successfully",
            "access": access_token,
            "refresh": refresh_token,
            "user_id": user.id,
            "financial_data": user_financial_data
        }, status=status.HTTP_201_CREATED)

class UserFinancialDataView(APIView):
    permission_classes = [IsAuthenticated]  # Only allow authenticated users
    
    def get(self, request):
        # Access the user's email
        email = request.user.email
        if email:
            # Proceed to fetch financial data for the user
            user_financial_data = get_user_financial_info(email)
            return Response({"detail": "User financial info found", "financial_data": user_financial_data})
        else:
            return Response({"detail": "Email not found."}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])  # Ensure the user is authenticated
def create_transaction(request):
    try:
        # Get the user's email
        user_email = request.user.email
        
        # Parse the incoming data
        data = request.data

        # Extract the necessary fields from the request data
        description = data.get('description')
        amount = data.get('amount')
        category = data.get('category')
        transaction_type = data.get('type')  # Either 'income' or 'expense'

        # Check if all required fields are provided
        if not description or not amount or not category or not transaction_type:
            return JsonResponse({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        # Create the transaction object with the user_email
        transaction = {
            'description': description,
            'amount': amount,
            'category': category,
            'type': transaction_type,
        }

        add_transaction(user_email, transaction)

        # Return the transaction data as a response
        return JsonResponse({
            # "description": transaction.description,
            # "amount": str(transaction.amount),
            # "category": transaction.category,
            # # "date": transaction.date.isoformat(),
            # "type": transaction.type
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])  # Ensure the user is authenticated
def reset_month(request):
    try:
        # Get the user's email
        user_email = request.user.email

        RM(user_email)

        # Return the transaction data as a response
        return JsonResponse({
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])  # Ensure the user is authenticated
def change_budget(request):
    try:
        # Get the user's email
        user_email = request.user.email
        budget_info = request.data.get("budget")

        update_budget(user_email, budget_info)

        # Return the transaction data as a response
        return JsonResponse({
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])  # Ensure the user is authenticated
def remove_budget(request):
    try:
        # Get the user's email
        user_email = request.user.email
        budget_name = request.data.get("budget_name")

        RB(user_email, budget_name)

        # Return the transaction data as a response
        return JsonResponse({
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SendResetEmailAPI(APIView):
    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(username=email)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            reset_link = f"http://localhost:5173/reset-password?uid={uid}&token={token}"

            send_mail(
                subject='Reset your password',
                message=f"Hi! Click the link to reset your password: {reset_link}",
                from_email='yiolop89@gmail.com',
                recipient_list=[email],
            )

            return Response({"message": "Reset link sent"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_exempt, name='dispatch')
class ResetPasswordConfirmAPI(APIView):
    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('password')

        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Invalid UID'}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
