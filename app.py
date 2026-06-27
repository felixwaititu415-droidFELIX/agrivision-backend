from flask import Flask, jsonify, request
import ee

from gis_engine import (
    get_ndvi_value,
    get_ndvi_image,
    get_ndvi_history,
    get_terrain,
    aspect_to_direction
)

app = Flask(__name__)

# =========================
# SAFE INIT
# =========================


# =========================
# HOME
# =========================
@app.route("/")
def home():
    return jsonify({"status": "Flask GIS API running"})


# =========================
# NDVI POINT
# =========================
@app.route("/ndvi_point")
def ndvi_point():
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))

        point = ee.Geometry.Point([lon, lat])

        value = get_ndvi_value(point)

        return jsonify({
            "lat": lat,
            "lon": lon,
            "ndvi": float(value)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# FARM NDVI ANALYSIS
# =========================
@app.route("/gis")
def gis():
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))

        point = ee.Geometry.Point([lon, lat])
        region = point.buffer(500)

        ndvi_val = get_ndvi_value(region)

        # Simple risk logic
        if ndvi_val < 0.3:
            risk = "HIGH"
        elif ndvi_val < 0.5:
            risk = "MEDIUM"
        else:
            risk = "LOW"

        return jsonify({
            "project": "tetu-nyeri",
            "lat": lat,
            "lon": lon,
            "ndvi": float(ndvi_val),
            "risk": risk
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# NDVI TILE LAYER
# =========================
@app.route("/ndvi_tiles")
def ndvi_tiles():
    try:
        geometry = ee.Geometry.Rectangle([33.5, -4.8, 41.9, 5.2])

        ndvi = get_ndvi_image(geometry)

        vis = {
            "min": 0,
            "max": 1,
            "palette": ["red", "yellow", "green"]
        }

        map_id = ndvi.getMapId(vis)

        return jsonify({
            "tile_url": map_id["tile_fetcher"].url_format
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# FARM NDVI TILE
# =========================
@app.route("/farm_ndvi_tiles", methods=["POST"])
def farm_ndvi_tiles():

    try:

        points = request.json["points"]

        ee_coords = []

        for p in points:
            ee_coords.append(
                [p["lon"], p["lat"]]
            )

        region = ee.Geometry.Polygon(
            [ee_coords]
        )

        ndvi = get_ndvi_image(region)

        ndvi = ndvi.clip(region)

        vis_params = {
            "min": 0,
            "max": 1,
            "palette": [
                "red",
                "orange",
                "yellow",
                "green"
            ]
        }

        map_id = ndvi.getMapId(
            vis_params
        )

        return jsonify({
            "tile_url":
            map_id["tile_fetcher"].url_format
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

# =========================
# NDVI HISTORY
# =========================
@app.route("/ndvi_history")
def ndvi_history():

    try:

        lat = float(
            request.args.get("lat")
        )

        lon = float(
            request.args.get("lon")
        )

        region = (
            ee.Geometry.Point(
                [lon, lat]
            )
            .buffer(500)
        )

        history = get_ndvi_history(
            region
        )

        return jsonify({
            "history": history
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500
    
# =========================
# TERRAIN ANALYSIS
# =========================
@app.route("/terrain")
def terrain():

    try:

        lat = float(
            request.args.get("lat")
        )

        lon = float(
            request.args.get("lon")
        )

        region = (
            ee.Geometry.Point(
                [lon, lat]
            )
            .buffer(500)
        )

        terrain_data = get_terrain(region)

        terrain_data["aspect_direction"] = (
            aspect_to_direction(
                terrain_data["aspect"]
            )
        )

        return jsonify(
            terrain_data
        )

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    app.run(port=5001, debug=True)