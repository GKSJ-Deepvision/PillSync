"""
MongoDB Helper Module for PillSync

Provides thread-safe access to MongoDB database connection and helper
functions for storing, querying, and managing documents/values.
"""
import os
import logging
from typing import Any, Dict, List, Optional
from django.conf import settings

logger = logging.getLogger(__name__)

_mongo_client = None


def get_mongo_client():
    """Return a shared PyMongo MongoClient instance."""
    global _mongo_client
    if _mongo_client is None:
        try:
            from pymongo import MongoClient
            mongo_uri = getattr(settings, "MONGO_URI", os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
            _mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
        except Exception as err:
            logger.error("Failed to initialize MongoDB client: %s", err)
            raise
    return _mongo_client


def get_mongo_db():
    """Return the configured MongoDB Database instance."""
    client = get_mongo_client()
    db_name = getattr(settings, "MONGO_DB_NAME", os.getenv("MONGO_DB_NAME", "medicin"))
    return client[db_name]


def store_document(collection_name: str, document: Dict[str, Any]) -> str:
    """
    Store a JSON-serializable dictionary document into MongoDB.
    Returns the string representation of the inserted _id.
    """
    db = get_mongo_db()
    collection = db[collection_name]
    doc_copy = dict(document)
    result = collection.insert_one(doc_copy)
    return str(result.inserted_id)


def get_document(collection_name: str, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Retrieve a single document matching the query.
    Converts ObjectId _id to string if present.
    """
    db = get_mongo_db()
    doc = db[collection_name].find_one(query)
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def list_documents(collection_name: str, query: Optional[Dict[str, Any]] = None, limit: int = 100) -> List[Dict[str, Any]]:
    """
    List up to `limit` documents matching query in the specified collection.
    Converts ObjectId _id to string for each document.
    """
    db = get_mongo_db()
    query = query or {}
    cursor = db[collection_name].find(query).limit(limit)
    documents = []
    for doc in cursor:
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        documents.append(doc)
    return documents


def delete_document(collection_name: str, query: Dict[str, Any]) -> int:
    """
    Delete documents matching query in collection_name.
    Returns deleted count.
    """
    db = get_mongo_db()
    result = db[collection_name].delete_many(query)
    return result.deleted_count
