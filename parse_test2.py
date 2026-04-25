from datetime import datetime

payload = {
  "data": {
    "metrics": [
      {
        "name": "step_count",
        "data": [
          {"date": "2026-04-26 14:30:00 -0500", "qty": 4500}
        ]
      }
    ]
  }
}

server_today_str = datetime.now().strftime('%Y-%m-%d')
inferred_today_str = None
metrics_received = payload.get('data', {}).get('metrics', [])
for m in metrics_received:
    if m.get('data'):
        last_point = m['data'][-1]
        date_str = last_point.get('date', '')
        if len(date_str) >= 10:
            inferred_today_str = date_str[:10]
            break

today_str = inferred_today_str or server_today_str
print("Inferred date:", today_str)

for metric in metrics_received:
    metric_name = metric.get('name')
    extracted_value = metric.get('value')
    
    if extracted_value is None and 'data' in metric:
        total_qty = 0.0
        for point in metric['data']:
            date_str = point.get('date', '')
            if date_str.startswith(today_str):
                try:
                    total_qty += float(point.get('qty', 0))
                except ValueError:
                    pass
        extracted_value = int(total_qty) if float(total_qty).is_integer() else round(total_qty, 2)
    print("Value:", extracted_value, "Date:", today_str)
