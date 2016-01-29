import {BTree} from "./btree"

export class BNode<T> {
    
    private m: number;
    private keys: Array<T> = [];
    private children: Array<BNode<T>> = [];
    protected parent: BNode<T>;
    private tree: BTree<T>;
    
    constructor(tree: BTree<T>, m = 4) {
        this.m = m;
        this.tree = tree;
    }
    
    public insert(value: T): Promise<any> {
        this.keys.push(value);
        this.keys.sort(this.tree.compare);
        
        if(this.isOverflown) {
            return this.overflow();       
        }
        else {
            return Promise.resolve(null);
        }
    }
    
    protected overflow(): Promise<any> {
        var mI = Math.floor(this.m / 2);
        var median = this.keys.splice(mI, 1)[0];
        
        
        var left = new BNode<T>(this.tree, this.m)
        left.keys = this.keys.slice(0, mI);
        left.children = this.children.slice(0, mI+1); 
        
        var right = new BNode<T>(this.tree, this.m);
        right.keys = this.keys.slice(mI);
        right.children = this.children.slice(mI+1);
        
        
        return Promise.all(this.children.map((c,i) => this.getChild(i)))
        .then(children => {
            children.forEach((child, cIndex) => {
                child.parent = cIndex <= mI ? left : right;
            })
            return true
        }).then(() => {
            var parent = this.parent;
            if(parent) {
                left.parent = parent;
                right.parent = parent
                
                parent.children.splice(parent.children.indexOf(this), 1, left, right);
                return parent.insert(median)
            }
            // node is root
            else {
                var newRoot = new BNode<T>(this.tree, this.m);
                newRoot.keys = [median];
                newRoot.children = [left, right];
                left.parent = newRoot;
                right.parent = newRoot;
                this.tree.root = newRoot;
                
                return null;
            }
        });
        
    }
    
    public delete(value: T): Promise<T> {
        var idx = this.keys.map((k,i) => i ).filter(i => this.compare(i, value) === 0)[0]
        // is leaf node
        if(this.isLeaf) {
            this.keys.splice(idx, 1);
            if(this.isUnderflown) {
                return this.underflow();
            }
            else {
                return Promise.resolve();
            }
        }
        //leaf is internal
        else {
            return Promise.all([this.children[idx].getRightMostChild(), this.children[idx+1].getLeftMostChild()])
            .then((lr) => {
                var [left, right] = lr;
                if(left.childCount >= right.childCount) {
                    this.keys.splice(idx, 1, left.keys.splice(left.keys.length-1, 1)[0]);
                    if(left.isUnderflown)
                        return left.underflow();
                }
                else {
                    this.keys.splice(idx, 1, right.keys.splice(0, 1)[0]);
                    if(right.isUnderflown)
                        return right.underflow();
                }
            });
           
        }
    }
    
    /*
    protected deleteRightMost(): Promise<T> {
        return this.delete(this.keys[this.keys.length-1])
    }
    
    protected deleteLeftMost(): Promise<T> {
        return this.delete(this.keys[0])
    }
    */
    
    protected underflow(): Promise<any> {
        if(this.isRoot) {
            if(this.childCount > 1) throw new Error("Root underflown while having more than one children")
            return this.getChild(0)
            .then(c => {
                this.tree.root = c;
                c.parent = null;
            })   
        }
        else {
            return this.rotateLeft();
        }
    }
    
    protected rotateLeft(): Promise<any> {
        return this.getRightSibling()
        .then(rs => {
            if(!rs) {
                return this.rotateRight();
            }
            else if(rs.wouldUnderflow) {
                return this.rotateRight();
            }
            else {
                //rotate
                let sepIdx = this.getIndex();
                this.keys.push(this.parent.keys[sepIdx])
                this.parent.keys[sepIdx] = rs.keys.shift();
            }
        })
    }
    
    protected rotateRight(): Promise<any> {
        return this.getLeftSibling()
        .then(ls => {
            if(!ls) {
                return this.merge();
            }
            else if(ls.wouldUnderflow) {
                return this.merge();
            }
            else {
                //rotate
                let sepIdx = this.getIndex()-1;
                this.keys.push(this.parent.keys[sepIdx])
                this.parent.keys[sepIdx] = ls.keys.pop();
            }
        })
    }
    
    protected merge(): Promise<any> {
        return this.mergeRight();
    }
    
