import requests
from datetime import date


def get_weather_144(input_date: str):
    lat = 50.59
    lon = 3.82

    today = date.today().isoformat()

    # =========================
    # Chọn API phù hợp
    # =========================
    if input_date < today:
        url = "https://archive-api.open-meteo.com/v1/archive"
    else:
        url = "https://api.open-meteo.com/v1/forecast"

    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "temperature_2m,relative_humidity_2m",
        "start_date": input_date,
        "end_date": input_date,
        "timezone": "auto"
    }

    response = requests.get(url, params=params, timeout=10)

    print("STATUS:", response.status_code)
    print("URL:", response.url)

    if response.status_code != 200:
        print("ERROR:", response.text)
        raise Exception("Weather API failed")

    data = response.json()

    temps = data["hourly"]["temperature_2m"]
    humidity = data["hourly"]["relative_humidity_2m"]

    # expand 144
    weather_144 = []
    for i in range(24):
        for _ in range(6):
            weather_144.append({
                "temp": temps[i],
                "humidity": humidity[i]
            })

    return weather_144