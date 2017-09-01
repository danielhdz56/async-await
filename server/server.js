require('./config/config');
//library imports
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser'); 
const {ObjectID} = require('mongodb');

// local imports
var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate');

var app = express();
const port = process.env.PORT || 3000; //gets the environment port variable that heroku is going to set, if not on heroku it will be 3000

app.use(bodyParser.json()); // middleware, extracts the entire body portion of an incoming request and exposes it on req.body

app.post('/todos', authenticate,  async (req, res) => { 
    try {
        var todo = new Todo({
            text: req.body.text, // obtains the text property from the post request
            _creator: req.user._id
        }); 
        const doc = await todo.save();
        res.send(doc);
    } catch (e) {
        res.status(400).send(e);        
    }
});

app.get('/todos', authenticate, (req, res) => { // client makes request to API
    Todo.find({
        _creator: req.user._id
    }).then((todos) => { // find and return a promise, then
        res.send({todos}); // all todos will be sent back to the client that made the request
    }, (e) => {
        res.status(400).send(e);
    });
});

// This is how to fetch a variable that is in the url
// GET /todos/123432
app.get('/todos/:id', authenticate, (req, res) => {
    // req.params is an object that has key value pairs,
    // where the key is the url like parameter, and the value is what was actually placed there
    // '/todos/:id'  the keys is, id
    var id = req.params.id;

    if(!ObjectID.isValid(id)){
        return res.status(404).send('Invalid ID');
    }

    Todo.findOne({
        _id: id,
        _creator: req.user._id
    }).then((todo) => {
        if(!todo){
            return res.status(404).send();
        } 

        res.send({todo});
    }).catch((e) => {
        res.status(400).send();
    });
});

app.delete('/todos/:id', authenticate, async (req, res) => {
    try {
        const id = req.params.id;
        if(!ObjectID.isValid(id)){
            return res.status(404).send();
        }
        const todo = await Todo.findOneAndRemove({
            _id: id,
            _creator: req.user._id
        });
        if(!todo){
            return res.status(404).send();
        }
        res.send({todo});
    } catch(e) {
        res.status(400).send();        
    } 
});

app.patch('/todos/:id', authenticate, (req, res) => {
    var id = req.params.id;
    var body = _.pick(req.body, ['text', 'completed']);

    if(!ObjectID.isValid(id)){
        return res.status(404).send();
    }

    if(_.isBoolean(body.completed) && body.completed){
        body.completedAt = new Date().getTime();
    } else {
        body.completed = false;
        body.completedAt = null;
    }

    Todo.findOneAndUpdate({
        _id: id,
        _creator: req.user._id
    }, {$set: body}, {new: true}).then((todo) => {
        if(!todo){
            return res.status(404).send();
        }
        res.send({todo})

    }).catch((e) => {
        res.status(400).send();
    })
});

// POST /users
app.post('/users', async (req, res) => {
    try {
        const body = _.pick(req.body, ['email', 'password']); //from the request I am going to only pick up the email and password, b/c we don't want users to be able to mainpulate the token property
        const user = new User(body); // body is an object so we can write it like so
        await user.save();
        const token = await user.generateAuthToken();
        res.header('x-auth', token).send(user); // when we use 'x-' we are creating a custom header
    } catch(e) {
        res.status(400).send(e);        
    }
});


app.get('/users/me', authenticate, (req, res) => { 
   res.send(req.user); //authenticate lets us use req.user
});


// POST /users/login {email, password}
app.post('/users/login', async (req, res) => {
    try {
        const body = _.pick(req.body, ['email', 'password']);
        const user = await User.findByCredentials(body.email, body.password);
        const token = await user.generateAuthToken();
        res.header('x-auth', token).send(user);
    } catch (e) {
        res.status(400).send();        
    }
});

app.delete('/users/me/token', authenticate, async (req, res) => {
    try{
        await req.user.removeToken(req.token);
        res.status(200).send();
    } catch(e) {
        res.status(400).send();
    }
});
app.listen(port, () => {
    console.log(`Started up at port ${port}`);
});

module.exports = {app};