from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy.orm import Session
from database import SessionLocal
from models import CommentColor
import os

app = Flask(__name__)
CORS(app)

# Подключение к базе данных
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.route("/api/get/<object_id>")
def get(object_id):
    db = next(get_db())
    comment_color = db.query(CommentColor).filter(CommentColor.object_id == object_id).first()
    if comment_color:
        return jsonify({"comment": comment_color.comment, "color": comment_color.color})
    return jsonify({"comment": "", "color": ""})

@app.route("/api/set/<object_id>", methods=["POST"])
def set_(object_id):
    db = next(get_db())
    data = request.get_json(force=True)
    comment = data.get("comment", "")
    color = data.get("color", "")

    existing = db.query(CommentColor).filter(CommentColor.object_id == object_id).first()
    if existing:
        existing.comment = comment
        existing.color = color
    else:
        new_entry = CommentColor(object_id=object_id, comment=comment, color=color)
        db.add(new_entry)

    db.commit()
    return jsonify({"status": "ok"})

@app.route("/api/get_all")
def get_all():
    db = next(get_db())
    all_comments_colors = db.query(CommentColor).all()
    return jsonify({item.object_id: {"comment": item.comment, "color": item.color} for item in all_comments_colors})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)