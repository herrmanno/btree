import {BNode} from "./bnode"

export type Compare<T> = (a:T, b:T) => number;

export class BTree<T> {
    
    private m = 8;
    private dir: string;
    public compare: Compare<T>;
    public root: BNode<T>
    
    constructor(compare: Compare<T>) {
        this.compare = compare;
        this.root = this.createNode();
    }
    
    public insert(value: T) {
        return this.root.findLeaf(value)
        .then(leaf => {
            return leaf.insert(value);
        });
    }
    
    public find(value: T) {
        return this.root.find(value);
    }
    
    protected createNode(): BNode<T> {
        return new BNode<T>(this, this.m);
    }
    
    public toJSON() {
        return this.root.toJSON();
    }
}