const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = (client) => {
    const router = express.Router();
    const db = client.db('LearnLatticeDB'); // Replace with your database name
    const collection = db.collection('BookedSessions'); // Replace with your collection name

    
    
    router.get('/', async (req, res) => {
        const { userEmail } = req.query;

        const query = { userEmail: userEmail };
        try {
            const sessions = await collection.aggregate([
                { $match: query },
                {
                    $addFields: {
                        sessionIdObj: { $toObjectId: "$sessionId" } // Convert sessionId to ObjectId
                    }
                },
                {
                    $lookup: {
                        from: 'sessions', // The name of the collection containing session details
                        localField: 'sessionIdObj',
                        foreignField: '_id',
                        as: 'sessionDetails'
                    }
                },
                {
                    $unwind: '$sessionDetails' // Unwind the array to get objects directly
                },
                {
                    $project: {
                        sessionId: 0, // Hide the sessionId field if you don't need it
                        sessionIdObj: 0 // Hide the sessionIdObj field
                    }
                }
            ]).toArray();
            res.json(sessions); // Send the sessions data as JSON 
        } catch (error) {
            res.status(500).send('Error fetching sessions');
        }
    });


      // Route to check if a session review exists by email and sessionId
      router.post('/isSessionBooked', async (req, res) => {
        const { userEmail, sessionId } = req.body;
        const query = { userEmail, sessionId };
        const bookedSession = await collection.findOne(query);
        if (bookedSession) {
            res.send([ bookedSession ,true]);
        } else {
            res.send(false);
        }
    });

    router.get('/:id', (req, res) => {
        res.send(`Product  details for ID: ${req.params.id}`);
    });

    return router;
}
