import numpy as np
from fastapi import FastAPI, HTTPException
from typing import Optional
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

model = SentenceTransformer("all-MiniLM-L6-v2")

# random for now but ill set up something like proper sooner rather than leter
np.random.seed(42)
projection_matrix = np.random.randn(384, 3)

def embed_text(text: str) -> tuple: 
    embedding = model.encode([text])[0]  
    coords_3d = embedding @ projection_matrix
    return tuple(coords_3d)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_TABLE = "posts"

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in environment variables")

SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextInput(BaseModel):
    title: str
    text: str
    image_url: str = ""  



#do NOT use this most likely 
@app.post("/post")
def embed_text_endpoint(input: TextInput):
    try:
        coords_3d = embed_text(input.text)
        
        data = {
            "title": input.title,
            "post_content_text": input.text,
            "post_content_image": input.image_url,
            "point_x": float(coords_3d[0]),  
            "point_y": float(coords_3d[1]),
            "point_z": float(coords_3d[2]),
        }
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/{SUPABASE_TABLE}",
            json=data,
            headers=SUPABASE_HEADERS,
        )
        
        if response.status_code not in [200, 201]:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Database error: {response.text}"
            )
        
        return {
            "title": input.title,
            "coordinates": coords_3d,
            "image_url": input.image_url,
            "db_response": response.json(),
            "status": "success"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")


@app.post("/embed-only")
def embed_only(input: TextInput):
    try:
        coords_3d = embed_text(input.text)
        return {
            "title": input.title,
            "coordinates": coords_3d,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error embedding text: {str(e)}")

@app.get("/posts")
def get_posts():
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/{SUPABASE_TABLE}",
            headers=SUPABASE_HEADERS,
            params={"select": "*"}   
        )
        
        print(f"Supabase Response Status: {response.status_code}")
        print(f"Supabase Response Body: {response.text}")
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Database error: {response.text}"
            )
        
        return response.json()
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving posts: {str(e)}")


@app.get("/reply")
def get_replies(parent_id: Optional[str] = None):
    if not parent_id:
        raise HTTPException(status_code=400, detail="Missing or invalid parent_id")

    try:
        params = {
            "parent_id": f"eq.{parent_id}",
            "order": "created_at.asc"
        }

        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/{SUPABASE_TABLE}",
            headers={
                **SUPABASE_HEADERS,
                "Prefer": "return=representation"
            },
            params=params
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Database error: {response.text}"
            )

        return response.json()

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch replies: {str(e)}")
