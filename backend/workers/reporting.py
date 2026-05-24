import asyncio
import datetime
from database.config import db

class ReportingWorker:
    def __init__(self, interval_seconds=86400): # Default: Daily
        self.interval = interval_seconds
        self.is_running = False
        self.task = None

    async def generate_report(self):
        """Simulates generating a PDF/CSV report and sending it."""
        print(f"[{datetime.datetime.utcnow().isoformat()}] Starting automated reporting generation...")
        
        if not db.client:
            print("Database not connected. Skipping report.")
            return

        # 1. Fetch yesterday's routes
        yesterday = (datetime.datetime.utcnow() - datetime.timedelta(days=1)).strftime("%Y-%m-%d")
        routes = await db.client.ai_route.routes.find({"date": yesterday}).to_list(100)
        
        # 2. Compile metrics
        total_routes = len(routes)
        total_fuel_saved = sum(r.get("estimated_fuel_cost", 0) for r in routes)
        
        # 3. Simulate email sending
        report_summary = f"Generated report for {yesterday}: {total_routes} routes optimized. Estimated fuel savings tracked."
        print(f"[{datetime.datetime.utcnow().isoformat()}] Reporting complete. {report_summary}")
        
        # Store in DB as a record
        await db.client.ai_route.reports.insert_one({
            "date": yesterday,
            "total_routes": total_routes,
            "metrics": {"fuel_saved": total_fuel_saved},
            "status": "SENT",
            "timestamp": datetime.datetime.utcnow().isoformat()
        })

    async def _run_loop(self):
        self.is_running = True
        while self.is_running:
            try:
                # Wait for the next interval
                await asyncio.sleep(self.interval)
                await self.generate_report()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in reporting worker: {e}")

    def start(self):
        if not self.task:
            self.task = asyncio.create_task(self._run_loop())
            print("Automated reporting worker started.")

    async def stop(self):
        self.is_running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
            self.task = None
            
reporting_worker = ReportingWorker(interval_seconds=3600) # Setting to 1 hour for testing
