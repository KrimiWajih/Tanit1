import sys
import os
import re
import json
import pymongo
import requests
import logging
import jwt
from dotenv import load_dotenv
from bson.objectid import ObjectId

# Load environment variables
load_dotenv()
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

# Set up logging to stderr for debug messages
logging.basicConfig(level=logging.INFO, stream=sys.stderr)
logger = logging.getLogger(__name__)

# Load cities JSON
with open("cities.json", "r", encoding="utf-8") as f:
    ALL_CITIES = json.load(f)

COUNTRY_CITIES = {}
for city in ALL_CITIES:
    country_code = city["country_code"]
    if country_code not in COUNTRY_CITIES:
        COUNTRY_CITIES[country_code] = []
    COUNTRY_CITIES[country_code].append(city["name"].lower())

# MongoDB connections
def connect_to_mongo(collection_name):
    try:
        client = pymongo.MongoClient("mongodb+srv://Krimiwajih:Krimiwajih1990@softdev.ou3v7.mongodb.net/Company_DB")
        db = client["Company_DB"]
        return db[collection_name]
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        sys.exit(1)

def fetch_all_data(token=""):
    jobs_collection = connect_to_mongo("jobs")
    companies_collection = connect_to_mongo("companies")
    users_collection = connect_to_mongo("users")

    # Fetch all jobs
    jobs = list(jobs_collection.find({}))
    logger.info(f"Fetched {len(jobs)} raw jobs from MongoDB")
    enriched_jobs = []
    for job in jobs:
        company = companies_collection.find_one({"_id": ObjectId(job.get("companyid"))}) if "companyid" in job else None
        listusers = [users_collection.find_one({"_id": ObjectId(user_id)}) for user_id in job.get("listusers", [])]
        enriched_jobs.append({
            "title": job.get("title", ""),
            "location": job.get("location", ""),
            "skills": job.get("requirements", "").split(", ") if job.get("requirements") else [],
            "experience": job.get("experience", ""),
            "description": job.get("description", ""),
            "company": company["name"] if company else "Unknown Company",
            "company_details": {
                "address": company["address"] if company else "",
                "phone": company["phone"] if company else "",
                "services": company["services"] if company else [],
                "links": company["links"] if company else []
            } if company else {},
            "applicants": [
                {"name": user["name"], "email": user["email"], "skills": user["skills"]} 
                for user in listusers if user
            ]
        })
    logger.info(f"Enriched jobs sample: {json.dumps(enriched_jobs[:1], indent=2)}" if enriched_jobs else "No jobs enriched")

    # Fetch all companies
    companies = list(companies_collection.find({}))
    enriched_companies = []
    for company in companies:
        listjobs = [jobs_collection.find_one({"_id": ObjectId(job_id)}) for job_id in company.get("listjobs", [])]
        enriched_companies.append({
            "name": company["name"],
            "address": company["address"],
            "phone": company["phone"],
            "email": company["email"],
            "status": company["status"],
            "services": company["services"],
            "links": company["links"],
            "jobs": [
                {"title": job["title"], "location": job["location"]} 
                for job in listjobs if job
            ]
        })

    # Fetch all users (or just the current user if token provided)
    if token:
        try:
            decoded = jwt.decode(token, "abc123", algorithms=["HS256"])
            user_id = decoded["id"]
            user = users_collection.find_one({"_id": ObjectId(user_id)})
            enriched_users = [{
                "name": user["name"],
                "email": user["email"],
                "phone": user["phone"],
                "role": user["role"],
                "status": user["status"],
                "address": user["address"],
                "skills": user["skills"],
                "experience": user["experience"],
                "education": user["education"],
                "certificates": user["certificates"],
                "applications": [
                    {"title": jobs_collection.find_one({"_id": ObjectId(job_id)})["title"]} 
                    for job_id in user.get("applications", []) if jobs_collection.find_one({"_id": ObjectId(job_id)})
                ]
            }] if user else []
        except (jwt.InvalidTokenError, jwt.PyJWTError) as e:
            logger.error(f"Token error: {str(e)}")
            enriched_users = []
    else:
        users = list(users_collection.find({}))
        enriched_users = [
            {
                "name": user["name"],
                "email": user["email"],
                "phone": user["phone"],
                "role": user["role"],
                "status": user["status"],
                "address": user["address"],
                "skills": user["skills"],
                "experience": user["experience"],
                "education": user["education"],
                "certificates": user["certificates"],
                "applications": [
                    {"title": jobs_collection.find_one({"_id": ObjectId(job_id)})["title"]} 
                    for job_id in user.get("applications", []) if jobs_collection.find_one({"_id": ObjectId(job_id)})
                ]
            }
            for user in users
        ]

    return {
        "jobs": enriched_jobs,
        "companies": enriched_companies,
        "users": enriched_users
    }

