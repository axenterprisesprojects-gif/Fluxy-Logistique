from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx
import math

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ========================
# MODELS
# ========================

# User Models
class User(BaseModel):
    user_id: str
    email: Optional[str] = None
    phone: Optional[str] = None
    name: str
    picture: Optional[str] = None
    role: str  # business, driver, admin
    created_at: datetime
    is_validated: bool = False
    # Business specific
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    business_lat: Optional[float] = None
    business_lng: Optional[float] = None
    # Driver specific
    vehicle_type: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_brand: Optional[str] = None
    accepted_item_types: Optional[List[str]] = []
    refused_item_types: Optional[List[str]] = []
    documents: Optional[List[dict]] = []

class BusinessRegister(BaseModel):
    business_name: str
    business_address: str
    business_lat: Optional[float] = None
    business_lng: Optional[float] = None

class DriverLogin(BaseModel):
    phone: str
    name: Optional[str] = None

class DriverProfile(BaseModel):
    name: str
    vehicle_type: str
    vehicle_plate: str
    vehicle_brand: str
    accepted_item_types: List[str] = []
    refused_item_types: List[str] = []

class DriverDocument(BaseModel):
    document_type: str  # license, insurance, vehicle_registration
    document_image: str  # base64

# Session Models
class UserSession(BaseModel):
    session_id: str
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class SessionDataResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    session_token: str

# Pricing Models
class PricingRule(BaseModel):
    rule_id: str = Field(default_factory=lambda: f"rule_{uuid.uuid4().hex[:12]}")
    min_distance: float  # km
    max_distance: float  # km
    price: float  # in local currency (F)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PricingRuleCreate(BaseModel):
    min_distance: float
    max_distance: float
    price: float

class PlatformSettings(BaseModel):
    commission_percentage: float = 15.0  # Default 15%
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Delivery Models
class DeliveryRequest(BaseModel):
    delivery_id: str = Field(default_factory=lambda: f"del_{uuid.uuid4().hex[:12]}")
    business_id: str
    business_name: str
    pickup_address: str
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    destination_area: str
    destination_lat: Optional[float] = None
    destination_lng: Optional[float] = None
    item_type: str
    time_slot: str  # ASAP, 1-2h, 2-4h, 4-8h
    distance_km: float = 0.0
    total_price: float = 0.0
    commission: float = 0.0
    driver_earnings: float = 0.0
    status: str = "pending"  # pending, accepted, pickup_confirmed, delivered, cancelled
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    pickup_photo: Optional[str] = None
    delivery_photo: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    accepted_at: Optional[datetime] = None
    pickup_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None

class DeliveryRequestCreate(BaseModel):
    destination_area: str
    destination_lat: Optional[float] = None
    destination_lng: Optional[float] = None
    item_type: str
    time_slot: str

class DeliveryConfirmPhoto(BaseModel):
    photo: str  # base64

# ========================
# AUTHENTICATION HELPERS
# ========================

async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token (cookie or header)"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        return None
    
    # Check expiration with timezone awareness
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if user_doc:
        return User(**user_doc)
    return None

async def require_user(request: Request) -> User:
    """Require authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Non authentifié")
    return user

async def require_business(request: Request) -> User:
    """Require business user"""
    user = await require_user(request)
    if user.role != "business":
        raise HTTPException(status_code=403, detail="Accès réservé aux entreprises")
    return user

async def require_driver(request: Request) -> User:
    """Require driver user"""
    user = await require_user(request)
    if user.role != "driver":
        raise HTTPException(status_code=403, detail="Accès réservé aux chauffeurs")
    return user

async def require_admin(request: Request) -> User:
    """Require admin user"""
    user = await require_user(request)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    return user

# ========================
# UTILITY FUNCTIONS
# ========================

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points using Haversine formula (in km)"""
    if not all([lat1, lng1, lat2, lng2]):
        return 5.0  # Default distance if coordinates not provided
    
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return round(R * c, 2)

