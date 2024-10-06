const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();


const port = process.env.PORT || 5000;

// middleware
// app.use(cors());
app.use(cors({
  origin: [process.env.cors_origin , 'http://localhost:5000']
}));
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kihouyb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7) 
    // await client.connect();  

    const userCollection = client.db("LearnLatticeDB").collection("users");
    const sessionCollection = client.db("LearnLatticeDB").collection("sessions");
    const tutorsCollection = userCollection.find({ role: "tutor" }).toArray();
    const bookedSessionCollection = client.db("LearnLatticeDB").collection("BookedSessions");
    const materialCollection = client.db("LearnLatticeDB").collection("materials");
    const reviewCollection = client.db("LearnLatticeDB").collection("reviews");
    const cartCollection = client.db("LearnLatticeDB").collection("carts");
    const paymentCollection = client.db("LearnLatticeDB").collection("payments");
    const menuCollection = client.db("LearnLatticeDB").collection("menu");

    // jwt related api   
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })

    // middlewares  
    const verifyToken = (req, res, next) => {
      // console.log('inside verify token', req.headers.authorization); 
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }

    // use verify admin after verifyToken 
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        // return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }

    // use verify tutor after verifyToken 
    const verifyTutor = async (req, res, next) => {
      const email = req?.decoded?.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isTutor = user?.role === 'tutor';
      if (!isTutor) {
        // return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }

    // use verify student after verifyToken
    const verifyStudent = async (req, res, next) => {
      const email = req?.decoded?.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isStudent = user?.role === 'student';
      if (!isStudent) {
        // return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }



    // tutor public apis  
    app.get('/tutorByMail/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    // users related api 
    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // checking tutor
    app.get('/tutors', async (req, res) => {
      const result = await tutorsCollection;
      // console.log(result)
      res.send(result);
    });



    app.get('/users/tutor/:email', verifyToken, verifyTutor, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let tutor = false;
      if (user) {
        tutor = user?.role === 'tutor';
      }
      res.send({ tutor });
    })

    // student checker 
    app.get('/users/student/:email', verifyToken, verifyStudent, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let student = false;
      if (user) {
        student = user?.role === 'student';
      }
      res.send({ student });
    })


    //  user role modifier 
    app.patch('/user/role/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const user = req.body;
      // console.log(user.role)
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: user.role
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })


    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        // return res.status(403).send({ message: 'forbidden access' })  
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      // insert email if user doesnt exists: 
      // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })

    // session related apis  
    app.post('/bookedSession', verifyToken, verifyTutor, async (req, res) => {
      const item = req.body;
      // console.log('from booked Session  !', item)
      const result = await bookedSessionCollection.insertOne(item);
      res.send(result);
    });

    app.post('/isSessionBooked', async (req, res) => {
      const session = req.body;
      const id = session.id;
      const filter = { sessionId: id, userEmail: session.userEmail }
      const result = await bookedSessionCollection.find(filter).toArray();
      res.send(result)
    });



    app.get('/session', async (req, res) => {
      const result = await sessionCollection.find().toArray();
      res.send(result);
    });

    app.get('/approvedSessions', async (req, res) => {
      const query = { status: 'approved' }
      const result = await sessionCollection.find(query).toArray();
      res.send(result);
    });

    // api for tutor only      
    app.get('/approvedSessions', async (req, res) => {
      const query = { status: 'approved' }
      const result = await tutorsCollection.find(query).toArray();
      res.send(result);
    });


    app.get('/session/:email', verifyToken, verifyTutor, async (req, res) => {
      const email = req.params.email;
      const query = { tutor_email: email }
      const result = await sessionCollection.find(query).toArray();
      res.send(result);
    });

    // for a single session 
    app.get('/sessionById/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await sessionCollection.findOne(query);
      res.send(result);
    })

    app.get('/singleSession/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await sessionCollection.findOne(query);
      // console.log('from single session api ', result)
      res.send(result);
    })

    app.patch('/sessionReq/:id', async (req, res) => {
      const session = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          status: session?.status
        }
      }
      const result = await sessionCollection.updateOne(filter, updatedDoc)
      res.send(result);
    })


    app.post('/session', verifyToken, verifyTutor, async (req, res) => {
      const item = req.body;
      const result = await sessionCollection.insertOne(item);
      res.send(result);
    });

    app.patch('/sessionApprove/:id', async (req, res) => {
      const session = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          status: session.status,
          fee: session.fee,
        }
      }

      const result = await sessionCollection.updateOne(filter, updatedDoc)
      res.send(result);
    })

    app.patch('/sessionReject/:id', async (req, res) => {
      const session = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          status: session.status,
        }
      }

      const result = await sessionCollection.updateOne(filter, updatedDoc)
      res.send(result);
    })


    app.get('/materials', async (req, res) => {
      const result = await materialCollection.find().toArray();
      res.send(result);
    });


    app.patch('/sessionMaterials/', verifyToken, verifyTutor, async (req, res) => {
      const material = req.body;
      const result = await materialCollection.insertOne(material);
      res.send(result);
    });

    app.get('/sessionMaterials/:id', async (req, res) => {
      const id = req.params.id;
      const query = { sessionId: id }
      const result = await materialCollection.find(query).toArray();
      res.send(result);
    })
    app.get('/materialsByMail/:mail', async (req, res) => {
      const mail = req.params.mail;
      const query = { created_by: mail }
      const result = await materialCollection.find(query).toArray();
      res.send(result);
    })


    app.get('/material/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await materialCollection.findOne(query);
      res.send(result);
    })

    app.delete('/material/:id', verifyToken, verifyTutor, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await materialCollection.deleteOne(query);
      res.send(result);
    })

    app.patch('/updateMaterial/:id', async (req, res) => {
      const material = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          image: material.image,
          docLink: material.docLink,
        }
      }

      const result = await materialCollection.updateOne(filter, updatedDoc)
      res.send(result);
    })







   



    app.get('/reviews', async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    })

    // carts collection
    app.get('/carts', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.post('/carts', async (req, res) => {
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem);
      res.send(result);
    });

    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    // payment intent
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      // console.log(amount, 'amount inside the intent')

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });
      // console.log(paymentIntent.client_secret)
      res.send({
        clientSecret: paymentIntent.client_secret

      })
    });


    app.get('/payments/:email', verifyToken, async (req, res) => {
      const query = { email: req.params.email }
      if (req.params.email !== req.decoded.email) {
        // return res.status(403).send({ message: 'forbidden access' });  
      }
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const paymentResult = await paymentCollection.insertOne(payment);

      //  carefully delete each item from the cart
      // console.log('payment info', payment);
      const query = {
        _id: {
          $in: payment.cartIds.map(id => new ObjectId(id))
        }
      };
      const deleteResult = await cartCollection.deleteMany(query);
      const {email , price ,date , sessionIds} = payment;
      const insertDataToBookedSession = await bookedSessionCollection.insertOne( {userEmail: email, price: price, bookingDate: date, sessionId: sessionIds[0]})
      // console.log('inserted data from line 505',insertDataToBookedSession )
      res.send({ paymentResult, deleteResult });
    })

    // stats or analytics
    app.get('/admin-stats', verifyToken, verifyAdmin, async (req, res) => {
      const users = await userCollection.estimatedDocumentCount();
      const menuItems = await menuCollection.estimatedDocumentCount();
      const orders = await paymentCollection.estimatedDocumentCount();

      // this is not the best way
      // const payments = await paymentCollection.find().toArray();
      // const revenue = payments.reduce((total, payment) => total + payment.price, 0);

      const result = await paymentCollection.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: '$price'
            }
          }
        }
      ]).toArray();

      const revenue = result.length > 0 ? result[0].totalRevenue : 0;

      res.send({
        users,
        menuItems,
        orders,
        revenue
      })
    })


    // order status
    /**
     * ----------------------------
     *    NON-Efficient Way
     * ------------------------------
     * 1. load all the payments
     * 2. for every menuItemIds (which is an array), go find the item from menu collection
     * 3. for every item in the menu collection that you found from a payment entry (document)
    */

    // using aggregate pipeline
    app.get('/order-stats', verifyToken, verifyAdmin, async (req, res) => {
      const result = await paymentCollection.aggregate([
        {
          $unwind: '$menuItemIds'
        },
        {
          $lookup: {
            from: 'menu',
            localField: 'menuItemIds',
            foreignField: '_id',
            as: 'menuItems'
          }
        },
        {
          $unwind: '$menuItems'
        },
        {
          $group: {
            _id: '$menuItems.category',
            quantity: { $sum: 1 },
            revenue: { $sum: '$menuItems.price' }
          }
        },
        {
          $project: {
            _id: 0,
            category: '$_id',
            quantity: '$quantity',
            revenue: '$revenue'
          }
        }
      ]).toArray();

      res.send(result);

    })

     // Importing routes
    const sessionsRouter = require('./routes/bookedSessions')(client);
    const sessionReviews = require('./routes/sessionReviews')(client);
    const notes = require('./routes/notes')(client,verifyToken);
    const materials = require('./routes/materials')(client,verifyToken);
    const sessions = require('./routes/sessions')(client,verifyToken, verifyTutor);
    const users = require('./routes/users')(client,verifyToken, verifyTutor);
    // Using routes
    app.use('/bookedSessions', sessionsRouter);
    app.use('/sessionReviews', sessionReviews);
    app.use('/notes', notes);
    app.use('/materials', materials);
    app.use('/sessions', sessions);
    app.use('/users', users);

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send(`Learn Lattice is running with 0.5 meter per hours on port ${port}`)
})

app.listen(port, () => {
  console.log(`Learn Lattice is running with 0.5 meter per hours  on port ${port}`);
})

/**
 * --------------------------------
 *      NAMING CONVENTION
 * --------------------------------
 * app.get('/users')
 * app.get('/users/:id')
 * app.post('/users')
 * app.put('/users/:id')
 * app.patch('/users/:id')
 * app.delete('/users/:id')
 * 
*/