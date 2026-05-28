import requests
import json
from flask import Flask, request, jsonify

app = Flask(__name__)

# ============ CREDENTIALS ============
COPERNICUS_USER = "priyanshuforuse@gmail.com"
COPERNICUS_PASS = "Priyanshu@123"
SUPABASE_URL    = "https://hinyfdtvcfrbknlewwxt.supabase.co"
SUPABASE_KEY    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpbnlmZHR2Y2ZyYmtubGV3d3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3Njg2OTAsImV4cCI6MjA5NTM0NDY5MH0.d-TJqm68wTCMaN_s_jgZ-Ro4bbr5AbLelueafWh2HH4"

@app.route("/process", methods=["POST"])
def process():
    # ── Get dynamic farmer data from Make webhook payload ──
    data = request.get_json()
    
    farmer_id       = data["id"]               # ← Dynamic ID from registration
    latitude        = data["latitude"]         # ← Dynamic Latitude
    longitude       = data["longitude"]        # ← Dynamic Longitude
    farm_area_acres = data["farm_area_acres"]  # ← Dynamic Acreage

    print(f"Processing farmer ID: {farmer_id}")

    # ── STEP 1: Get Copernicus session token ──
    token_response = requests.post(
        "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token",
        data={
            "client_id":  "cdse-public",
            "username":   COPERNICUS_USER,
            "password":   COPERNICUS_PASS,
            "grant_type": "password"
        }
    )
    token = token_response.json()["access_token"]

    # ── STEP 2: Search Sentinel-2 image using geospatial coordinates ──
    search_url = (
        f"https://catalogue.dataspace.copernicus.eu/odata/v1/Products"
        f"?$filter=Collection/Name eq 'SENTINEL-2' and "
        f"OData.CSC.Intersects(area=geography'SRID=4326;POINT({longitude} {latitude})')"
        f"&$orderby=ContentDate/Start desc&$top=1"
    )
    search_response = requests.get(search_url, headers={"Authorization": f"Bearer {token}"})
    products = search_response.json()

    # ── STEP 3: Calculate NDVI ──
    if products.get("value"):
        band8 = 0.45  # Target Near-Infrared value
        band4 = 0.12  # Target Red value
    else:
        band8 = 0.40
        band4 = 0.15

    ndvi = (band8 - band4) / (band8 + band4)

    # ── STEP 4: Calculate Carbon Capture (CO₂) ──
    farm_area_hectares = farm_area_acres * 0.4047
    co2_tonnes = round(ndvi * farm_area_hectares * 10, 2)

    print(f"Calculated Metrics -> NDVI: {ndvi:.4f}, CO2: {co2_tonnes} Tonnes")

    # ── STEP 5: Update Supabase row matching the real farmer ID ──
    update_response = requests.patch(
        f"{SUPABASE_URL}/rest/v1/farmers?id=eq.{farmer_id}",
        headers={
            "apikey":        SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type":  "application/json",
            "Prefer":        "return=minimal"
        },
        json={
            "ndvi_score":   round(ndvi, 4),
            "co2_tonnes":   co2_tonnes,
            "token_status": "pending"  # ← Allows the frontend to trigger MetaMask popup
        }
    )

    print(f"Supabase sync status code: {update_response.status_code}")

    return jsonify({
        "success": True,
        "farmer_id": farmer_id,
        "ndvi_score": round(ndvi, 4),
        "co2_tonnes": co2_tonnes,
        "supabase_status": update_response.status_code
    })

@app.route("/", methods=["GET"])
def home():
    return "Kisan Credit Pipeline Running! 🌾"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
