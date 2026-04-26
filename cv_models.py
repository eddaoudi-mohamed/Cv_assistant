from pydantic import BaseModel, EmailStr
from typing import List, Optional

class Education(BaseModel):
    institution: str
    degree: str
    field: str
    graduation_year: str
    gpa: Optional[str] = None

class Experience(BaseModel):
    company: str
    position: str
    start_date: str
    end_date: str
    location: Optional[str] = None
    description: str

class Project(BaseModel):
    title: str
    description: str
    technologies: List[str]
    link: Optional[str] = None

class Skill(BaseModel):
    category: str
    skills: List[str]

class CVProfile(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None
    professional_summary: Optional[str] = None
    education: List[Education]
    experience: List[Experience]
    projects: List[Project]
    skills: List[Skill]
    certifications: Optional[List[str]] = None
