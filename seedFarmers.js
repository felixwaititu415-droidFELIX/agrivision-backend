const db = require("./firebase");

const farmers = [
  {
    name: "Pius Kirui",
    location: "Eldoret",
    crop: "wheat",
    farm_size: "2.7",
    lat: 0.52,
    lon: 35.27,
    geometry: {
      type: "Polygon",
      points: [
        { lon: 35.27, lat: 0.52 },
        { lon: 35.28, lat: 0.52 },
        { lon: 35.28, lat: 0.53 },
        { lon: 35.27, lat: 0.53 },
        { lon: 35.27, lat: 0.52 }
      ]
    }
  },

  {
    name: "Jane Wambui",
    location: "Nakuru",
    crop: "maize",
    farm_size: "3.1",
    lat: -1.25,
    lon: 36.85,
    geometry: {
      type: "Polygon",
      points: [
        { lon: 36.85, lat: -1.25 },
        { lon: 36.86, lat: -1.25 },
        { lon: 36.86, lat: -1.24 },
        { lon: 36.85, lat: -1.24 },
        { lon: 36.85, lat: -1.25 }
      ]
    }
  },

  {
    name: "Samuel Kiptoo",
    location: "Kitale",
    crop: "maize",
    farm_size: "4.2",
    lat: 1.02,
    lon: 35.00,
    geometry: {
      type: "Polygon",
      points: [
        { lon: 35.00, lat: 1.02 },
        { lon: 35.01, lat: 1.02 },
        { lon: 35.01, lat: 1.03 },
        { lon: 35.00, lat: 1.03 },
        { lon: 35.00, lat: 1.02 }
      ]
    }
  },

  {
    name: "Grace Chebet",
    location: "Kericho",
    crop: "tea",
    farm_size: "3.5",
    lat: -0.37,
    lon: 35.28,
    geometry: {
      type: "Polygon",
      points: [
        { lon: 35.28, lat: -0.37 },
        { lon: 35.29, lat: -0.37 },
        { lon: 35.29, lat: -0.36 },
        { lon: 35.28, lat: -0.36 },
        { lon: 35.28, lat: -0.37 }
      ]
    }
  },

  {
    name: "Peter Mwangi",
    location: "Nyeri",
    crop: "coffee",
    farm_size: "2.1",
    lat: -0.42,
    lon: 36.95,
    geometry: {
      type: "Polygon",
      points: [
        { lon: 36.95, lat: -0.42 },
        { lon: 36.96, lat: -0.42 },
        { lon: 36.96, lat: -0.41 },
        { lon: 36.95, lat: -0.41 },
        { lon: 36.95, lat: -0.42 }
      ]
    }
  },

  {
    name: "David Ochieng",
    location: "Kisumu",
    crop: "rice",
    farm_size: "5.0",
    lat: -0.09,
    lon: 34.76,
    geometry: {
      type: "Polygon",
      points: [
        { lon: 34.76, lat: -0.09 },
        { lon: 34.77, lat: -0.09 },
        { lon: 34.77, lat: -0.08 },
        { lon: 34.76, lat: -0.08 },
        { lon: 34.76, lat: -0.09 }
      ]
    }
  },

  {
    name: "Mary Atieno",
    location: "Homa Bay",
    crop: "sorghum",
    farm_size: "3.8",
    lat: -0.53,
    lon: 34.45,
    geometry: {
      type: "Polygon",
      points: [
        { lon: 34.45, lat: -0.53 },
        { lon: 34.46, lat: -0.53 },
        { lon: 34.46, lat: -0.52 },
        { lon: 34.45, lat: -0.52 },
        { lon: 34.45, lat: -0.53 }
      ]
    }
  },

  {
    name: "Brian Mutua",
    location: "Machakos",
    crop: "maize",
    farm_size: "2.9",
    lat: -1.52,
    lon: 37.26,
    geometry: {
      type: "Polygon",
      points: [
        { lon: 37.26, lat: -1.52 },
        { lon: 37.27, lat: -1.52 },
        { lon: 37.27, lat: -1.51 },
        { lon: 37.26, lat: -1.51 },
        { lon: 37.26, lat: -1.52 }
      ]
    }
  },

  {
    name: "Susan Akinyi",
    location: "Bungoma",
    crop: "sugarcane",
    farm_size: "4.5",
    lat: 0.56,
    lon: 34.56,
    geometry: {
      type: "Polygon",
      points: [
        { lon: 34.56, lat: 0.56 },
        { lon: 34.57, lat: 0.56 },
        { lon: 34.57, lat: 0.57 },
        { lon: 34.56, lat: 0.57 },
        { lon: 34.56, lat: 0.56 }
      ]
    }
  },

  {
    name: "Kevin Rotich",
    location: "Nandi",
    crop: "maize",
    farm_size: "3.2",
    lat: 0.10,
    lon: 35.20,
    geometry: {
      type: "Polygon",
      points: [
        { lon: 35.20, lat: 0.10 },
        { lon: 35.21, lat: 0.10 },
        { lon: 35.21, lat: 0.11 },
        { lon: 35.20, lat: 0.11 },
        { lon: 35.20, lat: 0.10 }
      ]
    }
  },

  {
    name: "Esther Njeri",
    location: "Thika",
    crop: "pineapple",
    farm_size: "2.4",
    lat: -1.04,
    lon: 37.07,
    geometry: {
      type: "Polygon",
      points: [
        { lon: 37.07, lat: -1.04 },
        { lon: 37.08, lat: -1.04 },
        { lon: 37.08, lat: -1.03 },
        { lon: 37.07, lat: -1.03 },
        { lon: 37.07, lat: -1.04 }
      ]
    }
  },

  {
    name: "John Kamau",
    location: "Nyandarua",
    crop: "potatoes",
    farm_size: "3.9",
    lat: -0.18,
    lon: 36.35,
    geometry: {
      type: "Polygon",
      points: [
        { lon: 36.35, lat: -0.18 },
        { lon: 36.36, lat: -0.18 },
        { lon: 36.36, lat: -0.17 },
        { lon: 36.35, lat: -0.17 },
        { lon: 36.35, lat: -0.18 }
      ]
    }
  },

  {
    name: "Faith Muthoni",
    location: "Embu",
    crop: "coffee",
    farm_size: "2.6",
    lat: -0.52,
    lon: 37.45,
    geometry: {
      type: "Polygon",
      points: [
        { lon: 37.45, lat: -0.52 },
        { lon: 37.46, lat: -0.52 },
        { lon: 37.46, lat: -0.51 },
        { lon: 37.45, lat: -0.51 },
        { lon: 37.45, lat: -0.52 }
      ]
    }
  },

  {
    name: "Ali Hassan",
    location: "Garissa",
    crop: "watermelon",
    farm_size: "6.0",
    lat: -0.46,
    lon: 39.64,
    geometry: {
      type: "Polygon",
      points: [
        { lon: 39.64, lat: -0.46 },
        { lon: 39.65, lat: -0.46 },
        { lon: 39.65, lat: -0.45 },
        { lon: 39.64, lat: -0.45 },
        { lon: 39.64, lat: -0.46 }
      ]
    }
  }
];

async function seed() {
  try {
    console.log("🚀 Starting 20 farmer import...");

    for (const farmer of farmers) {
      const docRef = await db.collection("farmers").add({
        ...farmer,
        createdAt: new Date()
      });

      console.log(`✅ Added ${farmer.name} (${docRef.id})`);
    }

    console.log("🎉 Seeding complete!");
    process.exit(0);

  } catch (err) {
    console.error("❌ Error seeding farmers:");
    console.error(err);
    process.exit(1);
  }
}

seed();