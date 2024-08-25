const express = require('express');
const { ObjectId } = require('mongodb');
 
module.exports = (client, verifyToken) => {
    const router = express.Router();
    const db = client.db('LearnLatticeDB'); // Replace with your database name
    const materialsCollection = db.collection('materials'); // Replace with your collection name
    const bookedSessionCollection = db.collection('BookedSessions'); // Replace with your collection name


router.get('/:email', verifyToken, async (req, res) => {
    const { email } = req.params;
    // const db = req.app.locals.db;
    
    try {
        // Find all the booked sessions for the user
        const bookedSessions = await bookedSessionCollection.find({userEmail:email}).toArray();
        
        // Extract sessionIds from the booked sessions
        const sessionIds = bookedSessions.map(session => session.sessionId);

        // Find materials that match the sessionIds
        const materials = await db.collection('materials').find({ sessionId: { $in: sessionIds } }).toArray();

        // Structure the result
        const result = materials.map(material => ({
            image: material.image,
            downloadLink: material.image, // Image link used as download link
            docLink: material.docLink
        }));

        res.status(200).json(result);
    } catch (error) {
        // console.error("Error fetching study materials:", error);
        res.status(500).send('Server error');
    }
});


return router;
}