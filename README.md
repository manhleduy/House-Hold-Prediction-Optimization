# Smart Home Energy Optimizer

## Overview

Smart Home Energy Optimizer is a machine learning and optimization-based system that predicts household electricity consumption and automatically schedules appliances to reduce electricity costs while respecting power constraints and user preferences.

The system combines:

* Extra Trees Regressor for base load prediction
* Weather Forecast API integration
* A* Search Algorithm for appliance scheduling
* Constraint Satisfaction Problem (CSP) for power constraints

---

## Problem Statement

Household electricity demand varies throughout the day.

Running multiple high-power appliances simultaneously may:

* Increase electricity costs
* Create peak load periods
* Reduce energy efficiency

This project aims to automatically determine the best operating schedule for household appliances while satisfying user requirements and power limitations.

---

## Main Features

### Base Load Prediction

Predict household electricity consumption for the next 24 hours (144 slots of 10 minutes).

Input:

* Temperature
* Humidity
* Time-related features

Output:

* Predicted base load timeline

### Appliance Scheduling

Optimize appliance operation time based on:

* Electricity price
* User preferred time window
* Maximum load constraint

Supported appliance parameters:

* Name
* Power (W)
* Duration
* Preferred Start
* Preferred End

### Peak Load Control

The optimizer guarantees:

Current Load + Appliance Load ≤ Max Load

for every time slot.

---

## System Architecture

User Input
↓
Weather API
↓
Feature Generation
↓
Extra Trees Regressor
↓
Predicted Base Load
↓
A* + CSP Optimizer
↓
Optimal Appliance Schedule
↓
Optimized Load Profile

---

## Technologies Used

### Backend

* Python
* FastAPI

### Machine Learning

* Scikit-Learn
* Extra Trees Regressor
* Joblib

### Optimization

* A* Search
* CSP (Constraint Satisfaction Problem)

### Data Processing

* Pandas
* NumPy

### External Services

* Open-Meteo API

---

## Dataset

Dataset:

Energy Consumption Dataset for Appliances

Main target:

* Appliances power consumption

Selected features:

* Indoor temperature
* Indoor humidity
* Outdoor temperature
* Dew point
* Hour of day
* Week information
* Weekend indicator

---

## Model Performance

| Model                 | MAE | RMSE | R² |
| --------------------- | --- | ---- | -- |
| Linear Regression     | XX  | XX   | XX |
| Random Forest         | XX  | XX   | XX |
| Extra Trees Regressor | XX  | XX   | XX |

Extra Trees Regressor achieved the best overall performance and was selected for deployment.

---

## Optimization Strategy

### Objective

Minimize:

Total Cost = Energy Cost + Comfort Penalty

### Constraints

* Maximum Load Constraint
* Appliance Duration Constraint
* Preferred Time Window Constraint

### Search Method

The optimizer uses:

* A* Search
* Candidate Slot Filtering
* Constraint Repair Strategy

High-power appliances are scheduled first to reduce future conflicts.

---

## Project Structure

backend/

├── main.py

├── services/

│   ├── predict.py

│   ├── weather.py

│   ├── schedule.py

│   └── optimizer.py

├── models/

│   └── hust_energy_model_v1.pkl

frontend/

report/

README.md

---

## Running the Project

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Start Backend

```bash
uvicorn main:app --reload
```

### API Endpoint

```http
POST /predict
```

Request Body:

```json
{
  "date": "2026-04-04",
  "max_load": 5000,
  "pricing": {
    "peak_price": 3000,
    "normal_price": 2000,
    "offpeak_price": 1200
  },
  "appliances": []
}
```

---

## Example Output

```json
{
  "best_cost": 123456,
  "schedule": {
    "washing_machine": 50,
    "dishwasher": 85,
    "ev_charger": 100
  }
}
```

---

## Future Improvements

* IoT Integration
* Real-time Smart Meter Data
* Reinforcement Learning Scheduling
* Solar Energy Integration
* Smart Grid Connectivity

---

## Author

Le Duy Manh

Hanoi University of Science and Technology

Academic Project – Optimization Methods
