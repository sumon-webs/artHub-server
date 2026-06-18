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

        const result = await artworkCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Artwork not found",
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