# Call Grok-2 API via RapidAPI
def call_grok2_api(prompt):
    url = "https://grok-2-by-xai.p.rapidapi.com/"
    headers = {
        "Content-Type": "application/json",
        "x-rapidapi-host": "grok-2-by-xai.p.rapidapi.com",
        "x-rapidapi-key": RAPIDAPI_KEY
    }
    data = {
        "temperature": 1,
        "model": "Grok-2",
        "messages": [{"content": prompt, "role": "user"}],
        "max_tokens": 2048
    }
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]
    except requests.RequestException as e:
        logger.error(f"Grok-2 API error: {str(e)}")
        return f"Error calling Grok-2 API: {str(e)}"

# Extract unique categories
def extract_categories(database):
    job_types = set()
    skills = set()
    locations = set()
    companies = set()
    for entry in database["jobs"]:
        title = entry.get("title", "").lower()
        words = title.split()
        if "senior" in words or "junior" in words:
            core_type = " ".join([w for w in words if w not in ["senior", "junior"]])
        else:
            core_type = title
        job_types.add(core_type)
        for skill in entry.get("skills", []):
            skills.add(skill.lower())
        loc = entry.get("location", "").lower()
        if loc:
            locations.add(loc)
        comp = entry.get("company", "").lower()
        if comp:
            companies.add(comp)
    logger.info(f"Extracted categories - Job types: {len(job_types)}, Skills: {len(skills)}, Locations: {len(locations)}, Companies: {len(companies)}")
    return {
        "job_types": sorted(list(job_types)),
        "skills": sorted(list(skills)),
        "locations": sorted(list(locations)),
        "companies": sorted(list(companies))
    }

conversation_history = []
last_jobs = []

