from datetime import datetime
import json

payload = {
  "data": {
    "metrics": [
      {
        "name": "step_count",
        "data": [
          {"date": "2026-04-25 23:30:00 +0800", "qty": 500},
          {"date": "2026-04-26 00:30:00 +0800", "qty": 1000},
          {"date": "2026-04-26 01:10:00 +0800", "qty": 200}
        ]
      }
    ]
  }
}

today_local = datetime.now()
today_date_str = today_local.strftime('%Y-%m-%d')
print("today is", today_date_str, type(today_local))

for metric in payload['data']['metrics']:
    total_qty = 0
    metric_name = metric['name']
    data_points = metric.get('data', [])
    for point in data_points:
        date_str = point.get('date', '')
        # Usually 'YYYY-MM-DD HH:MM:SS Z'
        # Check if the date string starts with today's date in local time!
        if date_str.startswith(today_date_str):
            total_qty += point.get('qty', 0)
    print(f"Total {metric_name} since midnight: {total_qty}")