async def calculate_price(distance_km: float) -> dict:
    """Calculate price based on distance and pricing rules"""
    # Get pricing rules sorted by min_distance
    rules = await db.pricing_rules.find({}, {"_id": 0}).sort("min_distance", 1).to_list(100)
    
    # Default price if no rules
    if not rules:
        base_price = 10000  # Default price
    else:
        # Find matching rule
        base_price = 10000
        for rule in rules:
            if rule["min_distance"] <= distance_km < rule["max_distance"]:
                base_price = rule["price"]
                break
            elif distance_km >= rule["max_distance"]:
                base_price = rule["price"]  # Use highest rule
    
    # Get commission percentage
    settings = await db.platform_settings.find_one({"setting_type": "commission"}, {"_id": 0})
    commission_pct = settings.get("commission_percentage", 15.0) if settings else 15.0
    
    commission = round(base_price * commission_pct / 100, 0)
    driver_earnings = base_price - commission
    
    return {
        "total_price": base_price,
        "commission": commission,
        "driver_earnings": driver_earnings
    }

# ========================
# AUTH ENDPOINTS
# ========================

@api_router.post("/auth/google/callback")
async def google_auth_callback(request: Request, response: Response):
    """Exchange session_id for session data from Emergent Auth"""
    body = await request.json()
    session_id = body.get("session_id")
    role = body.get("role", "business")  # business or admin
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id requis")
    
    # Exchange session_id with Emergent Auth
    async with httpx.AsyncClient() as client_http:
        resp = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Session invalide")
        
        user_data = resp.json()
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update role if admin
        if role == "admin" and existing_user.get("role") != "admin":
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"role": role}}
            )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "role": role,
            "is_validated": True if role == "business" else False,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(new_user)
    
    # Create session
    session_token = user_data["session_token"]
    from datetime import timedelta
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "session_id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Get updated user
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {"user": user, "session_token": session_token}

@api_router.post("/auth/driver/login")
async def driver_login(data: DriverLogin, response: Response):
    """Login driver with phone number (no OTP for MVP)"""
    phone = data.phone.strip()
    
    # Check if driver exists
    existing_driver = await db.users.find_one({"phone": phone, "role": "driver"}, {"_id": 0})
    
    if existing_driver:
        user_id = existing_driver["user_id"]
    else:
        # Create new driver
        user_id = f"driver_{uuid.uuid4().hex[:12]}"
        new_driver = {
            "user_id": user_id,
            "phone": phone,
            "name": data.name or f"Chauffeur {phone[-4:]}",
            "role": "driver",
            "is_validated": False,
            "created_at": datetime.now(timezone.utc),
            "accepted_item_types": [],
            "refused_item_types": [],
            "documents": []
        }
        await db.users.insert_one(new_driver)
    
    # Create session
    session_token = f"driver_session_{uuid.uuid4().hex}"
    from datetime import timedelta
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "session_id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    driver = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {"user": driver, "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(user: User = Depends(require_user)):
    """Get current user data"""
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Déconnexion réussie"}

# ========================
# BUSINESS ENDPOINTS
# ========================

@api_router.put("/business/profile")
async def update_business_profile(data: BusinessRegister, user: User = Depends(require_business)):
    """Update business profile"""
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "business_name": data.business_name,
            "business_address": data.business_address,
            "business_lat": data.business_lat,
            "business_lng": data.business_lng
        }}
    )
    
    updated_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return updated_user

