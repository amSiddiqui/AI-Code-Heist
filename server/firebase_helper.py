import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os

# Current file path 
file_path = os.path.abspath(__file__)


cred = credentials.Certificate(os.path.join(os.path.dirname(file_path), "firebase-sdk.json"))
firebase_admin.initialize_app(cred)

db = firestore.client()
