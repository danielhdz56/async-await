// library imports
const expect = require('expect');
const request = require('supertest'); //allows mocha to work with express
const {ObjectID} = require('mongodb');

//local imports
const {app} = require('./../server'); //destructoring to obtain the property, app, from server.js
const {Todo} = require('./../models/todo'); 
const {User} = require('./../models/user');
const {todos, populateTodos, users, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);


describe('POST /todos', () => { //describe: to group all of the routes 
    it('should create a new todo', (done) => {
        var text = 'Test to do text';

        request(app)
        .post('/todos')
        .set('x-auth', users[0].tokens[0].token)
        .send({text})
        .expect(200)
        .expect((res) => {
            expect(res.body.text).toBe(text);
        })
        .end((err, res) => {
            if(err){
                return done(err)
            }

            Todo.find({text}).then((todos) => { // i am only finding those that have the text, 'Test to do text'
                expect(todos.length).toBe(1); // only one that i just posted will be there
                expect(todos[0].text).toBe(text); // the text property should still be the same
                done();
            }).catch((e) => {
                done(e);
            })
        });
    });
    it('should not create todo with invalid body data', (done) => {
        request(app)
        .post('/todos')
        .set('x-auth', users[0].tokens[0].token)        
        .send({})
        .expect(400)
        .end((err, res) => {
            if(err){
                return done(err)
            }
            Todo.find().then((todos) => {
                expect(todos.length).toBe(2); // length of seed data is 2
                done();  
            }).catch((e) => {
                done(e);
            })
        });
    });
});

describe('GET /todos', () => {
    it('should get all todos', (done) => {
        request(app)
        .get('/todos')
        .set('x-auth', users[0].tokens[0].token)        
        .expect(200)
        .expect((res) => {
            expect(res.body.todos.length).toBe(1);
        })
        .end(done);
    });
});