def generate_text(prompt, token=""):
    global last_jobs
    prompt_lower = prompt.lower()
    all_data = fetch_all_data(token)
    categories = extract_categories(all_data)
    user_data = all_data["users"][0] if all_data["users"] else None
    
    # Log initial data for debugging
    logger.info(f"Prompt: {prompt_lower}")
    logger.info(f"Total jobs fetched: {len(all_data['jobs'])}")

    # Job-related prompts
    if re.search(r"(job|work|position|coding|developer|engineer)", prompt_lower):
        matching_entries = all_data["jobs"].copy()
        has_location_request = bool(re.search(r"\bin\b", prompt_lower))
        has_company_request = bool(re.search(r"(company|firm|organization)", prompt_lower))

        # Job type filter
        job_type_match = None
        for job_type in categories["job_types"]:
            if re.search(rf"\b{re.escape(job_type)}\b", prompt_lower, re.IGNORECASE):
                job_type_match = job_type
                matching_entries = [e for e in matching_entries if job_type in e["title"].lower()]
                break
        logger.info(f"After job type filter: {len(matching_entries)} (Matched: {job_type_match})")

        # Optional coding/developer/engineer filter
        if "coding" in prompt_lower or "developer" in prompt_lower or "engineer" in prompt_lower:
            matching_entries = [e for e in matching_entries if any(term in e["title"].lower() for term in ["coding", "developer", "engineer"])]
        logger.info(f"After coding filter: {len(matching_entries)}")

        # Skill filter
        skill_match = None
        for skill in categories["skills"]:
            if re.search(rf"\b{skill}\b", prompt_lower, re.IGNORECASE):
                skill_match = skill
                matching_entries = [e for e in matching_entries if skill in [s.lower() for s in e["skills"]]]
                break
        logger.info(f"After skill filter: {len(matching_entries)} (Matched: {skill_match})")

        # Location filter
        location_match = None
        if has_location_request:
            if "tunisia" in prompt_lower:
                matching_entries = [e for e in matching_entries if e["location"].lower() in COUNTRY_CITIES["TN"] or e["location"].lower() == "tunisia"]
                if matching_entries:
                    location_match = "tunisia"
            else:
                for loc in categories["locations"]:
                    if re.search(rf"\b{re.escape(loc)}\b", prompt_lower, re.IGNORECASE):
                        location_match = loc
                        matching_entries = [e for e in matching_entries if e["location"].lower() == loc]
                        break
            logger.info(f"After location filter: {len(matching_entries)} (Matched: {location_match})")

        # Company filter
        company_match = None
        if has_company_request:
            for comp in categories["companies"]:
                if re.search(rf"\b{re.escape(comp)}\b", prompt_lower, re.IGNORECASE):
                    company_match = comp
                    matching_entries = [e for e in matching_entries if e["company"].lower() == comp]
                    break
        logger.info(f"After company filter: {len(matching_entries)} (Matched: {company_match})")

        # If no specific matches, return all jobs as a fallback for debugging
        if not matching_entries and not (job_type_match or skill_match or location_match or company_match):
            matching_entries = all_data["jobs"]
            logger.info("No specific filters matched; returning all jobs as fallback")

        if matching_entries:
            matches = matching_entries
            last_jobs = matches
            grok_prompt = f"Here are some jobs I found: {json.dumps(matches)}. Format this into a natural, conversational response."
            grok_response = call_grok2_api(grok_prompt)
            logger.info(f"Grok response for matches: {grok_response}")
            return {
                "message": f"Found {len(matches)} job(s) matching the criteria",
                "jobs": matches,
                "rawResponse": grok_response
            }
        else:
            last_jobs = []
            grok_prompt = f"No jobs found for '{prompt}'. Suggest something helpful based on available jobs: {json.dumps(all_data['jobs'])}"
            grok_response = call_grok2_api(grok_prompt)
            logger.info(f"Grok response for no matches: {grok_response}")
            return {
                "message": "No jobs found matching the criteria",
                "jobs": [],
                "rawResponse": grok_response
            }

    # Suggestion prompts
    if re.search(r"(suggest|recommend|which one)", prompt_lower) and last_jobs:
        if user_data:
            grok_prompt = f"Based on my skills {json.dumps(user_data['skills'])}, experience {json.dumps(user_data['experience'])}, and these jobs: {json.dumps(last_jobs)}, which one do you suggest? Provide a natural, conversational response."
        else:
            grok_prompt = f"From these jobs: {json.dumps(last_jobs)}, which one do you suggest? Provide a natural, conversational response."
        grok_response = call_grok2_api(grok_prompt)
        logger.info(f"Grok response for suggestion: {grok_response}")
        return {
            "message": "Job suggestion",
            "jobs": last_jobs,
            "rawResponse": grok_response
        }

    # General conversational response
    grok_prompt = f"Respond to '{prompt}' using available jobs: {json.dumps(all_data['jobs'])}"
    grok_response = call_grok2_api(grok_prompt)
    conversation_history.append(f"User: {prompt}")
    conversation_history.append(f"AI: {grok_response}")
    logger.info(f"Grok response for general prompt: {grok_response}")
    return {
        "message": "Conversational response",
        "jobs": [],
        "rawResponse": grok_response
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"message": "Error: No prompt provided", "rawResponse": "Please provide a prompt."}), file=sys.stdout)
        sys.exit(1)

    prompt = sys.argv[1]
    token = sys.argv[2] if len(sys.argv) > 2 else ""
    result = generate_text(prompt, token)
    print(json.dumps(result, indent=4), file=sys.stdout)