from fastapi import FastAPI
from services.predict import predict_base_load
from services.weather import get_weather_144
from services.schedule import OptimizeEnv
from services.features import generate_features_144
from services.appliance import Appliance
from fastapi.middleware.cors import CORSMiddleware
import time
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
def predict(data: dict):
    appliances = [Appliance(**a) for a in data["appliances"]]

    date = data["date"]
    pricing = data["pricing"]
    max_load = data["max_load"] | 3000
    print(max_load)
    # 1. Weather
    weather_144 = get_weather_144(date)
    

    # 2. Features
    features = generate_features_144(weather_144, date)


    # 3. ML predict
    sessions = predict_base_load(features, pricing)
    base_load= [s.base_load for s in sessions]


    # 4. CSP optimize
    env= OptimizeEnv(appliances, sessions, max_load)
    start_time = time.time()

    best_schedule, best_cost, optimize_load = env.astar()
    
    end_time= time.time()
    elapsed_time = end_time - start_time
    print(f"Execution time: {elapsed_time:.6f} seconds")

    return {
        "schedule": best_schedule,
        "base_load": base_load,
        "optimize_load": optimize_load
    }