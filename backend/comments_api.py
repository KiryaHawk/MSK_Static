from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import CommentColor
import os

app = Flask(__name__)
CORS(app)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.route("/api/get/<string:object_id>")
def get(object_id):
    db = next(get_db())
    comment_color = db.query(CommentColor).filter(CommentColor.object_id == object_id).first()
    return jsonify(comment_color.__dict__ if comment_color else {})

@app.route("/api/set/<string:object_id>", methods=["POST"])
def set_(object_id):
    db = next(get_db())
    data = request.get_json(force=True)
    
    item = db.query(CommentColor).filter(CommentColor.object_id == object_id).first()
    if not item:
        item = CommentColor(object_id=object_id)
        db.add(item)
    
    item.comment = data.get("comment", item.comment or "")
    item.color = data.get("color", item.color or "gray")
    
    db.commit()
    return jsonify({"status": "ok", "object_id": object_id})

@app.route("/api/get_all")
def get_all():
    db = next(get_db())
    items = db.query(CommentColor).all()
    return jsonify({item.object_id: {
        "comment": item.comment,
        "color": item.color
    } for item in items})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)