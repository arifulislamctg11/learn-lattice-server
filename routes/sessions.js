const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = (client, verifyToken, verifyTutor) => {

    const router = express.Router();
    const db = client.db('LearnLatticeDB'); // Replace with your database name
    const collection = db.collection('sessions'); // Replace with your collection name



    router.get('/createdBy/:email', verifyToken, verifyTutor, async (req, res) => {
        const email = req.params.email;
        const query = { tutor_email: email }
        const result = await collection.find(query).toArray();
        res.send(result);
    });

    router.get('/approved/createdBy/:email', verifyToken, verifyTutor, async (req, res) => {
        const email = req.params.email;
        const query = { tutor_email: email, status: 'approved' }
        const result = await collection.find(query).toArray();
        res.send(result);
    });

    router.get('/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await collection.findOne(query);
        res.send(result);
    })


    router.patch('/:id', async (req, res) => {
        const session = req.body;
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) }
        const updatedDoc = {
          $set: {
            title: session.title,
            tutor_name: session.tutor_name,
            tutor_email: session.tutor_email,
            sessionDescription: session.sessionDescription,
            registrationStartDate: session.registrationStartDate,
            registrationEndDate: session.registrationEndDate,
            classStartDate: session.classStartDate,
            classEndDate: session.classEndDate,
            classDuration: session.classDuration,
            fee: session.fee,
            status: session.status
          }
        }
  
        const result = await collection.updateOne(filter, updatedDoc)
        res.send(result);
      })

    // router.post('/', async (req, res) => {
    //     const item = req.body; 
    //     const result = await collection.insertOne(item);
    //     res.send(result);
    // })

    // router.get('/:email', verifyToken, async (req, res) => {
    //     const email = req.params.email;
    //     console.log(email)
    //     const query = { userEmail: email }
    //     const result = await collection.find(query).toArray();
    //     res.send(result);
    // });


    router.delete('/:id', verifyToken, async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await collection.deleteOne(query);
        res.send(result);
    })


    // for a single session 
    // router.get('/byId/:id', async (req, res) => {
    //     const id = req.params.id;
    //     console.log('im heating anyway from notes.js line number 35', id)
    //     const query = { _id: new ObjectId(id) }
    //     const result = await collection.findOne(query);
    //     res.send(result);
    // })


    return router;
}



















