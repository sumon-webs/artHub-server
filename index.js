const express = require("express");
const app = express();
const port = 5000;
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
    const commentCollection = myDB.collection("comments");

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
        const { artistId, category, search, sortByPrice } = req.query;

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
        const { artistId } = req.body;

        const result = await artworkCollection.deleteOne({
          _id: new ObjectId(id),
          artistId: artistId,
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
