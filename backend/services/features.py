
from datetime import datetime
import math

def compute_dew_point(temp, humidity):
    """
    Magnus formula
    """
    a = 17.27
    b = 237.7

    alpha = ((a * temp) / (b + temp)) + math.log(humidity / 100.0)
    dew = (b * alpha) / (a - alpha)

    return dew


def generate_features_144(weather_144, date_str="2016-01-14"):
    """
    weather_144: [{temp, humidity}] * 144

    return: list of dict (features)
    """

    base_temp = 20.5  # indoor base
    base_humidity = 45

    features = []

    date = datetime.strptime(date_str, "%Y-%m-%d")

    for i in range(144):
        w = weather_144[i]

        T_out = w["temp"]
        RH_out = w["humidity"]

        hour = i // 6

        # =========================
        # INDOOR TEMP (multi-room)
        # =========================
        def indoor_temp(offset):
            return base_temp + 0.05 * (T_out - 10) + offset

        T1 = indoor_temp(0.5)
        T2 = indoor_temp(0.3)
        T3 = indoor_temp(0.0)
        T4 = indoor_temp(-0.2)
        T5 = indoor_temp(0.1)
        T6 = indoor_temp(-1.5)  # basement lạnh hơn
        T7 = indoor_temp(0.2)
        T8 = indoor_temp(-0.3)
        T9 = indoor_temp(0.0)

        # =========================
        # HUMIDITY
        # =========================
        def indoor_rh(offset):
            return 0.7 * RH_out + 10 + offset

        RH_1 = indoor_rh(0)
        RH_2 = indoor_rh(1)
        RH_3 = indoor_rh(-1)
        RH_8 = indoor_rh(2)
        RH_9 = indoor_rh(-2)

        # =========================
        # DEW POINT
        # =========================
        Tdew = compute_dew_point(T_out, RH_out)

        # =========================
        # TIME FEATURES
        # =========================
        week = date.isocalendar()[1]
        day_of_week = date.weekday()

        week_of_month = (date.day - 1) // 7 + 1
        is_weekend = 1 if day_of_week >= 5 else 0

        # =========================
        # CLUSTER (simple rule)
        # =========================
        if hour < 6:
            cluster = 0
        elif hour < 12:
            cluster = 1
        elif hour < 18:
            cluster = 2
        else:
            cluster = 3

        # =========================
        # BUILD FEATURE
        # =========================
        row = {
            'T1': T1, 'RH_1': RH_1,
            'T2': T2, 'RH_2': RH_2,
            'T3': T3, 'RH_3': RH_3,
            'T4': T4, 'T5': T5, 'T6': T6,
            'T7': T7, 'T8': T8, 'RH_8': RH_8,
            'T9': T9, 'RH_9': RH_9,
            'T_out': T_out,
            'Tdewpoint': Tdew,
            'hour': hour,
            'week': week,
            'week_of_month': week_of_month,
            'is_weekend': is_weekend,
            'cluster': cluster
        }

        features.append(row)

    return features