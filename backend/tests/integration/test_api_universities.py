"""
=============================================================================
UNIVERSITIES API INTEGRATION TESTS
=============================================================================

Tests for universities, scholarships, and related endpoints.
"""

import pytest
from fastapi import status
from uuid import uuid4

# =============================================================================
# UNIVERSITIES TESTS
# =============================================================================

def test_list_universities(client, student_token):
    """Test listing universities."""
    response = client.get(
        "/api/v1/universities",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "universities" in data
    assert "total" in data
    assert isinstance(data["universities"], list)


def test_list_universities_with_filters(client, student_token):
    """Test listing universities with country filter."""
    response = client.get(
        "/api/v1/universities?country=USA&limit=5",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total"] >= 0
    # All results should be from USA
    for uni in data["universities"]:
        if uni.get("country"):
            assert uni["country"] == "USA"


def test_get_university_by_id(client, student_token):
    """Test getting a specific university."""
    # First get list
    response = client.get(
        "/api/v1/universities?limit=1",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    
    if response.json()["total"] > 0:
        university_id = response.json()["universities"][0]["id"]
        
        # Get specific university
        response = client.get(
            f"/api/v1/universities/{university_id}",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == university_id
        assert "name" in data
        assert "country" in data


def test_get_university_not_found(client, student_token):
    """Test getting non-existent university."""
    fake_id = str(uuid4())
    response = client.get(
        f"/api/v1/universities/{fake_id}",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    
    assert response.status_code == status.HTTP_404_NOT_FOUND


# =============================================================================
# AI SEARCH TESTS
# =============================================================================

def test_ai_university_search(client, student_token, mock_gemini):
    """Test AI-powered university search."""
    search_request = {
        "student_profile": {
            "gpa": 3.8,
            "major": "Computer Science",
            "budget": 50000,
            "preferred_countries": ["USA", "UK"],
            "test_scores": {
                "SAT": 1400,
                "IELTS": 7.5
            }
        }
    }
    
    response = client.post(
        "/api/v1/universities/ai-search",
        json=search_request,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "matches" in data
    assert isinstance(data["matches"], list)


def test_ai_university_search_unauthorized(client):
    """Test AI search without authentication."""
    search_request = {
        "student_profile": {
            "gpa": 3.8,
            "major": "Computer Science"
        }
    }
    
    response = client.post(
        "/api/v1/universities/ai-search",
        json=search_request
    )
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


# =============================================================================
# SCHOLARSHIPS TESTS
# =============================================================================

def test_list_scholarships(client, student_token):
    """Test listing scholarships."""
    response = client.get(
        "/api/v1/scholarships",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "scholarships" in data
    assert "total" in data
    assert isinstance(data["scholarships"], list)


def test_list_scholarships_with_filters(client, student_token):
    """Test listing scholarships with country filter."""
    response = client.get(
        "/api/v1/scholarships?country=UK&limit=5",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total"] >= 0


def test_get_scholarship_by_id(client, student_token):
    """Test getting a specific scholarship."""
    # First get list
    response = client.get(
        "/api/v1/scholarships?limit=1",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    
    if response.json()["total"] > 0:
        scholarship_id = response.json()["scholarships"][0]["id"]
        
        # Get specific scholarship
        response = client.get(
            f"/api/v1/scholarships/{scholarship_id}",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == scholarship_id
        assert "name" in data


# =============================================================================
# UNIVERSITY APPLICATIONS TESTS
# =============================================================================

def test_create_university_application(client, student_token):
    """Test creating a university application."""
    # First get a university
    response = client.get(
        "/api/v1/universities?limit=1",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    
    if response.json()["total"] > 0:
        university_id = response.json()["universities"][0]["id"]
        
        application_data = {
            "university_id": university_id,
            "program": "Computer Science - MSc",
            "deadline": "2025-12-31T00:00:00Z",
            "documents": {
                "transcript": "pending",
                "recommendation_letters": "pending",
                "statement_of_purpose": "pending"
            }
        }
        
        response = client.post(
            "/api/v1/university-applications",
            json=application_data,
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["university_id"] == university_id
        assert data["program"] == "Computer Science - MSc"
        assert data["status"] == "draft"


def test_list_my_university_applications(client, student_token):
    """Test listing user's university applications."""
    response = client.get(
        "/api/v1/university-applications",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "applications" in data
    assert "total" in data


def test_update_university_application(client, student_token):
    """Test updating a university application."""
    # First create an application
    response = client.get(
        "/api/v1/universities?limit=1",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    
    if response.json()["total"] > 0:
        university_id = response.json()["universities"][0]["id"]
        
        # Create application
        application_data = {
            "university_id": university_id,
            "program": "Computer Science - MSc",
            "deadline": "2025-12-31T00:00:00Z"
        }
        
        response = client.post(
            "/api/v1/university-applications",
            json=application_data,
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        if response.status_code == status.HTTP_201_CREATED:
            application_id = response.json()["id"]
            
            # Update application
            update_data = {
                "documents": {
                    "transcript": "uploaded",
                    "recommendation_letters": "pending"
                }
            }
            
            response = client.put(
                f"/api/v1/university-applications/{application_id}",
                json=update_data,
                headers={"Authorization": f"Bearer {student_token}"}
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["documents"]["transcript"] == "uploaded"


# =============================================================================
# MOTIVATION LETTER TESTS
# =============================================================================

def test_generate_motivation_letter(client, student_token, mock_gemini):
    """Test AI motivation letter generation."""
    # First get a university
    response = client.get(
        "/api/v1/universities?limit=1",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    
    if response.json()["total"] > 0:
        university_id = response.json()["universities"][0]["id"]
        
        # Create application first
        application_data = {
            "university_id": university_id,
            "program": "Computer Science - MSc",
            "deadline": "2025-12-31T00:00:00Z"
        }
        
        response = client.post(
            "/api/v1/university-applications",
            json=application_data,
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        if response.status_code == status.HTTP_201_CREATED:
            application_id = response.json()["id"]
            
            # Generate motivation letter
            letter_request = {
                "application_id": application_id,
                "student_background": {
                    "academic": "Computer Science major, 3.8 GPA",
                    "experience": "Internship at tech startup",
                    "achievements": "Hackathon winner"
                }
            }
            
            response = client.post(
                "/api/v1/motivation-letters/generate",
                json=letter_request,
                headers={"Authorization": f"Bearer {student_token}"}
            )
            
            assert response.status_code == status.HTTP_201_CREATED
            data = response.json()
            assert "content" in data
            assert "application_id" in data


def test_generate_motivation_letter_unauthorized(client):
    """Test generating motivation letter without authentication."""
    letter_request = {
        "application_id": str(uuid4()),
        "student_background": {}
    }
    
    response = client.post(
        "/api/v1/motivation-letters/generate",
        json=letter_request
    )
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
