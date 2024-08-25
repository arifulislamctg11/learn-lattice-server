const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = (client) => {
    const router = express.Router();
    const db = client.db('LearnLatticeDB'); // Replace with your database name
    const collection = db.collection('sessionReviews'); // Replace with your collection name

    router.get('/averageRating/:id', async (req, res) => {
        const sessionId = req.params.id;
        try {
            const result = await collection.aggregate([
                { $match: { sessionId: sessionId } }, // Match documents with the given sessionId
                {
                    $group: {
                        _id: "$sessionId", // Group by sessionId
                        averageRating: { $avg: "$rating" } // Calculate the average of the rating field
                    }
                }
            ]).toArray();
            // console.log('resul is logging from line 22', result)
            if (result.length > 0) {
                const roundedAverageRating = Math.round(parseFloat(result[0].averageRating));
                res.json({averageRating: roundedAverageRating });
            } else {
                res.json({ sessionId: sessionId, averageRating: null }); // No ratings found
            }
        } catch (error) {
            // console.error("Error calculating average rating: ", error);
            res.status(500).send("Internal Server Error");
        }
    });

    router.post('/', async (req, res) => {
        const item = req.body;
        const result = await collection.insertOne(item);
        res.send(result);
    })

    // Route to check if a session review exists by email and sessionId
    router.post('/isReviewed', async (req, res) => {
        const { userEmail, sessionId } = req.body;
        const query = { userEmail, sessionId };
        const review = await collection.findOne(query);
        if (review) {
            res.send([ review ,true]);
        } else {
            res.send(false);
        }
    });



    router.get('/:id', (req, res) => {
        res.send(`Product details for ID: ${req.params.id}`);
    });

    return router;
}
