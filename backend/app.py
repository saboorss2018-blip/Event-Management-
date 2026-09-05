import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from prometheus_flask_exporter import PrometheusMetrics
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

DB_USER = os.getenv("MYSQL_USER", "eventuser")
DB_PASSWORD = os.getenv("MYSQL_PASSWORD", "eventpass")
DB_HOST = os.getenv("MYSQL_HOST", "db")
DB_NAME = os.getenv("MYSQL_DATABASE", "eventdb")

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:3306/{DB_NAME}"
)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

metrics = PrometheusMetrics(app)

metrics.info(
    "event_ticketing_api",
    "Event Ticketing API",
    version="1.0.0"
)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)


class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    event_date = db.Column(db.String(50), nullable=False)
    total_seats = db.Column(db.Integer, nullable=False)
    available_seats = db.Column(db.Integer, nullable=False)


class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    event_id = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)


@app.route("/health")
def health():
    return jsonify({
        "status": "UP",
        "service": "event-ticketing-backend"
    })


@app.route("/api/register", methods=["POST"])
def register():

    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({
            "error": "All fields are required"
        }), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({
            "error": "Email already exists"
        }), 409

    user = User(
        name=name,
        email=email,
        password=generate_password_hash(password)
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "Registration successful",
        "user_id": user.id
    }), 201


@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json()

    user = User.query.filter_by(
        email=data.get("email")
    ).first()

    if not user:
        return jsonify({
            "error": "Invalid credentials"
        }), 401

    if not check_password_hash(
        user.password,
        data.get("password", "")
    ):
        return jsonify({
            "error": "Invalid credentials"
        }), 401

    return jsonify({
        "message": "Login successful",
        "user_id": user.id,
        "name": user.name
    })


@app.route("/api/events", methods=["GET"])
def get_events():

    events = Event.query.all()

    result = []

    for event in events:

        result.append({
            "id": event.id,
            "name": event.name,
            "location": event.location,
            "event_date": event.event_date,
            "total_seats": event.total_seats,
            "available_seats": event.available_seats
        })

    return jsonify(result)


@app.route("/api/events", methods=["POST"])
def create_event():

    data = request.get_json()

    seats = int(data["total_seats"])

    event = Event(
        name=data["name"],
        location=data["location"],
        event_date=data["event_date"],
        total_seats=seats,
        available_seats=seats
    )

    db.session.add(event)
    db.session.commit()

    return jsonify({
        "message": "Event created",
        "event_id": event.id
    }), 201


@app.route("/api/bookings", methods=["POST"])
def create_booking():

    data = request.get_json()

    user_id = int(data["user_id"])
    event_id = int(data["event_id"])
    quantity = int(data["quantity"])

    event = db.session.get(Event, event_id)

    if not event:
        return jsonify({
            "error": "Event not found"
        }), 404

    if event.available_seats < quantity:
        return jsonify({
            "error": "Not enough seats"
        }), 400

    event.available_seats -= quantity

    booking = Booking(
        user_id=user_id,
        event_id=event_id,
        quantity=quantity
    )

    db.session.add(booking)

    db.session.commit()

    return jsonify({
        "message": "Booking successful",
        "booking_id": booking.id
    })


with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000
    )
