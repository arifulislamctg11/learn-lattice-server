const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = (client, verifyToken) => {
    const router = express.Router();
    const db = client.db('LearnLatticeDB'); // Replace with your database name
    const collection = db.collection('users'); // Replace with your collection name

   


    // Endpoint to get users with search functionality
    router.get('/search', async (req, res) => {
        try {
            const searchQuery = req.query.search || '';  // Get search query from request
            const regex = new RegExp(searchQuery, 'i');  // Create case-insensitive regex from search query

            // Search users by name or email using regex
            const users = await collection.find({
                $or: [
                    { name: { $regex: regex } },
                    { email: { $regex: regex } }
                ]
            }).toArray();

            res.json(users);
        } catch (error) {
            // console.error('Failed to fetch users:', error);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    });


    return router;
}

