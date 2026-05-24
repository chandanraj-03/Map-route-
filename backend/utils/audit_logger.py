import datetime
from database.config import get_db

class AuditLogger:
    @staticmethod
    async def log_action(db, user_id: str, action: str, entity_type: str, entity_id: str, details: str = ""):
        audit_doc = {
            "user_id": user_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "details": details
        }
        await db.audit_logs.insert_one(audit_doc)

audit_logger = AuditLogger()