@api_router.post("/business/delivery")
async def create_delivery(data: DeliveryRequestCreate, user: User = Depends(require_business)):
    """Create a new delivery request"""
    # Check if business profile is complete
    if not user.business_address:
        raise HTTPException(status_code=400, detail="Veuillez compléter votre profil d'entreprise")
    
    # Calculate distance
    distance = calculate_distance(
        user.business_lat or 0, user.business_lng or 0,
        data.destination_lat or 0, data.destination_lng or 0
    )
    
    # Calculate price
    pricing = await calculate_price(distance)
    
    delivery = DeliveryRequest(
        business_id=user.user_id,
        business_name=user.business_name or user.name,
        pickup_address=user.business_address,
        pickup_lat=user.business_lat,
        pickup_lng=user.business_lng,
        destination_area=data.destination_area,
        destination_lat=data.destination_lat,
        destination_lng=data.destination_lng,
        item_type=data.item_type,
        time_slot=data.time_slot,
        distance_km=distance,
        total_price=pricing["total_price"],
        commission=pricing["commission"],
        driver_earnings=pricing["driver_earnings"]
    )
    
    await db.delivery_requests.insert_one(delivery.dict())
    
    return delivery

@api_router.get("/business/deliveries")
async def get_business_deliveries(user: User = Depends(require_business)):
    """Get all deliveries for a business"""
    deliveries = await db.delivery_requests.find(
        {"business_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return deliveries

# ========================
# DRIVER ENDPOINTS
# ========================

@api_router.put("/driver/profile")
async def update_driver_profile(data: DriverProfile, user: User = Depends(require_driver)):
    """Update driver profile"""
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "name": data.name,
            "vehicle_type": data.vehicle_type,
            "vehicle_plate": data.vehicle_plate,
            "vehicle_brand": data.vehicle_brand,
            "accepted_item_types": data.accepted_item_types,
            "refused_item_types": data.refused_item_types
        }}
    )
    
    updated_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return updated_user

@api_router.post("/driver/document")
async def upload_driver_document(data: DriverDocument, user: User = Depends(require_driver)):
    """Upload driver document"""
    document = {
        "document_id": f"doc_{uuid.uuid4().hex[:12]}",
        "document_type": data.document_type,
        "document_image": data.document_image,
        "status": "pending",
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$push": {"documents": document}}
    )
    
    return document

@api_router.get("/driver/available-jobs")
async def get_available_jobs(user: User = Depends(require_driver)):
    """Get available delivery jobs for driver"""
    # Get jobs matching driver's accepted item types
    query = {"status": "pending"}
    
    if user.accepted_item_types:
        query["item_type"] = {"$in": user.accepted_item_types}
    if user.refused_item_types:
        query["item_type"] = {"$nin": user.refused_item_types}
    
    jobs = await db.delivery_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return jobs

