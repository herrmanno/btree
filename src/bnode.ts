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
        
        if(this.keys.length > this.m) {
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
    
    protected getChild(i: number): Promise<BNode<T>> {
        return Promise.resolve(this.children[i]);
    }
    
    protected getLastChild(): Promise<BNode<T>> {
        return this.getChild(this.keys.length);
    }
    
    
    private compare(i:number, value:T): number {
        return this.tree.compare(this.keys[i], value);
    }
    
    get isLeaf(): boolean {
        return this.children.length === 0;
    }
    
    public toJSON() {
        return {
            keys: this.keys,
            children: this.children.map(c => c.toJSON())
        }
    }
}