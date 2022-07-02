
//import
const express = require('express');
const cors = require('cors')
const app = express();
const bodyParser = require('body-parser')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId
const port = process.env.PORT || 4000
const jwt = require('jsonwebtoken');


//middleware
app.use(bodyParser.json())
//app.use(cors())
const corsConfig = {
    origin: true,
    credentials: true,
  }
  app.use(cors(corsConfig))
  app.options('*', cors(corsConfig))

console.log(process.env.ACCESS_JWT_TOKEN);
 //get secret key : require('crypto').randomBytes(64).toString('hex')
  function checkJwt(req, res, next) {
    const hederAuth = req.headers.authorization
    if (!hederAuth) {
        return res.status(401).send({ message: 'unauthorized access.try again' })
    }
    else {
        const token = hederAuth.split(' ')[1]
     //   console.log({token});
        jwt.verify(token,process.env.ACCESS_JWT_TOKEN, (err, decoded) => {
            if (err) {
               // console.log(err);
                return res.status(403).send({ message: 'forbidden access' })
            }
        //    console.log('decoded', decoded);
            req.decoded = decoded;
            next()
        })
    }
  //  console.log(hederAuth, 'inside chckjwt');
   
}

//connect to db



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.eowzq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {

        await client.connect();
        const packageCollection = client.db('royal').collection('package')
        const ordersCollection = client.db('royal').collection("ordersCollection");
        const usersCollection = client.db('royal').collection('users')
        const reviewsCollection = client.db('royal').collection("reviewsCollection");
        console.log('royal db');


        //Verify Admin Role 
        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await usersCollection.findOne({
                email: requester,
            });
            if (requesterAccount.role === "admin") {
                next();
            } else {
                res.status(403).send({ message: "Forbidden" });
            }
        };
    
        ////API to get all package
        app.get("/package", async (req, res) => {
            const package = await packageCollection.find({}).toArray();
            res.send(package);
        });
        //post order
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order)
            res.send(result)
        })
        //get all order
        app.get("/order", async (req, res) => {
            const orders = await ordersCollection.find({}).toArray();
            res.send(orders);
        });

  //get orders by email 
  app.get('/singleOrder', checkJwt, async (req, res) => {
    const decodedEmail = req.decoded.email
      const email = req.query.email
      //console.log(email,'email-got');
    if (email === decodedEmail) {
        const query = { email: email }
    const cursor = ordersCollection.find(query)
    const items = await cursor.toArray()
    res.send(items)
    }
    else {
        return res.status(403).send({ message: 'forbidden access' })
    }
   })
  //my order delete 
  app.delete("/myorder/:id", checkJwt, async (req, res) => {
    const decodedEmail = req.decoded.email;
    const id = req.params.id;
    const email = req.headers.email;
    if ( decodedEmail) {
        
      const result =  await ordersCollection.deleteOne({ _id: ObjectId(id) });
        res.send(result);
    } else {
        res.send("Unauthorized access");
    }
});
        //create user

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body
            const filter = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options)
            const getToken = jwt.sign({ email: email }, process.env.ACCESS_JWT_TOKEN, { expiresIn: '7d' })
            res.send({ result, getToken })
        })
        //get user information
        app.get('/user', checkJwt, async (req, res) => {
            const users = await usersCollection.find().toArray()
            res.send(users)
        })

     
        //make admin
        app.put('/user/admin/:email', checkJwt,  async (req, res) => {
         
            const email = req.params.email;
            const filter = { email: email }
            const updateDoc = {
                $set: { role: 'admin' },
            };
            const result = await usersCollection.updateOne(filter, updateDoc,)
        
            res.send(result)
        
        })
        //API to get user by user email
app.get('/user/:email', checkJwt, async (req, res) => {
    const decodedEmail = req.decoded.email;
    const email = req.params.email;
    // console.log("email", email);
    if (email === decodedEmail) {
        const query = { email: email }
        const cursor = usersCollection.find(query)
        const items = await cursor.toArray()
        res.send(items)
    }
    else {
        // console.log(param);
        return res.status(403).send({ message: 'forbidden access' })

    }
})
        
  //API to get admin 
  app.get("/admin/:email", async (req, res) => {
    const email = req.params.email;
    const user = await usersCollection.findOne({ email: email });
    const isAdmin = user.role === "admin";
    res.send({ admin: isAdmin });
});

          //API to get all reviews 
          app.get("/reviews", async (req, res) => {
            const reviews = await reviewsCollection.find({}).toArray();
            res.send(reviews);
        });
        //API to post a review 
        app.post('/review', async (req, res) => {

            const newReview = req.body;
            
            const result = await reviewsCollection.insertOne(newReview);
            res.send(result)
        })





        
    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('royal is connected!')

})

//check 
app.listen(port, () => {
    console.log(`server is running ${port}`)
})