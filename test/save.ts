import {BTree} from "../src/btree"

let comp = (a:number, b:number) => a > b ? 1 : a < b ? -1 : 0;
let t = new BTree(comp, __dirname+"/tree");
t.root.loaded = false;

Promise.resolve(t)
/*.then(() => {
    return t.insert(1)
})
.then(() => {
    return t.insert(2)
})
.then(() => t.insert(3))
.then(() => t.insert(4))
.then(() => t.insert(5))
.then(() => t.insert(6))
.then(() => t.insert(7))
.then(() => t.insert(8))
.then(() => t.insert(9))
.then(() => t.insert(10))
.then(() => {
    t = new BTree(comp, __dirname+"/tree");
    return t;
})
.then(t => {
    return t.loadRecursive()
})*/
.then(() => {
    return t.root.load();
})
.then(() => {
    return t.find(9);
})
.then(() => console.log(JSON.stringify(t, null, 4)))
.catch(console.log.bind(console))