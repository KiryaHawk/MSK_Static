from flask import Flask, request, jsonify
from flask_cors import CORS
import json, os

app = Flask(__name__)
CORS(app)
DATA_FILE = os.path.join(os.path.dirname(__file__), "comments_colors.json")

def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.route("/api/get/<object_id>")
def get(object_id):
    data = load_data()
    return jsonify(data.get(object_id, {"comment": "", "color": ""}))

@app.route("/api/set/<object_id>", methods=["POST"])
def set_(object_id):
    data = load_data()
    j = request.get_json(force=True)
    comment = j.get("comment", "")
    color = j.get("color", "")
    data[object_id] = {"comment": comment, "color": color}
    save_data(data)
    return jsonify({"status": "ok"})

@app.route("/api/get_all")
def get_all():
    return jsonify(load_data())

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