@api_router.get("/driver/my-jobs")
async def get_driver_jobs(user: User = Depends(require_driver)):
    """Get driver's accepted jobs"""
    jobs = await db.delivery_requests.find(
        {"driver_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return jobs

@api_router.post("/driver/accept/{delivery_id}")
async def accept_delivery(delivery_id: str, user: User = Depends(require_driver)):
    """Accept a delivery job (first-come-first-serve)"""
    # Check if driver is validated
    if not user.is_validated:
        raise HTTPException(status_code=403, detail="Votre profil n'est pas encore validé")
    
    # Try to accept the job (atomic operation)
    result = await db.delivery_requests.update_one(
        {"delivery_id": delivery_id, "status": "pending"},
        {"$set": {
            "status": "accepted",
            "driver_id": user.user_id,
            "driver_name": user.name,
            "accepted_at": datetime.now(timezone.utc)
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Cette livraison n'est plus disponible")
    
    delivery = await db.delivery_requests.find_one({"delivery_id": delivery_id}, {"_id": 0})
    return delivery

@api_router.post("/driver/confirm-pickup/{delivery_id}")
async def confirm_pickup(delivery_id: str, data: DeliveryConfirmPhoto, user: User = Depends(require_driver)):
    """Confirm pickup with photo"""
    result = await db.delivery_requests.update_one(
        {"delivery_id": delivery_id, "driver_id": user.user_id, "status": "accepted"},
        {"$set": {
            "status": "pickup_confirmed",
            "pickup_photo": data.photo,
            "pickup_at": datetime.now(timezone.utc)
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Impossible de confirmer la récupération")
    
    delivery = await db.delivery_requests.find_one({"delivery_id": delivery_id}, {"_id": 0})
    return delivery

@api_router.post("/driver/confirm-delivery/{delivery_id}")
async def confirm_delivery(delivery_id: str, data: DeliveryConfirmPhoto, user: User = Depends(require_driver)):
    """Confirm delivery with photo"""
    result = await db.delivery_requests.update_one(
        {"delivery_id": delivery_id, "driver_id": user.user_id, "status": "pickup_confirmed"},
        {"$set": {
            "status": "delivered",
            "delivery_photo": data.photo,
            "delivered_at": datetime.now(timezone.utc)
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Impossible de confirmer la livraison")
    
    delivery = await db.delivery_requests.find_one({"delivery_id": delivery_id}, {"_id": 0})
    return delivery

# ========================
# ADMIN ENDPOINTS
# ========================

@api_router.get("/admin/dashboard")
async def admin_dashboard(user: User = Depends(require_admin)):
    """Get admin dashboard stats"""
    total_deliveries = await db.delivery_requests.count_documents({})
    pending_deliveries = await db.delivery_requests.count_documents({"status": "pending"})
    active_deliveries = await db.delivery_requests.count_documents({"status": {"$in": ["accepted", "pickup_confirmed"]}})
    completed_deliveries = await db.delivery_requests.count_documents({"status": "delivered"})
    
    total_drivers = await db.users.count_documents({"role": "driver"})
    pending_drivers = await db.users.count_documents({"role": "driver", "is_validated": False})
    
    total_businesses = await db.users.count_documents({"role": "business"})
    
    # Calculate total revenue (commission)
    pipeline = [
        {"$match": {"status": "delivered"}},
        {"$group": {"_id": None, "total_commission": {"$sum": "$commission"}}}
    ]
    revenue_result = await db.delivery_requests.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total_commission"] if revenue_result else 0
    
    return {
        "deliveries": {
            "total": total_deliveries,
            "pending": pending_deliveries,
            "active": active_deliveries,
            "completed": completed_deliveries
        },
        "drivers": {
            "total": total_drivers,
            "pending_validation": pending_drivers
        },
        "businesses": {
            "total": total_businesses
        },
        "revenue": {
            "total_commission": total_revenue
        }
    }

@api_router.get("/admin/deliveries")
async def admin_get_deliveries(status: Optional[str] = None, user: User = Depends(require_admin)):
    """Get all deliveries with optional status filter"""
    query = {}
    if status:
        query["status"] = status
    
    deliveries = await db.delivery_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return deliveries

@api_router.get("/admin/drivers")
async def admin_get_drivers(validated: Optional[bool] = None, user: User = Depends(require_admin)):
    """Get all drivers"""
    query = {"role": "driver"}
    if validated is not None:
        query["is_validated"] = validated
    
    drivers = await db.users.find(query, {"_id": 0}).to_list(500)
    return drivers

@api_router.post("/admin/validate-driver/{user_id}")
async def validate_driver(user_id: str, user: User = Depends(require_admin)):
    """Validate a driver"""
    result = await db.users.update_one(
        {"user_id": user_id, "role": "driver"},
        {"$set": {"is_validated": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Chauffeur non trouvé")
    
    driver = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return driver

@api_router.get("/admin/businesses")
async def admin_get_businesses(user: User = Depends(require_admin)):
    """Get all businesses"""
    businesses = await db.users.find({"role": "business"}, {"_id": 0}).to_list(500)
    return businesses

# Pricing Management
@api_router.get("/admin/pricing")
async def get_pricing_rules(user: User = Depends(require_admin)):
    """Get all pricing rules"""
    rules = await db.pricing_rules.find({}, {"_id": 0}).sort("min_distance", 1).to_list(100)
    settings = await db.platform_settings.find_one({"setting_type": "commission"}, {"_id": 0})
    
    return {
        "rules": rules,
        "commission_percentage": settings.get("commission_percentage", 15.0) if settings else 15.0
    }

@api_router.post("/admin/pricing")
async def create_pricing_rule(data: PricingRuleCreate, user: User = Depends(require_admin)):
    """Create a new pricing rule"""
    rule = PricingRule(
        min_distance=data.min_distance,
        max_distance=data.max_distance,
        price=data.price
    )
    
    await db.pricing_rules.insert_one(rule.dict())
    return rule

@api_router.put("/admin/pricing/{rule_id}")
async def update_pricing_rule(rule_id: str, data: PricingRuleCreate, user: User = Depends(require_admin)):
    """Update a pricing rule"""
    result = await db.pricing_rules.update_one(
        {"rule_id": rule_id},
        {"$set": {
            "min_distance": data.min_distance,
            "max_distance": data.max_distance,
            "price": data.price,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Règle non trouvée")
    
    rule = await db.pricing_rules.find_one({"rule_id": rule_id}, {"_id": 0})
    return rule

@api_router.delete("/admin/pricing/{rule_id}")
async def delete_pricing_rule(rule_id: str, user: User = Depends(require_admin)):
    """Delete a pricing rule"""
    result = await db.pricing_rules.delete_one({"rule_id": rule_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Règle non trouvée")
    
    return {"message": "Règle supprimée"}

@api_router.put("/admin/commission")
async def update_commission(commission_percentage: float, user: User = Depends(require_admin)):
    """Update platform commission percentage"""
    await db.platform_settings.update_one(
        {"setting_type": "commission"},
        {"$set": {
            "commission_percentage": commission_percentage,
            "updated_at": datetime.now(timezone.utc)
        }},
        upsert=True
    )
    
    return {"commission_percentage": commission_percentage}

# ========================
# PUBLIC ENDPOINTS
# ========================

@api_router.get("/")
async def root():
    return {"message": "QuickHaul API - Livraison d'articles lourds"}

@api_router.get("/item-types")
async def get_item_types():
    """Get available item types"""
    return [
        {"id": "meubles", "label": "Meubles"},
        {"id": "electromenager", "label": "Électroménager"},
        {"id": "materiaux", "label": "Matériaux de construction"},
        {"id": "equipements", "label": "Équipements industriels"},
        {"id": "colis_lourds", "label": "Colis lourds"},
        {"id": "autres", "label": "Autres"}
    ]

@api_router.get("/time-slots")
async def get_time_slots():
    """Get available time slots"""
    return [
        {"id": "asap", "label": "Dès que possible"},
        {"id": "1-2h", "label": "1 à 2 heures"},
        {"id": "2-4h", "label": "2 à 4 heures"},
        {"id": "4-8h", "label": "4 à 8 heures"}
    ]

# Include the router in the main app
app.include_router(api_router)

# Serve admin panel
@app.get("/admin")
async def admin_panel():
    """Serve admin panel"""
    return FileResponse(ROOT_DIR / "static" / "admin.html")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize database with default data"""
    # Create default pricing rules if none exist
    rules_count = await db.pricing_rules.count_documents({})
    if rules_count == 0:
        default_rules = [
            {"rule_id": "rule_1", "min_distance": 0, "max_distance": 5, "price": 20000, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
            {"rule_id": "rule_2", "min_distance": 5, "max_distance": 10, "price": 35000, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
            {"rule_id": "rule_3", "min_distance": 10, "max_distance": 20, "price": 50000, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
            {"rule_id": "rule_4", "min_distance": 20, "max_distance": 50, "price": 75000, "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)},
        ]
        await db.pricing_rules.insert_many(default_rules)
        logger.info("Default pricing rules created")
    
    # Create default commission settings if not exist
    settings = await db.platform_settings.find_one({"setting_type": "commission"})
    if not settings:
        await db.platform_settings.insert_one({
            "setting_type": "commission",
            "commission_percentage": 15.0,
            "updated_at": datetime.now(timezone.utc)
        })
        logger.info("Default commission settings created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
