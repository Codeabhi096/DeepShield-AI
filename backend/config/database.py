"""
DeepShield AI — MongoDB Connection
Using Motor (async MongoDB driver)
"""

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

# Global client and db
client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]

    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("api_key", unique=True)
    await db.detection_jobs.create_index("user_id")
    await db.detection_jobs.create_index("status")
    await db.detection_results.create_index("job_id", unique=True)

    print(f"✅ MongoDB connected — database: {settings.DB_NAME}")


async def disconnect_db():
    global client
    if client:
        client.close()
        print("👋 MongoDB disconnected")


def get_db():
    return db