describe('GET /todos/:id', () => {
    it('should return todo doc', (done) => {
        request(app)
        .get(`/todos/${todos[0]._id.toHexString()}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .expect((res) => {
            expect(res.body.todo.text).toBe(todos[0].text);
        })
        .end(done);
    });

    it('should not return todo doc created by other user', (done) => {
        request(app)
        .get(`/todos/${todos[1]._id.toHexString()}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(done);
    });

    it('should return 404 if todo not found', (done) => {
        var hexId = new ObjectID().toHexString(); //although this is an object id, it is not in the database
        request(app)
        .get(`/todos/${hexId}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(done);
    });

    it('should return 404 for non-object ids', (done) => {
        request(app)
        .get('/todos/123')
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(done)
    });
});

describe('DELETE /todos/:id', () =>{
    it('should remove a todo', (done) => {
        var hexId = todos[0]._id.toHexString()
        request(app)
        .delete(`/todos/${todos[0]._id.toHexString()}`)
        .set('x-auth', users[0].tokens[0].token)        
        .expect(200)
        .expect((res) => {
            expect(res.body.todo._id).toBe(hexId);
        })
        .end((err, res) => {
            if(err){
                return done(err);
            }
            Todo.findById(hexId).then((todo) => {
                expect(todo).toNotExist();
                done();
            }).catch((e) => {
                done(e);
            })
        });
    });

    it('should not remove a todo if not creator', (done) => {
        var hexId = todos[0]._id.toHexString()
        request(app)
        .delete(`/todos/${todos[0]._id.toHexString()}`)
        .set('x-auth', users[1].tokens[0].token)        
        .expect(404)
        .end((err, res) => {
            if(err){
                return done(err);
            }
            Todo.findById(hexId).then((todo) => {
                expect(todo).toExist();
                done();
            }).catch((e) => {
                done(e);
            })
        });
    });

    it('should return 404 if todo not found', (done) => {
        var hexId = new ObjectID().toHexString();
        request(app)
        .delete(`/todos/${hexId}`)
        .set('x-auth', users[0].tokens[0].token)        
        .expect(404)
        .end(done)
    });

    it('should return 404 for non-object ids', (done) => {
        request(app)
        .delete('/todos/123')
        .set('x-auth', users[0].tokens[0].token)                
        .expect(404)
        .end(done)
    });
});
describe('PATCH /todos/:id', () => {
    it('should update todo doc', (done) => {
        var hexId = todos[0]._id.toHexString();
        var text = "updated text";
        request(app)
        .patch(`/todos/${hexId}`)
        .send({
            text,
            completed: true
        })
        .set('x-auth', users[0].tokens[0].token)                        
        .expect(200)
        .expect((res) => {
            expect(res.body.todo.text).toBe(text);
            expect(res.body.todo.completed).toBe(true);
            expect(res.body.todo.completedAt).toBeA("number");
        })
        .end((err, res) => {
            if(err){
                return done(err);
            }

            Todo.findById(hexId).then((todo) => {
                expect(todo.text).toBe(text);
                expect(todo.completed).toBe(true);
                done();
            }).catch((e) => {
                done(e);
            });
        });
    });

    it('should not update todo doc if not creator', (done) => {
        var hexId = todos[0]._id.toHexString();
        var text = "updated text";
        request(app)
        .patch(`/todos/${hexId}`)
        .send({
            text,
            completed: true
        })
        .set('x-auth', users[1].tokens[0].token)                        
        .expect(404)
        .end(done)

    });

    it('should clear completedAt when todo is not completed', (done) => {
        var hexId = todos[1]._id.toHexString();
        var text = "updated text";

        request(app)
        .patch(`/todos/${hexId}`)
        .send({
            text,
            completed: false
        })
        .set('x-auth', users[1].tokens[0].token)                                
        .expect(200)
        .expect((res) => {
            expect(res.body.todo.text).toBe(text);
            expect(res.body.todo.completed).toBe(false);
            expect(res.body.todo.completedAt).toNotExist();
        })
        .end((err, res) => {
            if(err){
                return done(err);
            }

            Todo.findById(hexId).then((todo) => {
                expect(todo.text).toBe(text);
                expect(todo.completed).toBe(false);
                expect(todo.completedAt).toNotExist();
                done();
            }).catch((e) => {
                done(e);
            });
        });
    });

    it('should return 404 if todo not found', (done) => {
        var hexId = new ObjectID().toHexString();
        request(app)
        .patch(`/todos/${hexId}`)
        .set('x-auth', users[0].tokens[0].token)                                
        .expect(404)
        .end(done)
    });

    it('should return 404 for non-object ids', (done) => {
        request(app)
        .patch(`/todos/123`)
        .set('x-auth', users[0].tokens[0].token)                                
        .expect(404)
        .end(done)
    })
});

describe('GET /users/me', () => {
    it('should return user if authenticated', (done) => {
        request(app)
        .get('/users/me')
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .expect((res) => {
            expect(res.body._id).toBe(users[0]._id.toHexString());
            expect(res.body.email).toBe(users[0].email);
        })
        .end(done);
    });

    it('should return a 401 if not authenticated', (done) => {
        request(app)
        .get('/users/me')
        .expect(401)
        .expect((res) => {
            expect(res.body).toEqual({});
        })
        .end(done);
    });
});

describe('POST /users', () => {
    it('should create a user', (done) => {
        var email = 'example@example.com';
        var password = '123mnb!';

        request(app)
        .post('/users')
        .send({email, password})
        .expect(200)
        .expect((res) => {
            expect(res.headers['x-auth']).toExist();
            expect(res.body._id).toExist();
            expect(res.body.email).toBe(email);
        })
        .end((err) => {
            if (err) {
                return done(err);
            }

            User.findOne({email}).then((user) => {
                expect(user).toExist();
                expect(user.password).toNotBe(password);
                done();
            }).catch((e) => {
                done(e);
            });
        });
    });

    it('should return validation errors if request invalid', (done) => {
        var email = 'abc';
        var password = '1';

        request(app)
        .post('/users')
        .send({email, password})
        .expect(400)
        .expect((res) => {
            expect(res.headers['x-auth']).toNotExist();
            expect(res.body._id).toNotExist();
            expect(res.body.email).toNotExist();
        })
        .end(done)
    });

    it('should not create user if email inuse', (done) => {
        var password = 'abc123!'
        request(app)
        .post('/users')
        .send({email: users[0].email, password})
        .expect(400)
        .end(done)
    });
});

describe('POST /users/login', () => {
    it('should login user and return auth token', (done) => {
        request(app)
        .post('/users/login')
        .send({
            email: users[1].email,
            password: users[1].password
        })
        .expect(200)
        .expect((res) => {
            expect(res.headers['x-auth']).toExist();
        })
        .end((err, res) => {
            if(err) {
                return done(err);
            } 

            User.findById(users[1]._id).then((user) => {
                expect(user.tokens[1]).toInclude({
                    access: 'auth',
                    token: res.headers['x-auth']
                });
                done()
            }).catch((e) => {
                done(e);
            });
        })
    });

    it('should reject invalid login', (done) => {
        var password = 'helloWorld';
        request(app)
        .post('/users/login')
        .send({
            email: users[1].email,
            password
        })
        .expect(400)
        .expect((res) => {
            expect(res.headers['x-auth']).toNotExist();
        })
        .end((err, res) => {
            if(err) {
                return done(err)
            }
            User.findById(users[1]._id).then((user) => {
                expect(user.tokens.length).toBe(1);
                done();
            }).catch((e) => {
                done(e);
            });
        })
    });
});

describe('DELETE /users/me/token', () => {
    it('should remove auth token on logout', (done) => {
        request(app)
        .delete('/users/me/token')
        .set('x-auth', users[0].tokens[0].token)        
        .expect(200)
        .end((err, res) => {
            if(err){
                return done(err)
            }
            User.findById(users[0]._id).then((user) => {
                expect(user.tokens.length).toBe(0);
                done();
            }).catch((e) => {
                done(e);
            });
        })
    });
});