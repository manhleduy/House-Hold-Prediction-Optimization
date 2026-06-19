
import joblib


model = joblib.load("./MLmodel/hust_energy_model_v1.pkl")

class Session:
    def __init__(self, id, base_load, electric_price):
        self.id = id
        self.base_load = base_load
        self.device_load = 0
        self.electric_price = electric_price
        
        # phục vụ frontend + explainability
        self.active_appliances = []

def get_price_for_slot(slot_index, pricing):
    hour = slot_index // 6  # 144 slot → 24h

    for start, end in pricing["peak_hours"]:
        if start <= hour < end:
            return pricing["peak_price"]

    for start, end in pricing["offpeak_hours"]:
        if start <= hour < end:
            return pricing["offpeak_price"]

    return pricing["normal_price"]

def predict_base_load(features, pricing):
    X = [list(f.values()) for f in features]
    preds = model.predict(X)  # numpy array (144,)

    sessions = []

    for i in range(len(preds)):
        price = get_price_for_slot(i, pricing)

        session = Session(
            id=i,
            base_load=float(preds[i]),
            electric_price=price
        )

        sessions.append(session)

    return sessions