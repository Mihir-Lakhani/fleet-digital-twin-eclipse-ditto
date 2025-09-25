import requests
import json

try:
    response = requests.get('http://localhost:5000/mongodb/things')
    print(f'API Status: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        print(f'Raw response: {json.dumps(data, indent=2)}')
        print(f'Number of things: {len(data)}')
        print(f'Type of data: {type(data)}')
        if len(data) > 0:
            print(f'Type of first item: {type(data[0])}')
            print(f'First item: {data[0]}')
    else:
        print(f'Error: {response.text}')
except Exception as e:
    print(f'Exception: {e}')