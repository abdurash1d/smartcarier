#!/usr/bin/env python3
"""Quick check database data"""

from sqlalchemy import create_engine, text
from app.config import settings

engine = create_engine(str(settings.DATABASE_URL))

with engine.connect() as conn:
    # Check universities
    result = conn.execute(text('SELECT COUNT(*) FROM universities'))
    uni_count = result.scalar()
    print(f'[OK] Universities: {uni_count}')
    
    # Check scholarships  
    result = conn.execute(text('SELECT COUNT(*) FROM scholarships'))
    schol_count = result.scalar()
    print(f'[OK] Scholarships: {schol_count}')
    
    # Check users
    result = conn.execute(text('SELECT COUNT(*) FROM users'))
    user_count = result.scalar()
    print(f'[OK] Users: {user_count}')
    
    # Check jobs
    result = conn.execute(text('SELECT COUNT(*) FROM jobs'))
    job_count = result.scalar()
    print(f'[OK] Jobs: {job_count}')

print('\nDatabase Status:')
if uni_count == 0:
    print('[WARN] No universities - Run: python seed_universities.py')
else:
    print(f'[SUCCESS] {uni_count} universities ready!')

if user_count == 0:
    print('[WARN] No users - Run: python seed_data.py')
else:
    print(f'[SUCCESS] {user_count} users ready!')
