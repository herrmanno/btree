import * as path from "path"

export interface BNode<T> {
    keys: T[],
    children: BNode<T>[],
    parent: BNode<T>,
    tree: BTree<T>
}

export default class BTree<T> {
    
    public m = 4;
    public compare: (a:T, b:T) => number;
    public dir: string;
    
    protected root: BNode<T> = {
        keys: [],
        children: [],
        parent: null,
        tree: this
    }
    
    constructor(compare: (a:T, b:T)=>number) {
        this.compare = compare;
    }
    
    
    insert(value: T) {
        BTree.insert(this, value);
    }
    
    find(value: T) {
        return BTree.find(this.root, value);
    }
    
    /*
    setRoot(tree: any) {
        BTree.setRoot(this, tree);
    }
    */
        
    toJSON() {
        return BTree.treeToJSON(this);
    }
    
    static insert<T>(tree: BTree<T>, value:T): void {
        var node = BTree.findLeaf(tree.root, value);
        BTree.insertIntoNode(node, value);
    }
    
    static insertIntoNode<T>(node: BNode<T>, value: T): void {
        node.keys.push(value);
        node.keys.sort(node.tree.compare);
        
        if(node.keys.length > node.tree.m) {
            BTree.overflow(node);
        }
        else {
            BTree.saveNode(node);
        }
    }
    
    static overflow<T>(node: BNode<T>): void {
        var mI = Math.floor(node.tree.m / 2);
        var median = node.keys.splice(mI, 1)[0];
        
        var left: BNode<T> = {
            keys: node.keys.slice(0, mI),
            children: node.children.slice(0, mI+1),
            parent: null,
            tree: node.tree
        }
        
        var right: BNode<T> = {
            keys: node.keys.slice(mI),
            children: node.children.slice(mI+1),
            parent: null,
            tree: node.tree
        }
        
        for(var c in node.children) {
            node.children[c].parent = c <= mI ? left : right; 
        }
        
        var parent = node.parent;
        if(parent) {
            left.parent = parent;
            right.parent = parent
            
            BTree.saveNode(left);
            BTree.saveNode(right);
            
            parent.children.splice(parent.children.indexOf(node), 1, left, right);
            BTree.insertIntoNode(parent, median);
        }
        // node is root
        else {
            var newRoot: BNode<T> = {
                keys: [median],
                children: [left, right],
                parent: null,
                tree: node.tree
            }
            left.parent = newRoot;
            right.parent = newRoot;
            node.tree.root = newRoot;
            
            BTree.saveNode(left);
            BTree.saveNode(right);
            BTree.saveNode(newRoot);
        }
        
        node = void 0;
    }
    
    static findLeaf<T>(root: BNode<T>, value: T): BNode<T> {
        if(root.children.length === 0)
            return root;
        else {
            for(var i in root.keys) {
                if(root.tree.compare(root.keys[i], value) === 1)
                    return BTree.findLeaf(root.children[i], value);
            }
            return BTree.findLeaf(root.children[root.keys.length], value);
        }
    }
    
    static find<T>(root: BNode<T>, value: T): T {
        for(var i in root.keys) {
            if(root.tree.compare(root.keys[i], value) === 0)
                return root.keys[i];
            if(root.tree.compare(root.keys[i], value) === 1 && root.children[i])
                return BTree.find(root.children[i], value);                
        }
        if(root.children[root.keys.length]) {
            return BTree.find(root.children[root.keys.length], value);
        }
        else {
            return null;
        }
    }
    
    //TODO
    /*
    static setRoot(tree: BTree<any>, data: any) {
        tree.root = data;
        BTree.initTree(tree, tree.root, null);
    }
    
    static initTree(tree: BTree<any>, node: BNode<any>, parent:any) {
        node.parent = parent;
        node.tree = tree;
        node.children.forEach(c => BTree.initTree(tree, c, node));
    }
    */
    
    static saveNode(node: BNode<any>) {
        var height = 0;
        var parent = node.parent;
        while(parent) {
            height++;
            parent = node.parent;
        }
        
        var index = !node.parent ? 0 : node.parent.children.indexOf(node);
        
        var file = path.resolve(node.tree.dir, height+""+index);
        
    }
    
    static treeToJSON(tree: BTree<any>) {
        return BTree.nodeToJSON(tree.root);
    }
    
    static nodeToJSON(node: BNode<any>) {
        return {
            keys: node.keys,
            children: node.children.map(BTree.nodeToJSON)
        };
    }
    
}




export class IdPageTree extends BTree<{id:number, pages:Array<number>}> {
    constructor() {
        super((a,b) => {return a.id-b.id});
    }
    
    findId(id: number) {
        return super.find({id, pages:null});
    }
}