const express = require('express')
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1bnpv.gcp.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
var serviceAccount = require("./volunteer-network7-react-firebase-adminsdk-495o3-222dbb14e2.json");
const { ObjectId } = require('mongodb');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const port = 5000


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://volunteer-network7-react.firebaseio.com"
});


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const eventsCollection = client.db("volunteerNetdb").collection("eventTasks");
    const registeredEvents = client.db("volunteerNetdb").collection("registeredEvent")

    // send data to backend server from client site
    app.post('/registerEvents', (req, res) => {
        const events = req.body;
        registeredEvents.insertOne(events)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    // get all products data from backend server to show in client site (2)
    app.get('/events', (req, res) => {
        eventsCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    // send data to backend server from client site
    app.post('/addEvents', (req, res) => {
        const events = req.body;
        eventsCollection.insertMany(events)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    // send data to backend server from client site(3)
    app.get('/tasks', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    let tokenEmail = decodedToken.email;
                    if (tokenEmail === req.query.email) {
                        registeredEvents.find({ email: req.query.email })
                            .toArray((err, documents) => {
                                res.send(documents)
                            })
                    }
                    else {
                        res.status(401).send('unauthorized access');
                    }
                }).catch(function (error) {
                    // Handle error
                });
        }

    })

    app.get('/regEvents', (req, res) => {
        const email = req.query.email;
        registeredEvents.find({ email: email })
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    // to cancel events
    app.delete('/delete/:id', (req, res) => {
        registeredEvents.deleteOne({ _id: ObjectId(req.params.id) })
            .then((result) => {
                res.send(result.deletedCount > 0);
            })
    })

});

app.get('/', (req, res) => {
    res.send('Hello World!  Database is loading.')
})

app.listen(process.env.PORT || port)