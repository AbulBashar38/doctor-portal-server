const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload')

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rdsgc.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(cors())
app.use(express.static('doctors'))
app.use(fileUpload())
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const appointmentCollection = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_COLLECTION}`);

    const doctorCollection = client.db(`${process.env.DB_NAME}`).collection('doctorInfo');

    app.post('/addAppointment', (req, res) => {
        appointmentCollection.insertOne(req.body)
            .then((result) => {
                res.send(result.insertedCount > 0)
            })
    })
    app.post('/appointsByDate', (req, res) => {
        const date = req.body.date;
        const email = req.body.email;
        doctorCollection.find({ email: email })
            .toArray((err, doctorDocuments) => {
                const filter = { date: date }
                if (doctorDocuments.length === 0) {
                    filter.email = email;
                }
                appointmentCollection.find(filter)
                    .toArray((err, appointDocument) => {
                        res.send(appointDocument)
                    })
            })
    })

    app.get('/allData', (req, res) => {
        appointmentCollection.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })

    })

    app.post('/addADoctor', (req, res) => {
        const email = req.body.email;
        const name = req.body.name;
        const file = req.files.file;
        const imgData = file.data
        const encImg = imgData.toString('base64')

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        }

        doctorCollection.insertOne({ name, email, image })
            .then(result => {
                res.send(result.insertedCount > 0)
            })
        // file.mv(`${__dirname}/doctors/${file.name}`, err => {
        //     if (err) {
        //         console.log(err);
        //         return res.status(500).send({ msg: 'image upload failed' })
        //     }
        //     return res.send({ name: file.name, path: `/${file.name}` })
        // })
    })

    app.get('/allDoctors', (req, res) => {
        doctorCollection.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })
    })

});


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

