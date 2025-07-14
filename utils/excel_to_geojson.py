import pandas as pd
import json
from tkinter import Tk
from tkinter.filedialog import askopenfilename, asksaveasfilename

Tk().withdraw()
file_path = askopenfilename(title="Выберите Excel файл", filetypes=[("Excel файлы", "*.xlsx")])
if not file_path:
    print("Файл не выбран. Завершение программы.")
    exit()

data = pd.read_excel(file_path)
data.columns = data.columns.str.strip()
required_columns = ['ПТО Айди', 'Ото Айди', 'Наименование', 'Адрес', 'Количество', 'Статус', 'Широта', 'Долгота']
missing_columns = [col for col in required_columns if col not in data.columns]
if missing_columns:
    print(f"Не хватает столбцов: {', '.join(missing_columns)}")
    exit()

def get_default_color(pto_id):
    return "red" if str(pto_id).strip() == "" else "gray"

features = []
for _, row in data.iterrows():
    try:
        pto_id = row['ПТО Айди'] if pd.notna(row['ПТО Айди']) else ""
        oto_id = row['Ото Айди'] if pd.notna(row['Ото Айди']) else ""
        name = row['Наименование'] if pd.notna(row['Наименование']) else ""
        address = row['Адрес'] if pd.notna(row['Адрес']) else ""
        quantity = int(row['Количество']) if pd.notna(row['Количество']) else 0
        latitude = float(row['Широта']) if pd.notna(row['Широта']) else None
        longitude = float(row['Долгота']) if pd.notna(row['Долгота']) else None
        color = get_default_color(pto_id)

        if latitude is not None and longitude is not None:
            features.append({
                "type": "Feature",
                "id": hash(f"{latitude}{longitude}{oto_id}{name}"),
                "geometry": {
                    "type": "Point",
                    "coordinates": [longitude, latitude]
                },
                "properties": {
                    "oto_id": oto_id,
                    "pto_id": pto_id,
                    "name": name,
                    "address": address,
                    "quantity": quantity,
                    "comment": "",
                    "color": color,
                    "hintContent": f"{oto_id}: {name} (Кол-во: {quantity})"
                },
                "options": {
                    "preset": f"islands#{color}Icon"
                }
            })
        else:
            print(f"Пропущена строка с некорректными координатами: {row}")
    except Exception as e:
        print(f"Ошибка обработки строки: {row}. Ошибка: {e}")

save_path = asksaveasfilename(defaultextension=".json", filetypes=[("JSON файлы", "*.json")], title="Сохранить JSON файл как")
if not save_path:
    print("Путь для сохранения не выбран. Завершение программы.")
    exit()

with open(save_path, "w", encoding="utf-8") as json_file:
    json.dump({"type": "FeatureCollection", "features": features}, json_file, ensure_ascii=False, indent=4)

print(f"Файл успешно сохранен: {save_path}")
