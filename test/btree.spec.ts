import * as mocha from "mocha"
import {expect as $} from "chai"
import {BTree} from "../src/btree"


describe("BTree", () => {
    let t: BTree<number>;
    let compare = (a:number, b:number) => a > b ? 1 : a < b ? -1 : 0;
    let numbers: Array<number> = [];
    
    before(() => {
        t = new BTree(compare);
        //init 100 random numbers
        for(var i = 0; i < 100; i++) {
            var n;
            do {
                n = Math.ceil(Math.random()*1000);
            } while(!!n  && numbers.indexOf(n) != -1)
            numbers.push(n);
        }
    });
    
    it("should be defined", () => {
        $(t).not.to.be.undefined
    });
    
    it("should be not null", () => {
        $(t).not.to.be.null;
    });
    
    it("should be instanceof BTree", () => {
        $(t).to.be.instanceOf(BTree);
    });
    
    it("should insert numbers", (done) => {
        function insert(i: number) {
            if(i >= numbers.length) {
                done();
                return;
            }
            else {
                t.insert(numbers[i])
                .then(() => insert(i+1));
            }
        }
        
        insert(0);
    })
    
    it("should find random inserted number", (done) => {
        let n = numbers[Math.floor(Math.random()*numbers.length-1)];
        t.find(n)
        .then(() => done())
        .catch(done);
    })
})