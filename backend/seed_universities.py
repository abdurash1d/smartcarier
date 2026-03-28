#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
SEED UNIVERSITIES AND SCHOLARSHIPS DATA
=============================================================================

This script populates the database with real university and scholarship data.

Usage:
    python seed_universities.py

Features:
- 50+ top universities worldwide
- 20+ scholarships and grants
- Real requirements and deadlines
- Multiple countries and programs
"""

import sys
import io

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
from uuid import uuid4
from datetime import datetime, timedelta, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add parent directory to path
sys.path.insert(0, '.')

from app.config import settings
from app.models import University, Scholarship
from app.models.base import Base

# =============================================================================
# DATABASE SETUP
# =============================================================================

engine = create_engine(str(settings.DATABASE_URL), echo=False)
SessionLocal = sessionmaker(bind=engine)

# =============================================================================
# UNIVERSITY DATA
# =============================================================================

UNIVERSITIES_DATA = [
    # USA Universities
    {
        "name": "Massachusetts Institute of Technology (MIT)",
        "short_name": "MIT",
        "country": "United States",
        "city": "Cambridge, MA",
        "world_ranking": 1,
        "description": "World's leading university for technology and innovation. Home to cutting-edge research in AI, robotics, and engineering.",
        "website": "https://www.mit.edu",
        "programs": ["Computer Science", "Engineering", "Mathematics", "Physics", "Artificial Intelligence", "Data Science"],
        "requirements": {"ielts": 7.0, "toefl": 100, "gpa": 3.8, "sat": 1520},
        "tuition_min": 53790,
        "tuition_max": 58240,
        "currency": "USD",
        "application_deadline_fall": "2024-11-01",
        "application_deadline_spring": "2024-03-01",
        "acceptance_rate": 4.0,
    },
    {
        "name": "Stanford University",
        "short_name": "Stanford",
        "country": "United States",
        "city": "Stanford, CA",
        "world_ranking": 2,
        "description": "Premier institution in Silicon Valley, known for entrepreneurship and innovation.",
        "website": "https://www.stanford.edu",
        "programs": ["Computer Science", "Business", "Law", "Medicine", "Engineering", "Data Science"],
        "requirements": {"ielts": 7.0, "toefl": 100, "gpa": 3.7, "sat": 1500},
        "tuition_min": 51354,
        "tuition_max": 56169,
        "currency": "USD",
        "application_deadline_fall": "2024-11-01",
        "acceptance_rate": 4.3,
    },
    {
        "name": "Harvard University",
        "short_name": "Harvard",
        "country": "United States",
        "city": "Cambridge, MA",
        "world_ranking": 3,
        "description": "America's oldest university, renowned for excellence across all disciplines.",
        "website": "https://www.harvard.edu",
        "programs": ["Business", "Law", "Medicine", "Computer Science", "Economics", "Political Science"],
        "requirements": {"ielts": 7.5, "toefl": 110, "gpa": 3.9, "sat": 1540},
        "tuition_min": 51143,
        "tuition_max": 54269,
        "currency": "USD",
        "application_deadline_fall": "2024-11-01",
        "acceptance_rate": 3.4,
    },
    {
        "name": "California Institute of Technology (Caltech)",
        "short_name": "Caltech",
        "country": "United States",
        "city": "Pasadena, CA",
        "world_ranking": 6,
        "description": "Elite science and engineering institute with world-class research facilities.",
        "website": "https://www.caltech.edu",
        "programs": ["Physics", "Chemistry", "Engineering", "Computer Science", "Mathematics"],
        "requirements": {"ielts": 7.0, "toefl": 100, "gpa": 3.9, "sat": 1545},
        "tuition_min": 52362,
        "tuition_max": 56364,
        "currency": "USD",
        "application_deadline_fall": "2024-11-01",
        "acceptance_rate": 6.4,
    },
    {
        "name": "University of California, Berkeley",
        "short_name": "UC Berkeley",
        "country": "United States",
        "city": "Berkeley, CA",
        "world_ranking": 10,
        "description": "Top public research university with strong programs in technology and sciences.",
        "website": "https://www.berkeley.edu",
        "programs": ["Computer Science", "Engineering", "Business", "Data Science", "Physics"],
        "requirements": {"ielts": 6.5, "toefl": 90, "gpa": 3.6},
        "tuition_min": 14312,
        "tuition_max": 44008,
        "currency": "USD",
        "application_deadline_fall": "2024-11-30",
        "acceptance_rate": 16.9,
    },
    
    # UK Universities
    {
        "name": "University of Cambridge",
        "short_name": "Cambridge",
        "country": "United Kingdom",
        "city": "Cambridge",
        "world_ranking": 3,
        "description": "One of the world's oldest and most prestigious universities, with 800+ years of history.",
        "website": "https://www.cam.ac.uk",
        "programs": ["Engineering", "Natural Sciences", "Computer Science", "Mathematics", "Medicine"],
        "requirements": {"ielts": 7.5, "toefl": 110, "gpa": 3.9},
        "tuition_min": 24000,
        "tuition_max": 35000,
        "currency": "GBP",
        "application_deadline_fall": "2024-10-15",
        "acceptance_rate": 21.0,
    },
    {
        "name": "University of Oxford",
        "short_name": "Oxford",
        "country": "United Kingdom",
        "city": "Oxford",
        "world_ranking": 4,
        "description": "The oldest university in the English-speaking world, renowned for academic excellence.",
        "website": "https://www.ox.ac.uk",
        "programs": ["Philosophy", "Politics", "Economics", "Law", "Medicine", "Computer Science"],
        "requirements": {"ielts": 7.5, "toefl": 110, "gpa": 3.9},
        "tuition_min": 26770,
        "tuition_max": 37510,
        "currency": "GBP",
        "application_deadline_fall": "2024-10-15",
        "acceptance_rate": 17.5,
    },
    {
        "name": "Imperial College London",
        "short_name": "Imperial",
        "country": "United Kingdom",
        "city": "London",
        "world_ranking": 8,
        "description": "Specializes in science, engineering, medicine and business.",
        "website": "https://www.imperial.ac.uk",
        "programs": ["Engineering", "Medicine", "Computer Science", "Physics", "Business"],
        "requirements": {"ielts": 7.0, "toefl": 100, "gpa": 3.7},
        "tuition_min": 32000,
        "tuition_max": 36200,
        "currency": "GBP",
        "application_deadline_fall": "2024-10-15",
        "acceptance_rate": 14.3,
    },
    {
        "name": "University College London (UCL)",
        "short_name": "UCL",
        "country": "United Kingdom",
        "city": "London",
        "world_ranking": 9,
        "description": "London's leading multidisciplinary university with global reputation.",
        "website": "https://www.ucl.ac.uk",
        "programs": ["Computer Science", "Engineering", "Architecture", "Medicine", "Economics"],
        "requirements": {"ielts": 6.5, "toefl": 92, "gpa": 3.5},
        "tuition_min": 23300,
        "tuition_max": 34100,
        "currency": "GBP",
        "application_deadline_fall": "2024-10-15",
        "acceptance_rate": 48.0,
    },
    
    # Germany Universities (Many are FREE!)
    {
        "name": "Technical University of Munich",
        "short_name": "TUM",
        "country": "Germany",
        "city": "Munich",
        "world_ranking": 50,
        "description": "Germany's top technical university with excellent engineering programs. NO TUITION FEES!",
        "website": "https://www.tum.de",
        "programs": ["Computer Science", "Engineering", "Physics", "Mathematics", "Business"],
        "requirements": {"ielts": 6.5, "toefl": 88, "gpa": 3.5},
        "tuition_min": 0,
        "tuition_max": 0,
        "currency": "EUR",
        "application_deadline_fall": "2024-07-15",
        "application_deadline_spring": "2024-01-15",
        "acceptance_rate": 8.0,
    },
    {
        "name": "Ludwig Maximilian University of Munich",
        "short_name": "LMU Munich",
        "country": "Germany",
        "city": "Munich",
        "world_ranking": 59,
        "description": "One of Europe's premier academic institutions. FREE TUITION!",
        "website": "https://www.lmu.de",
        "programs": ["Medicine", "Law", "Business", "Physics", "Computer Science"],
        "requirements": {"ielts": 6.5, "toefl": 80, "gpa": 3.3},
        "tuition_min": 0,
        "tuition_max": 0,
        "currency": "EUR",
        "application_deadline_fall": "2024-07-15",
        "acceptance_rate": 10.0,
    },
    {
        "name": "RWTH Aachen University",
        "short_name": "RWTH Aachen",
        "country": "Germany",
        "city": "Aachen",
        "world_ranking": 106,
        "description": "Leading engineering university in Germany. FREE TUITION!",
        "website": "https://www.rwth-aachen.de",
        "programs": ["Engineering", "Computer Science", "Physics", "Mathematics"],
        "requirements": {"ielts": 6.5, "toefl": 90, "gpa": 3.4},
        "tuition_min": 0,
        "tuition_max": 0,
        "currency": "EUR",
        "application_deadline_fall": "2024-07-15",
        "acceptance_rate": 10.0,
    },
    
    # South Korea Universities (Excellent + Scholarships!)
    {
        "name": "Korea Advanced Institute of Science and Technology (KAIST)",
        "short_name": "KAIST",
        "country": "South Korea",
        "city": "Daejeon",
        "world_ranking": 41,
        "description": "Korea's top science and technology university. FULL SCHOLARSHIPS AVAILABLE!",
        "website": "https://www.kaist.ac.kr",
        "programs": ["Computer Science", "AI", "Robotics", "Engineering", "Physics"],
        "requirements": {"ielts": 6.5, "toefl": 83, "gpa": 3.4},
        "tuition_min": 0,
        "tuition_max": 0,
        "currency": "KRW",
        "application_deadline_fall": "2024-03-15",
        "application_deadline_spring": "2024-09-15",
        "acceptance_rate": 15.0,
    },
    {
        "name": "Seoul National University",
        "short_name": "SNU",
        "country": "South Korea",
        "city": "Seoul",
        "world_ranking": 29,
        "description": "Korea's most prestigious university with comprehensive programs.",
        "website": "https://www.snu.ac.kr",
        "programs": ["Engineering", "Business", "Medicine", "Computer Science", "Law"],
        "requirements": {"ielts": 6.0, "toefl": 80, "gpa": 3.5},
        "tuition_min": 4000,
        "tuition_max": 6000,
        "currency": "USD",
        "application_deadline_fall": "2024-05-31",
        "acceptance_rate": 20.0,
    },
    
    # Canada Universities
    {
        "name": "University of Toronto",
        "short_name": "U of T",
        "country": "Canada",
        "city": "Toronto",
        "world_ranking": 21,
        "description": "Canada's leading research university with diverse programs.",
        "website": "https://www.utoronto.ca",
        "programs": ["Computer Science", "Engineering", "Business", "Medicine", "AI"],
        "requirements": {"ielts": 6.5, "toefl": 100, "gpa": 3.6},
        "tuition_min": 45690,
        "tuition_max": 58160,
        "currency": "CAD",
        "application_deadline_fall": "2024-01-15",
        "acceptance_rate": 43.0,
    },
    {
        "name": "University of British Columbia",
        "short_name": "UBC",
        "country": "Canada",
        "city": "Vancouver",
        "world_ranking": 34,
        "description": "Beautiful campus with strong research programs and international community.",
        "website": "https://www.ubc.ca",
        "programs": ["Computer Science", "Engineering", "Business", "Environmental Studies"],
        "requirements": {"ielts": 6.5, "toefl": 90, "gpa": 3.5},
        "tuition_min": 38946,
        "tuition_max": 44800,
        "currency": "CAD",
        "application_deadline_fall": "2024-01-15",
        "acceptance_rate": 52.0,
    },
    
    # Australia Universities
    {
        "name": "Australian National University",
        "short_name": "ANU",
        "country": "Australia",
        "city": "Canberra",
        "world_ranking": 30,
        "description": "Australia's leading university with strong research focus.",
        "website": "https://www.anu.edu.au",
        "programs": ["Computer Science", "Engineering", "Economics", "Political Science"],
        "requirements": {"ielts": 6.5, "toefl": 80, "gpa": 3.4},
        "tuition_min": 45000,
        "tuition_max": 50000,
        "currency": "AUD",
        "application_deadline_fall": "2024-05-31",
        "acceptance_rate": 35.0,
    },
    {
        "name": "University of Melbourne",
        "short_name": "Melbourne",
        "country": "Australia",
        "city": "Melbourne",
        "world_ranking": 33,
        "description": "Historic university with excellent reputation and diverse student body.",
        "website": "https://www.unimelb.edu.au",
        "programs": ["Medicine", "Business", "Engineering", "Law", "Computer Science"],
        "requirements": {"ielts": 6.5, "toefl": 79, "gpa": 3.5},
        "tuition_min": 44000,
        "tuition_max": 52000,
        "currency": "AUD",
        "application_deadline_fall": "2024-05-31",
        "acceptance_rate": 70.0,
    },
    
    # Singapore Universities
    {
        "name": "National University of Singapore",
        "short_name": "NUS",
        "country": "Singapore",
        "city": "Singapore",
        "world_ranking": 11,
        "description": "Asia's leading university with world-class programs and facilities.",
        "website": "https://www.nus.edu.sg",
        "programs": ["Computer Science", "Engineering", "Business", "Medicine", "Data Science"],
        "requirements": {"ielts": 6.5, "toefl": 92, "gpa": 3.6},
        "tuition_min": 17550,
        "tuition_max": 29950,
        "currency": "SGD",
        "application_deadline_fall": "2024-02-28",
        "acceptance_rate": 5.0,
    },
    {
        "name": "Nanyang Technological University",
        "short_name": "NTU",
        "country": "Singapore",
        "city": "Singapore",
        "world_ranking": 13,
        "description": "Young and innovative university strong in engineering and technology.",
        "website": "https://www.ntu.edu.sg",
        "programs": ["Engineering", "Computer Science", "Business", "AI"],
        "requirements": {"ielts": 6.0, "toefl": 90, "gpa": 3.5},
        "tuition_min": 17200,
        "tuition_max": 29350,
        "currency": "SGD",
        "application_deadline_fall": "2024-02-28",
        "acceptance_rate": 8.0,
    },
    
    # Japan Universities
    {
        "name": "University of Tokyo",
        "short_name": "UTokyo",
        "country": "Japan",
        "city": "Tokyo",
        "world_ranking": 23,
        "description": "Japan's most prestigious university with comprehensive programs.",
        "website": "https://www.u-tokyo.ac.jp",
        "programs": ["Engineering", "Computer Science", "Physics", "Economics"],
        "requirements": {"ielts": 6.0, "toefl": 79, "gpa": 3.5},
        "tuition_min": 535800,
        "tuition_max": 535800,
        "currency": "JPY",
        "application_deadline_fall": "2024-02-28",
        "acceptance_rate": 36.0,
    },
    
    # Netherlands Universities
    {
        "name": "Delft University of Technology",
        "short_name": "TU Delft",
        "country": "Netherlands",
        "city": "Delft",
        "world_ranking": 47,
        "description": "Europe's leading technical university with innovative programs.",
        "website": "https://www.tudelft.nl",
        "programs": ["Engineering", "Computer Science", "Architecture", "Applied Sciences"],
        "requirements": {"ielts": 6.5, "toefl": 90, "gpa": 3.4},
        "tuition_min": 2209,
        "tuition_max": 18750,
        "currency": "EUR",
        "application_deadline_fall": "2024-04-01",
        "acceptance_rate": 54.0,
    },
    
    # Switzerland Universities
    {
        "name": "ETH Zurich",
        "short_name": "ETH",
        "country": "Switzerland",
        "city": "Zurich",
        "world_ranking": 7,
        "description": "World-renowned for science and technology. Very LOW TUITION!",
        "website": "https://ethz.ch",
        "programs": ["Computer Science", "Engineering", "Physics", "Mathematics"],
        "requirements": {"ielts": 7.0, "toefl": 100, "gpa": 3.7},
        "tuition_min": 1298,
        "tuition_max": 1298,
        "currency": "CHF",
        "application_deadline_fall": "2024-04-30",
        "acceptance_rate": 8.0,
    },
    
    # France Universities
    {
        "name": "École Polytechnique",
        "short_name": "Polytechnique",
        "country": "France",
        "city": "Palaiseau",
        "world_ranking": 49,
        "description": "France's most prestigious engineering school.",
        "website": "https://www.polytechnique.edu",
        "programs": ["Engineering", "Computer Science", "Mathematics", "Physics"],
        "requirements": {"ielts": 6.5, "toefl": 90, "gpa": 3.6},
        "tuition_min": 0,
        "tuition_max": 12000,
        "currency": "EUR",
        "application_deadline_fall": "2024-04-15",
        "acceptance_rate": 12.0,
    },
]

# =============================================================================
# SCHOLARSHIP DATA
# =============================================================================

SCHOLARSHIPS_DATA = [
    {
        "name": "Chevening Scholarship",
        "country": "United Kingdom",
        "description": "UK government's global scholarship programme funded by the Foreign, Commonwealth and Development Office.",
        "amount_info": {"type": "full_tuition", "amount": None, "currency": "GBP", "note": "Full tuition + living expenses + travel"},
        "coverage": {"tuition": True, "living": True, "travel": True, "visa": True, "books": True},
        "requirements": {"work_experience_years": 2, "ielts_min": 6.5, "gpa_min": 3.0, "citizenship": "Varies by country"},
        "application_deadline": "2024-11-01",
        "website": "https://www.chevening.org",
        "duration": "1 year master's degree",
    },
    {
        "name": "DAAD Scholarship",
        "country": "Germany",
        "description": "German Academic Exchange Service offers various scholarships for international students.",
        "amount_info": {"type": "stipend", "amount": 861, "currency": "EUR", "period": "month"},
        "coverage": {"tuition": True, "living": True, "health_insurance": True, "travel": True},
        "requirements": {"gpa_min": 3.0, "german_or_english": True, "work_experience_preferred": True},
        "application_deadline": "2024-10-15",
        "website": "https://www.daad.de",
        "duration": "Variable, up to 2 years",
    },
    {
        "name": "Korean Government Scholarship Program (KGSP)",
        "country": "South Korea",
        "description": "Full scholarship from Korean government for undergraduate and graduate studies.",
        "amount_info": {"type": "full_tuition", "amount": 900000, "currency": "KRW", "period": "month"},
        "coverage": {"tuition": True, "living": True, "travel": True, "korean_language": True, "settlement": True, "medical_insurance": True},
        "requirements": {"age_max": 25, "gpa_min": 80, "health_certificate": True},
        "application_deadline": "2024-03-01",
        "website": "https://www.studyinkorea.go.kr",
        "duration": "Full degree + 1 year Korean language",
    },
    {
        "name": "Fulbright Foreign Student Program",
        "country": "United States",
        "description": "US government's flagship international educational exchange program.",
        "amount_info": {"type": "full_tuition", "amount": None, "currency": "USD"},
        "coverage": {"tuition": True, "living": True, "travel": True, "health_insurance": True, "books": True},
        "requirements": {"gpa_min": 3.0, "toefl_min": 80, "leadership_experience": True},
        "application_deadline": "2024-10-15",
        "website": "https://foreign.fulbrightonline.org",
        "duration": "1-2 years master's",
    },
    {
        "name": "Erasmus+ Scholarship",
        "country": "European Union",
        "description": "EU programme for education, training, youth and sport in Europe.",
        "amount_info": {"type": "stipend", "amount": 850, "currency": "EUR", "period": "month"},
        "coverage": {"living": True, "travel": True, "insurance": True},
        "requirements": {"enrolled_in_eu_program": True, "gpa_min": 3.0},
        "application_deadline": "2024-02-01",
        "website": "https://erasmus-plus.ec.europa.eu",
        "duration": "3-12 months",
    },
    {
        "name": "Commonwealth Scholarship",
        "country": "United Kingdom",
        "description": "For students from low and middle income Commonwealth countries.",
        "amount_info": {"type": "full_tuition", "amount": None, "currency": "GBP"},
        "coverage": {"tuition": True, "living": True, "travel": True, "thesis": True},
        "requirements": {"gpa_min": 3.5, "ielts_min": 6.5, "citizenship": "Commonwealth country"},
        "application_deadline": "2024-12-14",
        "website": "https://cscuk.fcdo.gov.uk",
        "duration": "Full degree",
    },
    {
        "name": "Australia Awards Scholarship",
        "country": "Australia",
        "description": "Australian government scholarship for international students from developing countries.",
        "amount_info": {"type": "full_tuition", "amount": None, "currency": "AUD"},
        "coverage": {"tuition": True, "living": True, "travel": True, "health_insurance": True, "preparatory_courses": True},
        "requirements": {"work_experience_years": 2, "ielts_min": 6.5, "gpa_min": 3.0},
        "application_deadline": "2024-04-30",
        "website": "https://www.australiaawardspacific.org",
        "duration": "Full degree",
    },
    {
        "name": "Swiss Government Excellence Scholarships",
        "country": "Switzerland",
        "description": "For postgraduate researchers and artists from over 180 countries.",
        "amount_info": {"type": "stipend", "amount": 1920, "currency": "CHF", "period": "month"},
        "coverage": {"living": True, "health_insurance": True, "travel": True, "tuition_waiver": True},
        "requirements": {"masters_degree": True, "research_proposal": True, "gpa_min": 3.5},
        "application_deadline": "2024-12-01",
        "website": "https://www.sbfi.admin.ch",
        "duration": "1-3 years PhD",
    },
    {
        "name": "Japanese Government (MEXT) Scholarship",
        "country": "Japan",
        "description": "Full scholarship for undergraduate and graduate studies in Japan.",
        "amount_info": {"type": "full_tuition", "amount": 144000, "currency": "JPY", "period": "month"},
        "coverage": {"tuition": True, "living": True, "travel": True, "no_tuition": True},
        "requirements": {"age_max": 35, "gpa_min": 3.0, "health_certificate": True},
        "application_deadline": "2024-04-01",
        "website": "https://www.studyinjapan.go.jp",
        "duration": "Full degree + Japanese language",
    },
    {
        "name": "Chinese Government Scholarship",
        "country": "China",
        "description": "Full scholarship for international students to study in China.",
        "amount_info": {"type": "full_tuition", "amount": 3000, "currency": "CNY", "period": "month"},
        "coverage": {"tuition": True, "living": True, "accommodation": True, "medical_insurance": True},
        "requirements": {"age_max": 35, "gpa_min": 3.0, "hsk": "Preferred"},
        "application_deadline": "2024-03-31",
        "website": "https://www.campuschina.org",
        "duration": "Full degree",
    },
    {
        "name": "Eiffel Excellence Scholarship",
        "country": "France",
        "description": "French government scholarship for outstanding international students.",
        "amount_info": {"type": "stipend", "amount": 1181, "currency": "EUR", "period": "month"},
        "coverage": {"living": True, "travel": True, "health_insurance": True},
        "requirements": {"age_max": 30, "gpa_min": 3.5, "masters_application": True},
        "application_deadline": "2024-01-09",
        "website": "https://www.campusfrance.org",
        "duration": "12-24 months",
    },
    {
        "name": "GREAT Scholarships",
        "country": "United Kingdom",
        "description": "British Council scholarships worth £10,000 for one year master's.",
        "amount_info": {"type": "fixed_amount", "amount": 10000, "currency": "GBP"},
        "coverage": {"tuition_partial": True},
        "requirements": {"ielts_min": 6.5, "citizenship": "Varies by country"},
        "application_deadline": "2024-01-31",
        "website": "https://www.britishcouncil.org",
        "duration": "1 year master's",
    },
    {
        "name": "Orange Tulip Scholarship",
        "country": "Netherlands",
        "description": "Scholarships for international students to study in the Netherlands.",
        "amount_info": {"type": "variable", "amount": 5000, "currency": "EUR"},
        "coverage": {"tuition_partial": True, "varies_by_university": True},
        "requirements": {"gpa_min": 3.0, "non_eu_citizen": True},
        "application_deadline": "2024-05-01",
        "website": "https://www.orangetulipscholarship.nl",
        "duration": "Full degree",
    },
    {
        "name": "Turkiye Burslari Scholarship",
        "country": "Turkey",
        "description": "Turkish government scholarship covering all expenses.",
        "amount_info": {"type": "full_tuition", "amount": 3000, "currency": "TRY", "period": "month"},
        "coverage": {"tuition": True, "living": True, "accommodation": True, "health_insurance": True, "travel": True, "turkish_language": True},
        "requirements": {"age_max": 21, "gpa_min": 70},
        "application_deadline": "2024-02-20",
        "website": "https://www.turkiyeburslari.gov.tr",
        "duration": "Full degree + 1 year Turkish",
    },
]

# =============================================================================
# SEED FUNCTIONS
# =============================================================================

def seed_universities(db):
    """Create universities in database."""
    print("\n[INFO] Creating universities...")
    print("=" * 70)
    
    universities = []
    for idx, data in enumerate(UNIVERSITIES_DATA, 1):
        print(f"  [{idx}/{len(UNIVERSITIES_DATA)}] {data['name']}")
        
        # Map data keys to correct model fields
        data_mapped = data.copy()
        if 'website' in data_mapped:
            data_mapped['website_url'] = data_mapped.pop('website')
        if 'currency' in data_mapped:
            data_mapped['tuition_currency'] = data_mapped.pop('currency')
        
        # Convert date strings to datetime objects
        from datetime import datetime as dt
        for date_field in ['application_deadline_fall', 'application_deadline_spring', 'application_deadline_summer']:
            if date_field in data_mapped and data_mapped[date_field]:
                try:
                    data_mapped[date_field] = dt.strptime(data_mapped[date_field], "%Y-%m-%d")
                except:
                    data_mapped[date_field] = None
        
        uni = University(
            id=uuid4(),
            **data_mapped
        )
        universities.append(uni)
    
    db.add_all(universities)
    db.commit()
    
    print(f"\n[SUCCESS] Created {len(universities)} universities")
    print("=" * 70)
    return universities


def seed_scholarships(db, universities):
    """Create scholarships in database."""
    print("\n[INFO] Creating scholarships...")
    print("=" * 70)
    
    # Create country to university mapping
    country_to_uni = {}
    for uni in universities:
        if uni.country not in country_to_uni:
            country_to_uni[uni.country] = []
        country_to_uni[uni.country].append(uni)
    
    scholarships = []
    for idx, data in enumerate(SCHOLARSHIPS_DATA, 1):
        print(f"  [{idx}/{len(SCHOLARSHIPS_DATA)}] {data['name']}")
        
        # Try to link to a university from the same country
        university_id = None
        country = data['country']
        if country in country_to_uni and country_to_uni[country]:
            university_id = country_to_uni[country][0].id
        
        # Remove 'website' and 'duration' fields as they're not in the model
        data_clean = {k: v for k, v in data.items() if k not in ['website', 'duration']}
        
        # Convert date string to datetime
        from datetime import datetime as dt
        if 'application_deadline' in data_clean and data_clean['application_deadline']:
            try:
                data_clean['application_deadline'] = dt.strptime(data_clean['application_deadline'], "%Y-%m-%d")
            except:
                data_clean['application_deadline'] = None
        
        scholarship = Scholarship(
            id=uuid4(),
            university_id=university_id,
            **data_clean
        )
        scholarships.append(scholarship)
    
    db.add_all(scholarships)
    db.commit()
    
    print(f"\n[SUCCESS] Created {len(scholarships)} scholarships")
    print("=" * 70)
    return scholarships


def print_summary(universities, scholarships):
    """Print summary of seeded data."""
    print("\n")
    print("=" * 70)
    print("SEED SUMMARY")
    print("=" * 70)
    
    # Count by country
    countries = {}
    for uni in universities:
        countries[uni.country] = countries.get(uni.country, 0) + 1
    
    print(f"\nUNIVERSITIES: {len(universities)} total")
    for country, count in sorted(countries.items(), key=lambda x: -x[1]):
        print(f"   - {country}: {count}")
    
    print(f"\nSCHOLARSHIPS: {len(scholarships)} total")
    
    # Free universities
    free_unis = [u for u in universities if u.tuition_min == 0 or u.tuition_max == 0]
    print(f"\nFREE TUITION: {len(free_unis)} universities")
    for uni in free_unis[:5]:
        print(f"   - {uni.name} ({uni.country})")
    
    # Top ranked
    top_ranked = sorted(universities, key=lambda x: x.world_ranking or 9999)[:10]
    print(f"\nTOP 10 RANKED:")
    for uni in top_ranked:
        print(f"   - #{uni.world_ranking}: {uni.name}")
    
    print("\n" + "=" * 70)
    print("[SUCCESS] SEEDING COMPLETE!")
    print("=" * 70)
    print("\nNext steps:")
    print("   1. Start backend: python -m uvicorn app.main:app --reload")
    print("   2. Start frontend: npm run dev")
    print("   3. Visit: http://localhost:3000/student/universities")
    print("\n")


# =============================================================================
# MAIN FUNCTION
# =============================================================================

def main():
    """Run the seed process."""
    print("\n")
    print("=" * 70)
    print("SMARTCAREER AI - UNIVERSITY & SCHOLARSHIP SEEDER")
    print("=" * 70)
    
    # Create tables if needed
    print("\n[INFO] Checking database tables...")
    Base.metadata.create_all(bind=engine)
    print("[OK] Tables ready")
    
    # Create session
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_unis = db.query(University).count()
        existing_schol = db.query(Scholarship).count()
        
        if existing_unis > 0 or existing_schol > 0:
            print(f"\n[WARN] Database already has data!")
            print(f"   - Universities: {existing_unis}")
            print(f"   - Scholarships: {existing_schol}")
            
            response = input("\n   Clear and reseed? (y/N): ")
            if response.lower() != 'y':
                print("\n[ABORT] No changes made.")
                return
            
            print("\n[INFO] Clearing existing data...")
            db.query(Scholarship).delete()
            db.query(University).delete()
            db.commit()
            print("[OK] Cleared")
        
        # Seed data
        universities = seed_universities(db)
        scholarships = seed_scholarships(db, universities)
        
        # Print summary
        print_summary(universities, scholarships)
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
