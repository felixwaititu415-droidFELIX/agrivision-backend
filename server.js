const axios = require("axios");
const express = require("express");
const cors = require("cors");

const app = express();
const db = require("./firebase");

const PORT = 3000;
const GIS_URL =
  "https://agrivision-gis.onrender.com";
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { GoogleGenAI } =
  require("@google/genai");

const ai =
  new GoogleGenAI({
    apiKey:
      process.env.GEMINI_API_KEY
  });

const JWT_SECRET =
  "agrivision_secret_2026";

app.use(express.json());
app.use(cors());

console.log(
  "Gemini key starts with:",
  process.env.GEMINI_API_KEY?.substring(0, 10)
);

console.log("SERVER FILE LOADED");

// ==========================
// HOME
// ==========================
app.get("/", (req, res) => {
  res.json({ message: "AgriVision Backend Running" });
});

// ==========================
// FARMERS
// ==========================
app.get("/farmers", async (req, res) => {

  try {

    const snapshot =
      await db.collection("farmers").get();

    const farmers = [];

    snapshot.forEach(doc => {

      farmers.push({
        id: doc.id,
        ...doc.data()
      });

    });

    res.json(farmers);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});
// ==========================
// MY FARMS
// ==========================
app.get("/my-farms/:userId", async (req, res) => {

  try {

    const snapshot =
      await db
        .collection("farmers")
        .where(
          "ownerId",
          "==",
          req.params.userId
        )
        .get();

    const farms = [];

    snapshot.forEach(doc => {
      farms.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(farms);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

// ==========================
// ADD FARMER
// ==========================
app.post("/farmers", async (req, res) => {

  try {

    const docRef =
      await db.collection("farmers").add({
        ...req.body,
        createdAt: new Date(),
      });

    res.json({
      message: "Farmer added",
      id: docRef.id
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

// ==========================
// UPDATE FARM
// ==========================
app.put("/farmers/:id", async (req, res) => {

  try {

    await db
      .collection("farmers")
      .doc(req.params.id)
      .update(req.body);

    res.json({
      success: true
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

// ==========================
// DELETE FARM
// ==========================
app.delete("/farmers/:id", async (req, res) => {

  try {

    await db
      .collection("farmers")
      .doc(req.params.id)
      .delete();

    res.json({
      success: true
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

// ==========================
// REGISTER
// ==========================
app.post("/register", async (req, res) => {

  try {

    const {
      name,
      email,
      password
    } = req.body;

    const existing =
      await db
        .collection("users")
        .where("email", "==", email)
        .get();

    if (!existing.empty) {
      return res.status(400).json({
        error: "Email already exists"
      });
    }

    const passwordHash =
      await bcrypt.hash(password, 10);

    const doc =
      await db.collection("users").add({
        name,
        email,
        passwordHash,
        createdAt: new Date()
      });

    res.json({
      success: true,
      userId: doc.id
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

// ==========================
// LOGIN
// ==========================
app.post("/login", async (req, res) => {

  try {

    const {
      email,
      password
    } = req.body;

    const snapshot =
      await db
        .collection("users")
        .where("email", "==", email)
        .get();

    if (snapshot.empty) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    const user =
      snapshot.docs[0];

    const data =
      user.data();

      console.log("EMAIL:", email);
      console.log("INPUT PASSWORD:", password);
      console.log("HASH:", data.passwordHash);
      
      const valid =
        await bcrypt.compare(
          password,
          data.passwordHash
        );
      
      console.log("VALID:", valid);

    if (!valid) {

      return res.status(401).json({
        error: "Invalid credentials"
      });

    }

    const token =
      jwt.sign(
        {
          userId: user.id
        },
        JWT_SECRET,
        {
          expiresIn: "30d"
        }
      );

    res.json({
      success: true,
      token,
      userId: user.id,
      name: data.name,
      email: data.email
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

// ==========================
// CROP RULES
// ==========================
const cropRules = {
  maize: {
    tempMin: 18,
    tempMax: 32,
    rainfallMin: 20,
    rainfallMax: 120,
    ndviMin: 0.30
  },

  beans: {
    tempMin: 15,
    tempMax: 28,
    rainfallMin: 15,
    rainfallMax: 100,
    ndviMin: 0.35
  },

  potatoes: {
    tempMin: 10,
    tempMax: 24,
    rainfallMin: 20,
    rainfallMax: 80,
    ndviMin: 0.40
  },

  sorghum: {
    tempMin: 20,
    tempMax: 35,
    rainfallMin: 10,
    rainfallMax: 60,
    ndviMin: 0.25
  },

  wheat: {
    tempMin: 10,
    tempMax: 25,
    rainfallMin: 15,
    rainfallMax: 80,
    ndviMin: 0.35
  },

  coffee: {
    tempMin: 15,
    tempMax: 28,
    rainfallMin: 20,
    rainfallMax: 100,
    ndviMin: 0.40
  },

  tea: {
    tempMin: 15,
    tempMax: 26,
    rainfallMin: 25,
    rainfallMax: 120,
    ndviMin: 0.50
  },

  rice: {
    tempMin: 20,
    tempMax: 35,
    rainfallMin: 30,
    rainfallMax: 150,
    ndviMin: 0.40
  }
};
function normalizeCrop(crop) {
  return (crop || "").toLowerCase().trim();
}

// ==========================
// REAL WEATHER (OPEN-METEO)
// ==========================
async function getWeather(lat, lon) {

  const response = await axios.get(
    "https://api.open-meteo.com/v1/forecast",
    {
      params: {
        latitude: lat,
        longitude: lon,

        current: [
          "temperature_2m",
          "relative_humidity_2m",
          "wind_speed_10m"
        ].join(","),

        daily: [
          "precipitation_sum"
        ].join(","),

        timezone: "auto"
      }
    }
  );

  const totalRainfall =
    response.data.daily.precipitation_sum.reduce(
      (sum, value) => sum + value,
      0
    );

  return {
    temperature_2m: response.data.current.temperature_2m,
    relative_humidity_2m:
      response.data.current.relative_humidity_2m,
    wind_speed_10m:
      response.data.current.wind_speed_10m,
    rainfall: totalRainfall
  };
}


// ==========================
// NDVI HISTORY
// ==========================
app.get(
  "/ndvi-history/:id",
  async (req, res) => {

    try {

      const doc = await db
        .collection("farmers")
        .doc(req.params.id)
        .get();

      if (!doc.exists) {

        return res.status(404).json({
          error:
            "Farmer not found"
        });

      }

      const farmer = doc.data();

      let centerLat =
          farmer.lat;

      let centerLon =
          farmer.lon;

      if (
        (!centerLat ||
         !centerLon) &&
        farmer.geometry &&
        farmer.geometry.points &&
        farmer.geometry.points.length > 0
      ) {

        centerLat =
          farmer.geometry
            .points[0].lat;

        centerLon =
          farmer.geometry
            .points[0].lon;
      }

      const response =
  await axios.get(
    `${GIS_URL}/ndvi_history`,
    {
      params: {
        lat: centerLat,
        lon: centerLon
      }
    }
  );

const history =
  response.data.history;

const first =
  history[0]?.ndvi || 0;

const last =
  history[
    history.length - 1
  ]?.ndvi || 0;

let trendStatus =
  "STABLE";

let trendMessage =
  "Vegetation stable.";

if (last > first + 0.10) {

  trendStatus =
    "RECOVERING";

  trendMessage =
    "Vegetation health improving.";

}
else if (
  last < first - 0.10
) {

  trendStatus =
    "DECLINING";

  trendMessage =
    "Vegetation health decreasing.";

}

res.json({
  history,
  trendStatus,
  trendMessage
});

    } catch (err) {

      res.status(500).json({
        error:
          err.message
      });

    }
});

// =========================
// GEMINI FARM ANALYSIS
// =========================
async function getGeminiFarmAnalysis(

  farmer,
  weather,
  gis,

  diseaseRisk,
  possibleDisease,

  predictedYield,

  history,
  healthScore,
  yieldStatus,
  trend

) {

  const historyText =
    history
      .map(
        h =>
          `${h.month}: ${h.ndvi.toFixed(2)}`
      )
      .join("\n");

  const prompt = `

You are an expert agronomist.

Farm Data:

Crop: ${farmer.crop}

Location: ${farmer.location}

Farm Size: ${farmer.farm_size} acres

Current NDVI:
${gis.ndvi}

NDVI History:
${historyText}

Trend:
${trend}

Health Score:
${healthScore}

Temperature:
${weather.temperature}

Rainfall:
${weather.rainfall}

Humidity:
${weather.humidity}

Disease Risk:
${diseaseRisk}

Possible Disease:
${possibleDisease}

Predicted Yield:
${predictedYield}

Yield Status:
${yieldStatus}

Return ONLY JSON.

{
  "status":"",
  "risk":"",
  "actions":[
    "",
    "",
    ""
  ]
}

No markdown.
No explanation.
No extra text.

`;

  const response =
    await ai.models.generateContent({

      model:
        "gemini-2.5-flash",

      contents:
        prompt

    });

  return response.text;
}

// ==========================
// ADVISORY (FULL GIS + NDVI + HEATMAP)
// ==========================
app.get("/advisory/:id", async (req, res) => {
  try {
    const doc = await db.collection("farmers").doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    const farmer = doc.data();
    let centerLat = farmer.lat;
let centerLon = farmer.lon;

if (
  (!centerLat || !centerLon) &&
  farmer.geometry &&
  farmer.geometry.points &&
  farmer.geometry.points.length > 0
) {
  centerLat = farmer.geometry.points[0].lat;
  centerLon = farmer.geometry.points[0].lon;
}


    // =========================
    // 🌍 GIS DATA FROM FLASK
    // =========================
    const gisResponse = await axios.get(
      `${GIS_URL}/gis`,
      {
        params: {
          lat: centerLat,
          lon: centerLon
        }
      }
    );

    const gisBase = gisResponse.data;

    // =========================
    // 🌱 NDVI POINT (FALLBACK SAFE)
    // =========================
    let ndviValue = gisBase.ndvi;

    try {
      const ndviResponse = await axios.get(
        `${GIS_URL}/ndvi_point`,
        {
          params: {
            lat: centerLat,
            lon: centerLon
          }
        }
      );

      if (ndviResponse.data?.ndvi !== undefined) {
        ndviValue = ndviResponse.data.ndvi;
      }
    } catch (e) {
      console.log("NDVI point fallback used");
    }

    // =========================
    // 🗺️ NDVI HEATMAP TILE (NEW)
    // =========================
    let ndviMap = null;

    try {
      const tileResponse = await axios.post(
        `${GIS_URL}/farm_ndvi_tiles`,
        {
          points: farmer.geometry.points
        }
      );

      ndviMap = tileResponse.data.tile_url;
    } catch (e) {
      console.log("NDVI tile failed");
    }

    // =========================
// 🌦 REAL WEATHER
// =========================
const currentWeather = await getWeather(
  centerLat,
  centerLon
);
console.log("========== WEATHER ==========");
console.log(JSON.stringify(currentWeather, null, 2));
console.log("=============================");
console.log("WEATHER API RESPONSE:");
console.log(currentWeather);

const weather = {
  temperature: currentWeather.temperature_2m,
  rainfall: currentWeather.rainfall,
  humidity: currentWeather.relative_humidity_2m,
  wind_speed: currentWeather.wind_speed_10m,
  risk: ndviValue < 0.3 ? "HIGH" : "MEDIUM"
};

    // =========================
// 🧠 FINAL GIS OBJECT
// =========================
const gis = {
  ndvi: ndviValue,
  rainfall: weather.rainfall,
  temperature: weather.temperature,
  humidity: weather.humidity,
  wind_speed: weather.wind_speed,
  risk: weather.risk
};

// =========================
// HEALTH SCORE
// =========================
const crop = normalizeCrop(farmer.crop);
const rules = cropRules[crop] || {};

let healthScore = 100;

if (ndviValue < (rules.ndviMin || 0.3))
  healthScore -= 30;

if (weather.rainfall < (rules.rainfallMin || 20))
  healthScore -= 20;

if (weather.temperature > (rules.tempMax || 30))
  healthScore -= 15;

if (weather.temperature < (rules.tempMin || 15))
  healthScore -= 15;

healthScore = Math.max(0, healthScore);

// =========================
// TREND
// =========================
const trend =
  ndviValue < 0.3
    ? "DECLINING"
    : "STABLE";

// =========================
// PREDICTED RISK
// =========================
let predictedRisk = "Healthy Conditions";

if (ndviValue < 0.3) {

  predictedRisk = "Poor Vegetation Health";

} else if (
  weather.rainfall <
  (rules.rainfallMin || 20)
) {

  predictedRisk = "Water Stress";

} else if (
  weather.temperature >
  (rules.tempMax || 30)
) {

  predictedRisk = "Heat Stress";

} else if (
  weather.temperature <
  (rules.tempMin || 15)
) {

  predictedRisk = "Cold Stress";
}

// =========================
// YIELD FACTORS
// =========================
const yieldFactors = {

  maize: 6,

  beans: 2,

  wheat: 5,

  coffee: 3,

  tea: 8,

  rice: 7,

  potatoes: 12,

  sorghum: 4

};

const cropFactor =
  yieldFactors[crop] || 4;

/// =========================
// PREDICTED YIELD
// =========================
const farmSize =
parseFloat(
  farmer.farm_size || 1
);

let weatherFactor = 1;

if (
weather.rainfall <
(rules.rainfallMin || 20)
) {
weatherFactor -= 0.15;
}

if (
weather.temperature >
(rules.tempMax || 30)
) {
weatherFactor -= 0.10;
}

const predictedYield =
(
farmSize *
ndviValue *
cropFactor *
weatherFactor
).toFixed(2) + " tonnes";

let yieldStatus = "GOOD";

if (
  parseFloat(predictedYield) <
  farmSize * cropFactor * 0.4
) {

  yieldStatus = "POOR";

}
else if (
  parseFloat(predictedYield) <
  farmSize * cropFactor * 0.7
) {

  yieldStatus = "AVERAGE";

}

// =========================
// DISEASE RISK ENGINE
// =========================
let diseaseRisk = "LOW";
let possibleDisease = "None detected";

if (
  weather.humidity > 80 &&
  ndviValue < 0.35
) {

  diseaseRisk = "HIGH";

  if (crop === "maize") {

    possibleDisease =
      "Maize Leaf Rust";

  }
  else if (crop === "potatoes") {

    possibleDisease =
      "Late Blight";

  }
  else if (crop === "beans") {

    possibleDisease =
      "Bean Anthracnose";

  }
  else if (crop === "coffee") {

    possibleDisease =
      "Coffee Leaf Rust";

  }
  else {

    possibleDisease =
      "Fungal Disease Risk";

  }

}
else if (
  ndviValue < 0.4
) {

  diseaseRisk = "MEDIUM";

  possibleDisease =
    "Crop Stress Detected";

}

// =========================
// NDVI HISTORY
// =========================
const historyResponse =
  await axios.get(
    `${GIS_URL}/ndvi_history`,
    {
      params: {
        lat: centerLat,
        lon: centerLon
      }
    }
  );

const history =
  historyResponse.data.history;

// =========================
// RECOMMENDATIONS
// =========================
let aiData = {
  status: "AI temporarily unavailable",
  risk: "Unknown",
  actions: [
    "Retry analysis later"
  ]
};

try {

  const aiAdvice =
    await getGeminiFarmAnalysis(
      farmer,
      weather,
      gis,
      diseaseRisk,
      possibleDisease,
      predictedYield,
      history,
      healthScore,
      yieldStatus,
      trend
    );

  aiData = JSON.parse(aiAdvice);

} catch (e) {

  console.log(
    "Gemini failed:",
    e.message
  );

}

// =========================
// ALERTS ENGINE
// =========================
const alerts = [];

if (diseaseRisk === "HIGH") {

  alerts.push({
    type: "danger",
    message:
      "High disease risk detected."
  });

}

if (trend === "DECLINING") {

  alerts.push({
    type: "warning",
    message:
      "NDVI trend is declining."
  });

}

if (yieldStatus === "POOR") {

  alerts.push({
    type: "danger",
    message:
      "Predicted yield is poor."
  });

}

if (weather.rainfall <
    (rules.rainfallMin || 20)) {

  alerts.push({
    type: "warning",
    message:
      "Rainfall below crop requirement."
  });

}

if (weather.temperature >
    (rules.tempMax || 30)) {

  alerts.push({
    type: "warning",
    message:
      "Heat stress risk detected."
  });

}

if (alerts.length === 0) {

  alerts.push({
    type: "success",
    message:
      "No active alerts."
  });

}


// =========================
// RESPONSE
// =========================
res.json({
  farmer,
  weather,
  gis,
  alerts,
  healthScore,
  trend,
  predictedRisk,
  predictedYield,
  aiStatus:
  aiData.status,

aiRisk:
  aiData.risk,

aiActions:
  aiData.actions,
yieldStatus,

diseaseRisk,
possibleDisease,

ndvi_map: ndviMap
});

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/farmers/:id/polygon", async (req, res) => {

  try {

    await db
      .collection("farmers")
      .doc(req.params.id)
      .update({
        geometry: {
          type: "Polygon",
          points: req.body.points
        }
      });

    res.json({
      success: true
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
});

// ==========================
// ASK AGRONOMIST (GEMINI)
// ==========================
app.post(
  "/ask-agronomist",
  async (req, res) => {

    try {

      const question =
        req.body.question || "";

      const crop =
        req.body.crop || "Unknown";

      const location =
        req.body.location || "Unknown";

      const prompt = `

You are an expert agronomist.

Farm Information:

Crop:
${crop}

Location:
${location}

Farmer Question:
${question}

Instructions:

- Give practical advice
- Keep answer under 120 words
- Focus on the crop provided
- Avoid technical jargon
- Give actionable recommendations
- Do not mention you are an AI

`;

      const response =
        await ai.models.generateContent({

          model:
            "gemini-2.5-flash",

          contents:
            prompt

        });

      res.json({

        answer:
          response.text,

        crop,

        location

      });

    } catch (err) {

      res.status(500).json({

        error:
          err.message

      });

    }

  }
);

// ==========================
// START SERVER
// ==========================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});