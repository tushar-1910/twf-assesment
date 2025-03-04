const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Product Weights
const productWeights = {
  A: 3,
  B: 2,
  C: 8,
  D: 12,
  E: 25,
  F: 15,
  G: 0.5,
  H: 1,
  I: 2,
};

// Distance Matrix (Only to L1 since direct C1 <-> C3 travel is not possible)
const distances = {
  C1: 3, // Distance between C1 and L1
  C2: 2.5, // Distance between C2 and L1
  C3: 2, // Distance between C3 and L1
};

// Warehouse Stock Data
const centers = {
  C1: { A: 3, B: 2, C: 8, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0 },
  C2: { A: 0, B: 0, C: 0, D: 12, E: 25, F: 15, G: 0, H: 0, I: 0 },
  C3: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0.5, H: 1, I: 2 },
};

// Function to calculate cost per unit distance based on weight
const calculateCostPerUnit = (weight) => {
  if (weight <= 5) return 10;
  return 10 + Math.ceil((weight - 5) / 5) * 8;
};

// Function to calculate the cost of delivery
const calculateCost = (order) => {
  let totalCost = 0;
  let lastCenter = null;

  // Step 1: Get all centers that contain the required products
  let requiredCenters = {};
  for (const product in order) {
    for (const center in centers) {
      if (centers[center][product] > 0) {
        if (!requiredCenters[center]) {
          requiredCenters[center] = {};
        }
        requiredCenters[center][product] = order[product];
      }
    }
  }

  // Step 2: Process each center optimally
  for (const center in requiredCenters) {
    let centerWeight = 0;

    // If the truck is switching centers (via L1), charge empty travel cost
    if (lastCenter !== null && lastCenter !== center) {
      totalCost += distances[center] * 10; // Empty truck cost
    }

    // Compute total weight for this center
    for (const product in requiredCenters[center]) {
      centerWeight +=
        requiredCenters[center][product] * productWeights[product];
    }

    // Delivery cost from center to L1
    if (centerWeight > 0) {
      let costPerUnit = calculateCostPerUnit(centerWeight);
      totalCost += distances[center] * costPerUnit;
      lastCenter = "L1"; // After pickup, truck delivers to L1
    }
  }

  return totalCost;
};

// API Endpoint
app.post("/calculate-cost", (req, res) => {
  const order = req.body;

  if (Object.keys(order).length === 0) {
    return res.status(400).json({ error: "Order cannot be empty" });
  }

  const totalCost = calculateCost(order);
  res.json({ total_cost: totalCost });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
