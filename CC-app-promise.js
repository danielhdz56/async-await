const regularPromise = () => {
    return new Promise((resolve, reject) => {
        resolve('Daniel')
    });
}

const asynAwaitPromise = async () => { // async functions always return promises 
    return 'Daniel';
};

console.log(regularPromise());
console.log(asynAwaitPromise());
console.log('Resolving in a regularPromise is the same as returning in an asynAwaitPromise');
console.log('-'.repeat(50))
const regularPromiseErr = () => {
    return new Promise((resolve, reject) => {
        reject('This is an error');
    });
}

const asynAwaitPromiseErr = async () => { // async functions always return promises 
    throw new Error('This is an error');
};

console.log(regularPromiseErr());
console.log(asynAwaitPromiseErr());
console.log('Rejecting in a regularPromiseErr is the same as throwing a new Error in an asynAwaitPromiseErr');

