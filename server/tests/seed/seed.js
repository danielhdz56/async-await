const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Todo} = require('./../../models/todo');
const {User} = require('./../../models/user');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();
const users = [{
    _id: userOneId,
    email: 'daniel@example.com',
    password: 'userOnePass',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: userOneId, access: 'auth'}, process.env.JWT_SECRET).toString()
    }]
}, {
    _id: userTwoId,
    email: 'gen@example.com',
    password: 'userTwoPass',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: userTwoId, access: 'auth'}, process.env.JWT_SECRET).toString()
    }]
}];

const todos = [{ // this will be added after all of of the docs get removed
    _id: new ObjectID(),
    text: 'First test todo',
    _creator: userOneId
}, {
    _id: new ObjectID(),
    text: 'Second test todo',
    completed: true,
    completedAt: 3,
    _creator: userTwoId
}];

const populateTodos = (done) => { // This accounts for the case that there are todos, by deleting all docs from the collection
    Todo.remove({}).then(() => { // after it deletes all data then
        return Todo.insertMany(todos); // its going to insert an array of seed data, todos. By using return I can chain callbacks
    }).then(() => done()); //then i can tack on done()
};

const populateUsers = (done) => {
    User.remove({}).then(() => {
        var userOne = new User(users[0]).save();
        var userTwo = new User(users[1]).save();
        
        return Promise.all([userOne, userTwo]) // makes sure that we wait for both promises to be completed
    }).then(() => done());
};

module.exports = {todos, populateTodos, users, populateUsers};