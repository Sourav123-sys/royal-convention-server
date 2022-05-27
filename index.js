
//import
const express = require('express');
const cors = require('cors')
const app = express();
const bodyParser = require('body-parser')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId
const port = process.env.PORT || 4000

//middleware
app.use(bodyParser.json())
//app.use(cors())
const corsConfig = {
    origin: true,
    credentials: true,
  }
  app.use(cors(corsConfig))
  app.options('*', cors(corsConfig))


 


//connect to db



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.eowzq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {

        await client.connect();
        const packageCollection = client.db('royal').collection('package')
        const ordersCollection = client.db('royal').collection("ordersCollection");
 console.log('royal db');


         ////API to get all package
         app.get("/package", async (req, res) => {
            const package = await packageCollection.find({}).toArray();
            res.send(package);
        });
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order)
            res.send(result)
        })
        app.get("/order", async (req, res) => {
            const orders = await ordersCollection.find({}).toArray();
            res.send(orders);
        });
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