const users = [{
    id: 1,
    name: 'Daniel',
    schoolId: 101
}, {
    id: 2,
    name: 'Jessica',
    schoolId: 999
}];

const grades = [{
    id: 1,
    schoolId: 101,
    grade: 86
}, {
    id: 2,
    schoolId: 999,
    grade: 100
}, {
    id: 3,
    schoolId: 101,
    grade: 80
}];

const getUser = (id) => {
    return new Promise((resolve, reject) => {
        const user = users.find((user) => user.id === id);

        if (user) {
            resolve(user);
        } else {
            reject(`Unable to find user with id of ${id}.`);
        }
    });
};

const getGrades = (schoolId) => {
    return new Promise((resolve, reject) => {
        resolve(grades.filter((grade) => grade.schoolId === schoolId));
    });
};

// Daniel has a 83% in the class
const getStatus = (userId) => {
    let user;
    return getUser(userId).then((tempUser) => {
        user = tempUser;
        return getGrades(user.schoolId);
    }).then((grades) => {
        let average = 0;

        if(grades.length > 0) {
            average = grades.map((grade) => grade.grade).reduce((a, b) => a + b) / grades.length;
        }
        return `${user.name} has a ${average}% in the class.`;
        //average
        //return our string
    });
};


const getStatusAlt = async (userId) => { // async functions always return promises 
    // we are awaiting for the promise to either resolve or reject. 
    // If its resolved it is stored in the user variable
    // If its rejected an error is thrown and user never gets defined 
    const user = await getUser(userId); // the next line wont run until the promise resolves or rejects
    const grades = await getGrades(user.schoolId);
    let average = 0;
    if(grades.length > 0) {
        average = grades.map((grade) => grade.grade).reduce((a, b) => a + b) / grades.length;
    }
    return `${user.name} has a ${average}% in the class.`;

};

getStatusAlt(1).then((status) => {
    console.log(status);
}).catch((e)=> {
    console.log(e);
});

// getUser(2).then((user) => {
//     console.log(user);
// }).catch((e) => {
//     console.log(e);
// });

// getGrades(101).then((grade) => {
//     console.log(grade);
// }).catch((e) => {
//     console.log(e);
// });

// getStatus(3).then((status) => {
//     console.log(status);
// }).catch((e) => {
//     console.log(e);
// });
