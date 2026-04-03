"""
=============================================================================
Payment Tests
=============================================================================

Tests for payment system:
- Payment intent creation
- Webhook handling
- Double payment prevention
- Security

AUTHOR: SmartCareer AI Team
VERSION: 1.0.0
=============================================================================
"""

import pytest
import hmac
import hashlib
import json
from fastapi import status
from fastapi.testclient import TestClient

from app.models import User
from app.services.payment_service import payment_service, SubscriptionTier


# =============================================================================
# PAYMENT INTENT TESTS
# =============================================================================

@pytest.mark.payment
def test_create_payment_intent_success(client: TestClient, student_headers: dict):
    """Test successful payment intent creation."""
    response = client.post(
        "/api/v1/payments/create-payment-intent",
        headers=student_headers,
        json={
            "subscription_tier": "premium",
            "subscription_months": 1,
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["success"] is True
    assert "client_secret" in data
    assert data["amount"] == 400  # $4.00 in cents
    assert data["subscription_tier"] == "premium"


@pytest.mark.payment
def test_create_payment_intent_quarterly(client: TestClient, student_headers: dict):
    """Test quarterly subscription payment."""
    response = client.post(
        "/api/v1/payments/create-payment-intent",
        headers=student_headers,
        json={
            "subscription_tier": "premium",
            "subscription_months": 3,
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["amount"] == 1200  # 3 months * $4.00


@pytest.mark.payment
def test_create_payment_intent_yearly(client: TestClient, student_headers: dict):
    """Test yearly subscription payment."""
    response = client.post(
        "/api/v1/payments/create-payment-intent",
        headers=student_headers,
        json={
            "subscription_tier": "premium",
            "subscription_months": 12,
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["amount"] == 4000  # $40.00 yearly plan


@pytest.mark.payment
def test_create_payment_intent_invalid_tier(client: TestClient, student_headers: dict):
    """Test payment intent with invalid tier."""
    response = client.post(
        "/api/v1/payments/create-payment-intent",
        headers=student_headers,
        json={
            "subscription_tier": "invalid_tier",
            "subscription_months": 1,
        }
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.payment
def test_create_payment_intent_without_auth(client: TestClient):
    """Test payment intent without authentication."""
    response = client.post(
        "/api/v1/payments/create-payment-intent",
        json={
            "subscription_tier": "premium",
            "subscription_months": 1,
        }
    )
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


# =============================================================================
# IDEMPOTENCY TESTS (DOUBLE PAYMENT PREVENTION)
# =============================================================================

@pytest.mark.payment
@pytest.mark.unit
@pytest.mark.asyncio
async def test_double_payment_prevention():
    """Test that duplicate payment is prevented."""
    from app.services.payment_service import PaymentService
    
    service = PaymentService()
    
    # Create first payment
    payment1 = await service.create_stripe_payment_intent(
        db=None,
        user_id="test-user-1",
        user_email="test@example.com",
        amount=999,
        currency="USD",
        subscription_tier=SubscriptionTier.PREMIUM,
        subscription_months=1,
        idempotency_key="unique-key-123",
    )
    
    # Try to create duplicate payment with same idempotency key
    with pytest.raises(ValueError, match="Payment already processed"):
        await service.create_stripe_payment_intent(
            db=None,
            user_id="test-user-1",
            user_email="test@example.com",
            amount=999,
            currency="USD",
            subscription_tier=SubscriptionTier.PREMIUM,
            subscription_months=1,
            idempotency_key="unique-key-123",  # Same key!
        )


# =============================================================================
# WEBHOOK TESTS
# =============================================================================

@pytest.mark.payment
@pytest.mark.slow
def test_webhook_payment_succeeded(client: TestClient, monkeypatch: pytest.MonkeyPatch, test_student: User):
    """Test webhook for successful payment."""
    # Make test deterministic regardless of local .env secrets.
    payment_service.stripe_webhook_secret = ""
    monkeypatch.setattr("app.config.settings.DEBUG", True, raising=False)
    monkeypatch.setattr("app.config.settings.PAYMENTS_REQUIRE_WEBHOOK_SECRET", False, raising=False)

    # Mock Stripe event
    event = {
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": "pi_test_123",
                "amount": 999,
                "metadata": {
                    "user_id": str(test_student.id),
                    "subscription_tier": "premium",
                    "subscription_months": "1",
                }
            }
        }
    }
    
    payload = json.dumps(event).encode('utf-8')
    
    # Create signature (simplified - in production use real Stripe signature)
    signature = "t=1234567890,v1=mock_signature"
    
    response = client.post(
        "/api/v1/payments/webhook/stripe",
        content=payload,
        headers={"stripe-signature": signature}
    )
    
    # In development mode (no webhook secret), should succeed
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.payment
def test_webhook_missing_signature(client: TestClient):
    """Test webhook without signature fails."""
    event = {"type": "test"}
    payload = json.dumps(event).encode('utf-8')
    
    response = client.post(
        "/api/v1/payments/webhook/stripe",
        content=payload,
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST


# =============================================================================
# PAYMENT HISTORY TESTS
# =============================================================================

@pytest.mark.payment
def test_get_my_payments(client: TestClient, student_headers: dict):
    """Test getting payment history."""
    response = client.get(
        "/api/v1/payments/my-payments",
        headers=student_headers
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "payments" in data
    assert "total" in data


@pytest.mark.payment
def test_get_my_payments_without_auth(client: TestClient):
    """Test getting payment history without auth."""
    response = client.get("/api/v1/payments/my-payments")
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


# =============================================================================
# PRICING TESTS
# =============================================================================

@pytest.mark.payment
@pytest.mark.unit
def test_get_pricing(client: TestClient):
    """Test getting subscription pricing."""
    response = client.get("/api/v1/payments/pricing")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "pricing" in data
    assert "premium" in data["pricing"]
    assert "enterprise" in data["pricing"]
    
    # Verify premium pricing
    premium = data["pricing"]["premium"]
    assert premium["monthly"] == 400
    assert "features" in premium


# =============================================================================
# PAYMENT LOGGING TESTS
# =============================================================================

@pytest.mark.payment
@pytest.mark.unit
@pytest.mark.asyncio
async def test_payment_log_created():
    """Test that payment attempts are logged."""
    from app.services.payment_service import PaymentService
    
    service = PaymentService()
    
    # Create payment
    payment = await service.create_stripe_payment_intent(
        db=None,
        user_id="test-user-1",
        user_email="test@example.com",
        amount=999,
        currency="USD",
        subscription_tier=SubscriptionTier.PREMIUM,
        subscription_months=1,
        idempotency_key="log-test-key",
        ip_address="192.168.1.1",
    )
    
    # Verify payment was logged
    payment_log = service.get_payment_by_id(payment["payment_id"])
    assert payment_log is not None
    assert payment_log.user_email == "test@example.com"
    assert payment_log.amount == 999
    assert payment_log.ip_address == "192.168.1.1"


@pytest.mark.payment
@pytest.mark.unit
def test_payment_logs_query():
    """Test querying payment logs."""
    from app.services.payment_service import PaymentService, PaymentStatus
    
    service = PaymentService()
    
    # Get all logs
    all_logs = service.get_payment_logs()
    assert isinstance(all_logs, list)
    
    # Filter by user
    user_logs = service.get_payment_logs(user_id="test-user-1")
    assert all(log.user_id == "test-user-1" for log in user_logs)
    
    # Filter by status
    pending_logs = service.get_payment_logs(status=PaymentStatus.PENDING)
    assert all(log.status == PaymentStatus.PENDING for log in pending_logs)






