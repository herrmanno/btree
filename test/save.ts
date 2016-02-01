import {BTree} from "../src/btree"

let comp = (a:number, b:number) => a > b ? 1 : a < b ? -1 : 0;
let t = new BTree(comp, __dirname+"/tree");

Promise.resolve()
.then(() => {
    return t.insert(1)
})
.then(() => t.insert(2))
.then(() => t.insert(3))
.then(() => t.insert(4))
.then(() => t.insert(5))
.then(() => t.insert(6))
.then(() => t.insert(7))
.then(() => t.insert(8))
.then(() => t.insert(9))
.then(() => t.insert(10))