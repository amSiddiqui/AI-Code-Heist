"""
This module provides functionality for setting up and initializing Firebase Firestore using credentials either from a
local file or from an S3 bucket. It checks for the existence of the Firebase SDK configuration file locally; if not
found, it attempts to download the file from a specified S3 bucket. Once the credentials are obtained, it initializes
the Firebase Admin SDK and Firestore client for further operations.
"""

import os
import logging
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import boto3

# Current file path
file_path = os.path.abspath(__file__)
filename = "firebase-sdk.json"
file_loc = os.path.join(os.path.dirname(file_path), f"../{filename}")

log = logging.getLogger(__name__)

# Check if file exists if not
if os.path.exists(file_loc):
    cred = credentials.Certificate(file_loc)
    log.info("Using local %s", filename)
else:
    # Check if s3_bucket exists
    bucket_name = os.getenv("PRIVATE_S3")
    if not bucket_name:
        raise FileNotFoundError(f"{filename} not found and PRIVATE_S3 not set")
    s3_url = f"s3://{bucket_name}/{filename}"
    s3 = boto3.client("s3")
    s3.download_file(bucket_name, filename, file_loc)
    cred = credentials.Certificate(file_loc)
    log.info("Using %s", s3_url)

firebase_admin.initialize_app(cred)

db = firestore.client()
