var {User} = require('./../models/user');

var authenticate = (req, res, next) => {
    var token = req.header('x-auth'); // the key value pair that we retrieve from postman
    User.findByToken(token).then((user) => {
        if(!user){
            return Promise.reject(); // makes sure to jump straight to the catch block
        }

        req.user = user;
        req.token = token;
        next();
    }).catch((e) => {
        res.status(401).send(); // 401 status means that authentication is required
    });
};

module.exports = {authenticate};