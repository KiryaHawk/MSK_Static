const API_URL = 'https://pto-api.onrender.com/api';

ymaps.ready(function () {
    fetch('frontend/data/points.json')
        .then(response => response.json())
        .then(obj => {
            const searchControls = new ymaps.control.SearchControl({
                options: {
                    float: 'right',
                    noPlacemark: true
                }
            });

            const myMap = new ymaps.Map("map", {
                center: [55.76, 37.64],
                zoom: 7,
                controls: [searchControls]
            });

            const removeControls = [
                'geolocationControl',
                'trafficControl',
                'fullscreenControl',
                'zoomControl',
                'rulerControl',
                'typeSelector'
            ];
            removeControls.forEach(control => myMap.controls.remove(control));

            const objectManager = new ymaps.ObjectManager({
                clusterize: true,
                clusterIconLayout: "default#pieChart",
                clusterDisableClickZoom: false,
                geoObjectOpenBalloonOnClick: true,
                geoObjectHasBalloon: true,
                geoObjectOpenHintOnHover: true
            });

            let minLat = Infinity, maxLat = -Infinity;
            let minLon = Infinity, maxLon = -Infinity;

            fetch(API_URL + '/get_all')
                .then(r => r.json())
                .then(commMap => {
                    obj.features.forEach(feature => {
                        const [lon, lat] = feature.geometry.coordinates;
                        feature.geometry.coordinates = [lat, lon];

                        minLat = Math.min(minLat, lat);
                        maxLat = Math.max(maxLat, lat);
                        minLon = Math.min(minLon, lon);
                        maxLon = Math.max(maxLon, lon);

                        const id = String(feature.id || feature.properties.oto_id);

                        // Определяем цвет
                        const presetFromFile = feature.options?.preset;
                        const baseColor = presetFromFile?.includes("blueIcon") ? "blue" : null;
                        const color = commMap[id]?.color || feature.properties.color || baseColor || "gray";
                        const comment = commMap[id]?.comment || feature.properties.comment || "";

                        feature.properties.color = color;
                        feature.properties.comment = comment;
                        feature.options = feature.options || {};
                        feature.options.preset = "islands#" + color + "Icon";
                        feature.properties.balloonContent = '';
                    });

                    objectManager.removeAll();
                    objectManager.add(obj);
                    myMap.geoObjects.add(objectManager);

                    if (minLat !== Infinity && maxLat !== -Infinity &&
                        minLon !== Infinity && maxLon !== -Infinity) {
                        myMap.setBounds([[minLat, minLon], [maxLat, maxLon]], { checkZoomRange: true });
                    }

                    // Клик по точке
                    objectManager.objects.events.add('click', function (e) {
                        const objectId = e.get('objectId');
                        const obj = objectManager.objects.getById(objectId);
                        if (!obj) return;

                        const color = obj.properties.color || "gray";
                        const comment = obj.properties.comment || "";
                        const isReadonly = color === "blue";

                        let balloonHtml = '';

                        if (isReadonly) {
                            balloonHtml = `
<div style="padding: 8px;">
  <b>${obj.properties.name || "Без названия"}</b><br>
  <b>Адрес:</b> ${obj.properties.address || "—"}<br>
</div>
`;
                        } else {
                            balloonHtml = `
<div style="padding: 8px;">
  <b>OTO ID:</b> ${obj.properties.oto_id || "-"}<br>
  <b>ПТО ID:</b> ${obj.properties.pto_id || "-"}<br>
  <b>${obj.properties.name || "Без названия"}</b><br>
  <b>Адрес:</b> ${obj.properties.address || "—"}<br>
  <b>Количество:</b> ${obj.properties.quantity || "-"}<br><br>
  <label><b>Комментарий:</b><br>
    <textarea id="comment-edit" style="width:98%;min-height:48px;">${comment}</textarea>
  </label><br><br>
  <label><b>Цвет:</b>
    <select id="color-select">
        <option value="gray" ${color === "gray" ? "selected" : ""}>Серый</option>
        <option value="red" ${color === "red" ? "selected" : ""}>Красный</option>
        <option value="yellow" ${color === "yellow" ? "selected" : ""}>Жёлтый</option>
        <option value="green" ${color === "green" ? "selected" : ""}>Зелёный</option>
        <option value="blue" ${color === "blue" ? "selected" : ""}>Синий</option>
        <option value="orange" ${color === "orange" ? "selected" : ""}>Оранжевый</option>
        <option value="violet" ${color === "violet" ? "selected" : ""}>Фиолетовый</option>
        <option value="pink" ${color === "pink" ? "selected" : ""}>Розовый</option>
        <option value="brown" ${color === "brown" ? "selected" : ""}>Коричневый</option>
        <option value="darkGreen" ${color === "darkGreen" ? "selected" : ""}>Тёмно-зелёный</option>
        <option value="darkOrange" ${color === "darkOrange" ? "selected" : ""}>Тёмно-оранжевый</option>
        <option value="darkBlue" ${color === "darkBlue" ? "selected" : ""}>Тёмно-синий</option>
        <option value="night" ${color === "night" ? "selected" : ""}>Ночной</option>
    </select>
  </label><br><br>
  <button onclick="window.saveCommentAndColor('${objectId}')">Сохранить</button>
</div>
`;
                        }

                        objectManager.objects.setObjectProperties(objectId, {
                            ...obj.properties,
                            balloonContent: balloonHtml
                        });

                        objectManager.objects.balloon.open(objectId);
                    });

                    window._objectManager = objectManager;
                });
        });
});

window.saveCommentAndColor = function (id) {
    const comment = document.getElementById('comment-edit')?.value;
    const color = document.getElementById('color-select')?.value;

    fetch(`${API_URL}/set/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment, color })
    }).then(() => {
        const obj = window._objectManager.objects.getById(Number(id));
        if (obj) {
            obj.properties.comment = comment;
            obj.properties.color = color;
            obj.options.preset = "islands#" + color + "Icon";

            window._objectManager.objects.setObjectOptions(id, obj.options);
            window._objectManager.objects.setObjectProperties(id, obj.properties);
        }

        alert("Сохранено!");
        window._objectManager.objects.balloon.close();
    });
};