    protected mergeRight(): Promise<any> {
        return this.getRightSibling()
        .then(rs => {
            if(!rs) {
                return this.mergeLeft();
            }
            else {
                //merge
                let sepIdx = this.getIndex();
                this.keys.push(this.parent.keys[sepIdx]);
                this.keys = this.keys.concat(rs.keys);
                this.children = this.children.concat(rs.children);
                //remove rigt sibling
                this.parent.children.splice(sepIdx+1, 1);
                //remove seperator
                this.parent.keys.splice(sepIdx, 1);
                
                if(this.parent.isUnderflown)
                    this.parent.underflow();
            }
        })
    }
    
     protected mergeLeft(): Promise<any> {
        return this.getLeftSibling()
        .then(ls => {
            if(!ls) {
                return Promise.reject("Cannot merge node. Node has no siblings.")
            }
            else {
                //merge
                let sepIdx = this.getIndex()-1;
                this.keys.unshift(this.parent.keys[sepIdx]);
                this.keys = ls.keys.concat(this.keys);
                this.children = ls.children.concat(this.children);
                //remove left sibling
                this.parent.children.splice(sepIdx, 1);
                //remove seperator
                this.parent.keys.splice(sepIdx, 1);
                
                if(this.parent.isUnderflown)
                    this.parent.underflow();
            }
        })
    }
    
    protected getLeftSibling(): Promise<BNode<T>> {
        let parent = this.parent;
        if(!parent)
            return Promise.reject("Node has no Parent")
        else {
            let idx = this.getIndex();
            if(idx === 0)
                return Promise.resolve(null)
            else {
                return this.parent.getChild(idx-1);
            }
        }
    }
    
    protected getRightSibling(): Promise<BNode<T>> {
        let parent = this.parent;
        if(!parent)
            return Promise.reject("Node has no Parent")
        else {
            let idx = this.getIndex();
            if(idx+1 === this.parent.childCount)
                return Promise.resolve(null)
            else {
                return this.parent.getChild(idx+1);
            }
        }
    }
    
    public find(value: T) {
        for(var keyI in this.keys) {
            let comp = this.compare(keyI, value);
            switch(comp) {
                case 0:
                    return Promise.resolve(this.keys[keyI])
                case 1:
                    return this.getChild(keyI).then(c => c.find(value));
            }
        }
        return this.getLastChild().then(c => c.find(value));
    }
    
    public findLeaf(value: T): Promise<BNode<T>> {
        
        if(this.isLeaf) {
            return Promise.resolve(this);
        }
        else {
            for(var keyI in this.keys) {
                switch(this.compare(keyI, value)) {
                    case 1:
                        return this.getChild(keyI).then(n => n.findLeaf(value));
                    case 0:
                        return Promise.reject(`key ${value} already exists in this tree`);
                }
            }
            return this.getLastChild().then(n => n.findLeaf(value));
        }
        
    }
    
    public findNode(value: T): Promise<BNode<T>> {
        for(var keyI in this.keys) {
            let comp = this.compare(keyI, value);
            switch(comp) {
                case 0:
                    return Promise.resolve(this)
                case 1:
                    return this.getChild(keyI).then(c => c.findNode(value));
            }
        }
        return this.getLastChild().then(c => c.findNode(value));
    }
    
    protected getRightMostChild(): Promise<BNode<T>> {
        if(this.isLeaf) {
            return Promise.resolve(this);
        }
        else {
            return this.getLastChild().then(c => c.getRightMostChild());
        }
    }
    
    protected getLeftMostChild(): Promise<BNode<T>> {
        if(this.isLeaf) {
            return Promise.resolve(this);
        }
        else {
            return this.getChild(0).then(c => c.getLeftMostChild());
        }
    }
    
    protected getChild(i: number): Promise<BNode<T>> {
        //TODO reject if !this.children[i]
        return Promise.resolve(this.children[i]);
    }
    
    protected getLastChild(): Promise<BNode<T>> {
        return this.getChild(this.keys.length);
    }
    
    protected getIndex(): number {
        return this.parent.children.indexOf(this);
    }
    
    private compare(i:number, value:T): number {
        return this.tree.compare(this.keys[i], value);
    }
    
    get isLeaf(): boolean {
        return this.children.length === 0;
    }
    
    get childCount(): number {
        return this.children.length;
    }
    
    get isOverflown(): boolean {
        return this.keys.length > (2*this.m - 1);
    }
    
    get isUnderflown(): boolean {
        return !this.isRoot ? (this.keys.length < this.m -1) : this.keys.length < 1;
    }
    
    get wouldUnderflow(): boolean {
        return (this.keys.length-1) < this.m -1
    }
    
    get isRoot(): boolean {
        return !this.parent;
    }
    
    public toJSON() {
        return {
            keys: this.keys,
            children: this.children.map(c => c.toJSON())
        }
    }
}