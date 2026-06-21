const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const dotenv = require("dotenv").config();
const cors = require("cors");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });

    const myDB = client.db("arts-hub");
    const artworkCollection = myDB.collection("artworks");
    const userCollection = myDB.collection("user");
    const orderCollection = myDB.collection("order");
    const planPurchaseCollection = myDB.collection("planPurchases");
    const commentCollection = myDB.collection("comments");
    const planCollection = myDB.collection("plans");

    // Artwork api
    app.post("/api/artworks", async (req, res) => {
      try {
        const artwork = req.body;

        // createdAt add করা
        artwork.createdAt = new Date();

        const myDB = client.db("arts-hub");
        const artworkCollection = myDB.collection("artworks");

        const result = await artworkCollection.insertOne(artwork);

        res.send({
          success: true,
          message: "Artwork added successfully",
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          success: false,
          message: "Failed to add artwork",
        });
      }
    });

    app.get("/api/artworks", async (req, res) => {
      try {
        const {
          page = 1,
          limit = 9,
          artistId,
          category,
          search,
          sortByPrice,
        } = req.query;

        

        const skip = Number(page - 1) * Number(limit);

        const query = {};

        if (artistId) {
          query.artistId = artistId;
        }

        if (category && category !== "all") {
          query.category = category;
        }

        if (search) {
          query.$or = [
            { title: { $regex: search, $options: "i" } },
            { artistName: { $regex: search, $options: "i" } },
          ];
        }

        let sortOption = { createdAt: -1 }; // default newest first

        if (sortByPrice === "asc") {
          sortOption = { price: 1 };
        } else if (sortByPrice === "desc") {
          sortOption = { price: -1 };
        }

        const artworks = await artworkCollection
          .find(query)
          .skip(skip)
          .limit(Number(limit))
          .sort(sortOption)
          .toArray();

        res.send({
          success: true,
          count: artworks.length,
          data: artworks,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          success: false,
          message: "Failed to fetch artworks",
        });
      }
    });

    app.patch("/api/artworks/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const updateData = req.body;

        const result = await artworkCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              ...updateData,
              updatedAt: new Date(),
            },
          },
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Artwork not found",
          });
        }

        res.send({
          success: true,
          message: "Artwork updated successfully",
          modifiedCount: result.modifiedCount,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          success: false,
          message: "Failed to update artwork",
        });
      }
    });

    app.delete("/api/artworks/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await artworkCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(403).send({
            success: false,
            message: "Not allowed or artwork not found",
          });
        }

        res.send({
          success: true,
          message: "Artwork deleted successfully",
          deletedCount: result.deletedCount,
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to delete artwork",
        });
      }
    });
    app.get("/api/artworks/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const artwork = await artworkCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!artwork) {
          return res.status(404).send({
            success: false,
            message: "Artwork not found",
          });
        }

        res.send({
          success: true,
          data: artwork,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          success: false,
          message: "Failed to fetch artwork details",
        });
      }
    });

    // Top artist api
    app.get("/api/top-artist", async (req, res) => {
      try {
        const { artistId } = req.query;

        const matchStage = {};

        if (artistId) {
          matchStage.artistId = artistId;
        }

        const result = await artworkCollection
          .aggregate([
            // 1. optional filter
            {
              $match: matchStage,
            },

            // 2. group by artist
            {
              $group: {
                _id: "$artistId",
                totalArtworks: { $sum: 1 },
                artistName: { $first: "$artistName" },
              },
            },

            // 3. sort
            {
              $sort: { totalArtworks: -1 },
            },
          ])
          .toArray();

        res.send({
          success: true,
          data: result,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          success: false,
          message: "Failed to fetch top artist",
        });
      }
    });

    // Users api
    app.get("/api/users", async (req, res) => {
      try {
        const { role } = req.query;

        const query = {};

        if (role) {
          query.role = role;
        }

        const users = await userCollection.find(query).toArray();

        res.send({
          success: true,
          count: users.length,
          data: users,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to fetch users",
        });
      }
    });

    app.get("/api/users/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const user = await userCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!user) {
          return res.status(404).send({
            success: false,
            message: "User not found",
          });
        }

        res.send({
          success: true,
          data: user,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          success: false,
          message: "Failed to fetch user",
        });
      }
    });

    app.patch("/api/users/:id/plan", async (req, res) => {
      try {
        const { id } = req.params;
        const { planId } = req.body;

        if (!planId) {
          return res.status(400).send({
            success: false,
            message: "planId is required",
          });
        }

        const result = await userCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              plan: planId,
              updatedAt: new Date(),
            },
          },
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "User not found",
          });
        }

        res.send({
          success: true,
          message: "User plan updated successfully",
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          success: false,
          message: "Failed to update plan",
        });
      }
    });

    app.patch("/api/users/:id/role", async (req, res) => {
      try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ["buyer", "artist", "admin"];

        if (!role || !validRoles.includes(role)) {
          return res.status(400).send({
            success: false,
            message: "Invalid role",
          });
        }

        const rolePlanMap = {
          buyer: "buyer-free",
          artist: "artist-free",
        };

        const plan = rolePlanMap[role];

        const result = await userCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              role,
              plan,
              updatedAt: new Date(),
            },
          },
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "User not found",
          });
        }

        res.send({
          success: true,
          message: "User role and plan updated successfully",
          data: { role, plan },
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to update role",
        });
      }
    });

    // Order api
    app.post("/api/orders", async (req, res) => {
      try {
        const order = req.body;

        order.createdAt = new Date();

        const result = await orderCollection.insertOne(order);

        res.send({
          success: true,
          message: "Order created successfully",
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to create order",
        });
      }
    });

    app.get("/api/orders", async (req, res) => {
      try {
        const { buyerId, artistId } = req.query;

        const query = {};

        if (buyerId) {
          query.buyerId = buyerId;
        }

        if (artistId) {
          query.artistId = artistId;
        }

        const orders = await orderCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();

        res.send({
          success: true,
          count: orders.length,
          data: orders,
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to fetch orders",
        });
      }
    });

    app.get("/api/orders/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const order = await orderCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!order) {
          return res.status(404).send({
            success: false,
            message: "Order not found",
          });
        }

        res.send({
          success: true,
          data: order,
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to fetch order",
        });
      }
    });

    // Top selling api
    app.get("/api/top-selling-artists", async (req, res) => {
      try {
        const { artistId } = req.query;

        const matchStage = {};

        if (artistId) {
          matchStage.artistId = artistId;
        }

        const result = await orderCollection
          .aggregate([
            // 1. filter stage (optional)
            {
              $match: matchStage,
            },

            // 2. group stage
            {
              $group: {
                _id: "$artistId",
                artistName: { $first: "$artistName" },
                totalSales: { $sum: 1 },
                totalRevenue: {
                  $sum: { $toDouble: "$price" },
                },
              },
            },

            // 3. sort
            {
              $sort: { totalSales: -1 },
            },
          ])
          .toArray();

        res.send({
          success: true,
          data: result,
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to fetch top selling artists",
        });
      }
    });

    // Comment api
    app.post("/api/comments", async (req, res) => {
      try {
        const comment = req.body;

        if (!comment.artworkId || !comment.text) {
          return res.status(400).send({
            success: false,
            message: "artworkId and text are required",
          });
        }

        comment.createdAt = new Date();

        const result = await commentCollection.insertOne(comment);

        res.send({
          success: true,
          message: "Comment added successfully",
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to add comment",
        });
      }
    });

    app.get("/api/comments", async (req, res) => {
      try {
        const { artworkId } = req.query;

        const query = {};

        if (artworkId) {
          query.artworkId = artworkId;
        }

        const comments = await commentCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();

        res.send({
          success: true,
          count: comments.length,
          data: comments,
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to fetch comments",
        });
      }
    });

    app.delete("/api/comments/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await commentCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Comment not found",
          });
        }

        res.send({
          success: true,
          message: "Comment deleted successfully",
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to delete comment",
        });
      }
    });

    // Plans api

    app.get("/api/plans", async (req, res) => {
      try {
        const { planId } = req.query;

        if (planId) {
          const plan = await planCollection.findOne({ planId });

          if (!plan) {
            return res.status(404).send({ error: "Plan not found" });
          }

          return res.send(plan);
        }

        // যদি planId না থাকে → সব plans
        const result = await planCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Server error" });
      }
    });

    app.post("/api/plan-purchases", async (req, res) => {
      try {
        const purchase = req.body;

        if (!purchase.buyerId || !purchase.planId) {
          return res.status(400).send({
            success: false,
            message: "userId and planId are required",
          });
        }

        purchase.createdAt = new Date();
        purchase.status = purchase.status || "active";

        const result = await planPurchaseCollection.insertOne(purchase);

        res.send({
          success: true,
          message: "Plan purchased successfully",
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          success: false,
          message: "Failed to purchase plan",
        });
      }
    });

    app.get("/api/plan-purchases", async (req, res) => {
      try {
        const { userId, artistId, planId } = req.query;

        const query = {};

        if (userId) query.userId = userId;
        if (artistId) query.artistId = artistId;
        if (planId) query.planId = planId;

        const result = await planPurchaseCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();

        res.send({
          success: true,
          count: result.length,
          data: result,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          success: false,
          message: "Failed to fetch plan purchases",
        });
      }
    });

    app.get("/api/plan-purchases/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await planPurchaseCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!result) {
          return res.status(404).send({
            success: false,
            message: "Plan purchase not found",
          });
        }

        res.send({
          success: true,
          data: result,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          success: false,
          message: "Failed to fetch plan purchase",
        });
      }
    });

    app.get("/api/plan-purchases/check", async (req, res) => {
      try {
        const { userId, planId } = req.query;

        const existing = await planPurchaseCollection.findOne({
          userId,
          planId,
          paymentStatus: "paid",
        });

        res.send({
          success: true,
          exists: !!existing,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to check plan purchase",
        });
      }
    });

    // Stats api
    // Dashboard Stats API
    app.get("/api/stats", async (req, res) => {
      try {
        // Total Users
        const totalUsers = await userCollection.countDocuments();

        // Total Artists
        const totalArtists = await userCollection.countDocuments({
          role: "artist",
        });

        // Total Artworks Sold
        const totalArtworksSold = await orderCollection.countDocuments();

        // Total Revenue
        const revenueResult = await orderCollection
          .aggregate([
            {
              $group: {
                _id: null,
                totalRevenue: {
                  $sum: { $toDouble: "$price" },
                },
              },
            },
          ])
          .toArray();

        const totalRevenue =
          revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        res.send({
          success: true,
          data: {
            totalUsers,
            totalArtists,
            totalArtworksSold,
            totalRevenue,
          },
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to fetch dashboard stats",
        });
      }
    });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
