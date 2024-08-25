const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = (client, verifyToken) => {
    const router = express.Router();
    const db = client.db('LearnLatticeDB'); // Replace with your database name
    const collection = db.collection('notes'); // Replace with your collection name

    router.post('/', async (req, res) => {
        const item = req.body;
        const result = await collection.insertOne(item);
        res.send(result);
    })

    router.get('/:email', verifyToken, async (req, res) => {
        const email = req.params.email;
        // console.log(email)
        const query = { userEmail: email }
        const result = await collection.find(query).toArray();
        res.send(result);
    });


    router.delete('/:id', verifyToken, async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await collection.deleteOne(query);
        res.send(result);
    })
    
    
    // for a single session 
    router.get('/byId/:id', async (req, res) => {
        const id = req.params.id;
        // console.log('im heating anyway from notes.js line number 35' , id)
        const query = { _id: new ObjectId(id) }
        const result = await collection.findOne(query);
        res.send(result);
    })


    return router;
}
