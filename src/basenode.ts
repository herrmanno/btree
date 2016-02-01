import {ITree} from "./itree"
import {INode, NodeState} from "./inode"
import * as fs from "fs"
import * as path from "path"

export abstract class BaseNode<T> implements INode<T> {
    
    /*
    *************************************************
    *                   Members                     *
    *************************************************
    */
    public m: number;
    public state: NodeState;
    public uuid: string;
    public json: string;
    public loaded: boolean;
    protected keys: Array<T> = [];
    protected children: Array<this> = [];
    //protected parent: this = null;
    protected tree: ITree<T, this>;
    
    /*
    *************************************************
    *                 Main Methods                  *
    *************************************************
    */
    
    constructor(tree: ITree<T, any>, m:number) {
        this.m = m;
        this.tree = tree;
        this.uuid = this.tree.uuid();
        this.state = NodeState.CHANGED;
    }
    
    public insert(value: T): Promise<void> {
        this.keys.push(value);
        this.keys.sort(this.tree.compare);
        this.state = NodeState.CHANGED;
        
        if(this.isOverflown) {
            return this.overflow();       
        }
        else {
            return Promise.resolve(null);
        }
    };
    
    public delete(value: T): Promise<void> {
        let idx = this.keys.map((k,i) => i ).filter(i => this.tree.compare(this.keys[i], value) === 0)[0]
        // is leaf node
        if(this.isLeaf) {
            this.keys.splice(idx, 1);
            if(this.isUnderflown) {
                return this.underflow();
            }
            else {
                return Promise.resolve(void 0);
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
    };
    
    public find(value: T): Promise<T> {
        for(var keyI in this.keys) {
            let comp = this.tree.compare(this.keys[keyI], value);
            switch(comp) {
                case 0:
                    return Promise.resolve(this.keys[keyI])
                case 1:
                    return this.getChild(keyI).then(c => c.find(value));
            }
        }
        return this.getLastChild().then(c => c.find(value));
    };
    
    public load(recursive?: boolean): Promise<this> {
        return new Promise((resolve, reject) => {
            if(!this.loaded) {
                let file = path.resolve(this.tree.dir, this.uuid);
                fs.readFile(file, "utf-8", (err, data) => {
                    if(err) {
                        reject(err);
                    }
                    else {
                        resolve(JSON.parse(data));
                    }
                })
            }
            else {
                resolve(this)
            }
        })
        .then((json: this) => {
            return this.initFromJson(json);
        })
        .then(node => {
            return recursive ? Promise.all(node.children.map(childNode => childNode.load(recursive))) : null
        })
        .then(() => this)
    };
    
    public findLeaf(value: T): Promise<this> {
        if(this.isLeaf) {
            return Promise.resolve(this);
        }
        else {
            for(var keyI in this.keys) {
                switch(this.tree.compare(this.keys[keyI], value)) {
                    case 1:
                        return this.getChild(keyI).then(n => n.findLeaf(value));
                    case 0:
                        return Promise.reject(`key ${value} already exists in this tree`);
                }
            }
            return this.getLastChild().then(n => n.findLeaf(value));
        }        
    };
    
    public findNode(value: T): Promise<this> {
        for(var keyI in this.keys) {
            let comp = this.tree.compare(this.keys[keyI], value);
            switch(comp) {
                case 0:
                    return Promise.resolve(this);
                case 1:
                    return this.getChild(keyI).then(c => c.findNode(value));
            }
        }
        return this.getLastChild().then(c => c.findNode(value));
    };
    
    public toJSON(): any {
        return {
            keys: this.keys,
            children: this.children.map(c => c.toJSON())
        }
    };
    
    /*
    *************************************************
    *                   Internals                   *
    *************************************************
    */
    
    protected abstract initFromJson(json: this): this;
    
    protected abstract getIndex(): number;
    
    protected abstract getParent(): Promise<this>;
    
    protected abstract getChild(index: number | string): Promise<this>;
    
    
    protected getLastChild(): Promise<this> {
        return this.getChild(this.childCount-1);
    }
    
    protected getRightMostChild(): Promise<this> {
        if(this.isLeaf) {
            return Promise.resolve(this);
        }
        else {
            return this.getLastChild().then(c => c.getRightMostChild());
        }
    }
    
    protected getLeftMostChild(): Promise<this> {
        if(this.isLeaf) {
            return Promise.resolve(this);
        }
        else {
            return this.getChild(0).then(c => c.getLeftMostChild());
        }
    }
    
    protected overflow(): Promise<void> {
        var mI = Math.floor(this.m / 2);
        var median = this.keys.splice(mI, 1)[0];
        
        
        var left = this.tree.createNode(); //new BNode<T>(this.tree, this.m)
        left.keys = this.keys.slice(0, mI);
        left.children = this.children.slice(0, mI+1); 
        
        var right = this.tree.createNode() //new BNode<T>(this.tree, this.m);
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
                var newRoot = this.tree.createNode(); //new BNode<T>(this.tree, this.m);
                newRoot.keys = [median];
                newRoot.children = [left, right];
                left.parent = newRoot;
                right.parent = newRoot;
                this.tree.root = newRoot;
                
                return null;
            }
        })
        .then(() => {
            this.tree.removeNode(this);
        })
        
    }
    
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
    
    protected getLeftSibling(): Promise<this> {
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
    
    protected getRightSibling(): Promise<this> {
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
    
    protected get isOverflown(): boolean {
        return this.keys.length > (2*this.m - 1);
    }
    
    protected get isUnderflown(): boolean {
        return !this.isRoot ? (this.keys.length < this.m -1) : this.keys.length < 1;
    }
    
    
    protected get isRoot(): boolean {
        return !this.parent;
    }
    
    protected get isLeaf(): boolean {
        return this.children.length === 0;
    }
    
    protected get childCount(): number {
        return this.children.length;
    }
}