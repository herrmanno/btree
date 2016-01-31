import {BTree} from "../src/btree"

function rnd() {
    return Math.ceil(Math.random()*100);
}

let compare = (a,b) => {
    let tmp = a-b;
    if(tmp > 0) return 1;
    if(tmp < 0) return -1;
    return 0;
}

let t = new BTree<number>(compare);

function insert(i): Promise<any> {
    if(i > 10) {
        //console.log(JSON.stringify(t));
        return Promise.resolve();
    }
    else {
        return t.insert(i)
        .then(() => insert(i+1));
    }
}

let log = () => console.log(JSON.stringify(t));
/*
insert(1)
.then(() => t.find(rnd()))
.then(log)
.then(() => t.find(rnd()))
.then(log)
.then(() => t.find(rnd()))
.then(log)
*/

insert(1)
.then(log)
.then(() => 
t.delete(5))
.then(log)
.then(() => 
t.delete(7))
.then(log)
.then(() => 
t.delete(2))
.then(log)