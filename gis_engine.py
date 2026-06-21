import os
import ee

# =========================
# EARTH ENGINE INIT
# =========================

service_account = os.getenv(
    "EE_SERVICE_ACCOUNT"
)

private_key = os.getenv(
    "EE_PRIVATE_KEY"
)


if service_account and private_key:

    private_key = private_key.replace(
        "\\n",
        "\n"
    )

    credentials = ee.ServiceAccountCredentials(
        service_account,
        key_data=private_key
    )

    ee.Initialize(
        credentials,
        project="tetu-nyeri"
    )

else:

    try:
        ee.Initialize(
            project="tetu-nyeri"
        )

    except Exception:
        ee.Initialize()
# =========================
# NDVI FUNCTION
# =========================
def get_ndvi_image(region):

    collection = (
        ee.ImageCollection(
            "COPERNICUS/S2_SR_HARMONIZED"
        )
        .filterBounds(region)
        .filterDate(
            "2024-01-01",
            "2024-12-31"
        )
        .filter(
            ee.Filter.lt(
                "CLOUDY_PIXEL_PERCENTAGE",
                20
            )
        )
    )

    image = collection.median()

    ndvi = image.normalizedDifference(
        ["B8", "B4"]
    ).rename("NDVI")

    return ndvi


# =========================
# NDVI VALUE
# =========================
def get_ndvi_value(region):

    ndvi = get_ndvi_image(region)

    value = ndvi.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=region,
        scale=10,
        maxPixels=1e9
    ).get("NDVI")

    return value.getInfo() if value else 0.0


# =========================
# NDVI HISTORY
# =========================
def get_ndvi_history(region):

    months = [

        ("Jan", "2024-01-01", "2024-02-01"),

        ("Feb", "2024-02-01", "2024-03-01"),

        ("Mar", "2024-03-01", "2024-04-01"),

        ("Apr", "2024-04-01", "2024-05-01"),

        ("May", "2024-05-01", "2024-06-01"),

        ("Jun", "2024-06-01", "2024-07-01")

    ]

    history = []

    for month, start, end in months:

        collection = (
            ee.ImageCollection(
                "COPERNICUS/S2_SR_HARMONIZED"
            )
            .filterBounds(region)
            .filterDate(
                start,
                end
            )
            .filter(
                ee.Filter.lt(
                    "CLOUDY_PIXEL_PERCENTAGE",
                    20
                )
            )
        )

        # Check if images exist
        count = collection.size().getInfo()

        if count == 0:

            history.append({
                "month": month,
                "ndvi": 0
            })

            continue

        image = collection.median()

        ndvi = image.normalizedDifference(
            ["B8", "B4"]
        ).rename("NDVI")

        value = ndvi.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=region,
            scale=10,
            maxPixels=1e9
        ).get("NDVI")

        history.append({

            "month": month,

            "ndvi":
                value.getInfo()
                if value
                else 0

        })

    return history