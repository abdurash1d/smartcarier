"""
Safe startup seed helpers.

This module is intentionally idempotent:
- never wipes tables
- never mutates existing jobs
- only appends missing active jobs when below a configured minimum
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models import Job, JobStatus, User, UserRole

logger = logging.getLogger(__name__)


_SEED_JOB_BLUEPRINTS = [
    {
        "title": "Junior Frontend Developer",
        "company_name": "Mohirdev",
        "description": "Help build modern learner-facing web experiences.",
        "requirements": ["HTML/CSS", "JavaScript", "React basics"],
        "responsibilities": ["Implement UI components", "Fix bugs", "Collaborate with mentors"],
        "salary_min": 800,
        "salary_max": 1500,
        "location": "Tashkent, Uzbekistan",
        "job_type": "full_time",
        "experience_level": "junior",
    },
    {
        "title": "QA Automation Engineer",
        "company_name": "Uzcard",
        "description": "Build and maintain automated testing pipelines.",
        "requirements": ["API testing", "Python or JS", "CI/CD basics"],
        "responsibilities": ["Automate tests", "Track regressions", "Improve test coverage"],
        "salary_min": 1800,
        "salary_max": 3000,
        "location": "Tashkent, Uzbekistan",
        "job_type": "full_time",
        "experience_level": "mid",
    },
    {
        "title": "HR Business Partner",
        "company_name": "EPAM Systems",
        "description": "Own hiring and people operations for engineering teams.",
        "requirements": ["HR experience", "Recruiting", "Stakeholder communication"],
        "responsibilities": ["Drive hiring", "Support managers", "Improve retention"],
        "salary_min": 1200,
        "salary_max": 2200,
        "location": "Tashkent, Uzbekistan",
        "job_type": "full_time",
        "experience_level": "mid",
    },
    {
        "title": "Data Analyst",
        "company_name": "Click",
        "description": "Analyze user and payment behavior to improve product decisions.",
        "requirements": ["SQL", "Excel", "Dashboarding"],
        "responsibilities": ["Create reports", "Monitor KPIs", "Support product teams"],
        "salary_min": 1300,
        "salary_max": 2400,
        "location": "Tashkent, Uzbekistan",
        "job_type": "hybrid",
        "experience_level": "mid",
    },
    {
        "title": "DevOps Engineer",
        "company_name": "CareerUZ Platform",
        "description": "Maintain cloud infrastructure and deployment reliability.",
        "requirements": ["Docker", "Linux", "Monitoring"],
        "responsibilities": ["Manage CI/CD", "Improve uptime", "Harden environments"],
        "salary_min": 2000,
        "salary_max": 3800,
        "location": "Remote",
        "job_type": "remote",
        "experience_level": "mid",
    },
    {
        "title": "Product Designer",
        "company_name": "Uzum",
        "description": "Design seamless user flows for job seekers and recruiters.",
        "requirements": ["Figma", "UX research", "Design systems"],
        "responsibilities": ["Design flows", "Prototype quickly", "Collaborate with PM/engineering"],
        "salary_min": 1200,
        "salary_max": 2500,
        "location": "Tashkent, Uzbekistan",
        "job_type": "hybrid",
        "experience_level": "mid",
    },
    {
        "title": "Customer Support Specialist",
        "company_name": "Beeline Uzbekistan",
        "description": "Support customers across chat and phone channels.",
        "requirements": ["Communication", "CRM tools", "Uzbek/Russian fluency"],
        "responsibilities": ["Resolve tickets", "Escalate incidents", "Improve response quality"],
        "salary_min": 500,
        "salary_max": 900,
        "location": "Tashkent, Uzbekistan",
        "job_type": "full_time",
        "experience_level": "junior",
    },
    {
        "title": "Backend Python Engineer",
        "company_name": "Inha Digital Lab",
        "description": "Build scalable backend APIs for career products.",
        "requirements": ["Python", "FastAPI", "PostgreSQL"],
        "responsibilities": ["Design APIs", "Write tests", "Optimize performance"],
        "salary_min": 1700,
        "salary_max": 3200,
        "location": "Tashkent, Uzbekistan",
        "job_type": "full_time",
        "experience_level": "mid",
    },
    {
        "title": "Accountant",
        "company_name": "Korzinka",
        "description": "Handle financial operations and reporting processes.",
        "requirements": ["1C", "Financial reporting", "Reconciliation"],
        "responsibilities": ["Prepare reports", "Close monthly books", "Maintain ledgers"],
        "salary_min": 700,
        "salary_max": 1300,
        "location": "Tashkent, Uzbekistan",
        "job_type": "full_time",
        "experience_level": "mid",
    },
    {
        "title": "Sales Manager",
        "company_name": "Coca-Cola Uzbekistan",
        "description": "Grow key accounts and improve regional sales pipeline.",
        "requirements": ["B2B sales", "Negotiation", "CRM"],
        "responsibilities": ["Own pipeline", "Meet targets", "Build long-term partnerships"],
        "salary_min": 900,
        "salary_max": 1800,
        "location": "Samarkand, Uzbekistan",
        "job_type": "full_time",
        "experience_level": "mid",
    },
]


def _get_or_create_seed_company(db: Session) -> User:
    company = db.query(User).filter(User.role == UserRole.COMPANY).first()
    if company:
        return company

    company = User(
        id=uuid4(),
        email=settings.AUTO_SEED_COMPANY_EMAIL.strip().lower(),
        full_name=settings.AUTO_SEED_COMPANY_MANAGER_NAME,
        role=UserRole.COMPANY,
        company_name=settings.AUTO_SEED_COMPANY_NAME,
        company_website=settings.AUTO_SEED_COMPANY_WEBSITE,
        is_active_account=True,
        is_verified=True,
    )
    company.set_password(settings.AUTO_SEED_COMPANY_PASSWORD)
    db.add(company)
    db.commit()
    db.refresh(company)
    logger.info("Auto-seed company created: %s", company.email)
    return company


def ensure_minimum_active_jobs(db: Session, min_active_jobs: int) -> int:
    if min_active_jobs <= 0:
        return 0

    active_jobs = (
        db.query(Job)
        .filter(Job.status == JobStatus.ACTIVE.value, Job.is_deleted.is_(False))
        .count()
    )
    if active_jobs >= min_active_jobs:
        logger.info(
            "Auto-seed skipped: active jobs already satisfy minimum (%s >= %s)",
            active_jobs,
            min_active_jobs,
        )
        return 0

    company = _get_or_create_seed_company(db)
    created = 0

    for item in _SEED_JOB_BLUEPRINTS:
        if active_jobs + created >= min_active_jobs:
            break

        exists = (
            db.query(Job)
            .filter(
                Job.company_id == company.id,
                Job.title == item["title"],
                Job.location == item["location"],
                Job.status == JobStatus.ACTIVE.value,
                Job.is_deleted.is_(False),
            )
            .first()
        )
        if exists:
            continue

        job = Job(
            id=uuid4(),
            company_id=company.id,
            title=item["title"],
            description=item["description"],
            requirements=item["requirements"],
            responsibilities=item["responsibilities"],
            benefits=["Health insurance", "Flexible schedule", "Growth opportunities"],
            salary_min=item["salary_min"],
            salary_max=item["salary_max"],
            salary_currency="USD",
            location=item["location"],
            is_remote_allowed=item["job_type"] in {"remote", "hybrid"},
            job_type=item["job_type"],
            experience_level=item["experience_level"],
            status=JobStatus.ACTIVE.value,
            views_count=0,
            applications_count=0,
            expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
        db.add(job)
        created += 1

    if created > 0:
        db.commit()
    logger.info("Auto-seed jobs created: %s", created)
    return created


def run_startup_auto_seed() -> None:
    if not settings.AUTO_SEED_ENABLED:
        return

    db = SessionLocal()
    try:
        ensure_minimum_active_jobs(db, settings.AUTO_SEED_MIN_ACTIVE_JOBS)
    except Exception as exc:
        db.rollback()
        logger.error("Auto-seed failed: %s", exc)
    finally:
        db.close()
