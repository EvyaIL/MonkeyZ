"""
Custom JSON encoder for MongoDB ObjectId.
"""

from json import JSONEncoder
import json
from bson.objectid import ObjectId

class MongoJSONEncoder(JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return super().default(o)

def mongo_json_serializer(obj):
    """
    JSON serializer that can handle MongoDB ObjectId
    """
    if isinstance(obj, ObjectId):
        return str(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def dumps_with_objectid(obj):
    """
    JSON dumps that can handle MongoDB ObjectId
    """
    return json.dumps(obj, default=mongo_json_serializer)
