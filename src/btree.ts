import * as fs from "fs"
import * as path from "path"
import * as mkdirp from "mkdirp"
import * as uuid from "node-uuid"
import {BNode, STATE as NodeState} from "./bnode"

export type Compare<T> = (a:T, b:T) => number;

export class BTree<T> {
    
    private m: number;
    private dir: string;
    public compare: Compare<T>;
    private _root: BNode<T>
    
    private deleteIds: Array<string> = [];
    
    constructor(compare: Compare<T>, dir = null, m=2) {
        this.compare = compare;
        this.dir = dir;
        this.m = m;
        this.root = this.createNode();
        
        if(this.dir) {
            mkdirp.sync(this.dir);
        }
    }
    
    public insert(value: T): Promise<any> {
        return this.root.findLeaf(value)
        .then(leaf => {
            return leaf.insert(value);
        })
        .then(() => {
            return this.save();
        });
    }
    
    public delete(value: T): Promise<any> {
        return this.root.findNode(value)
        .then(node => {
            return node.delete(value);
        })
    }
    
    public find(value: T): Promise<T> {
        return this.root.find(value);
    }
    
    protected save(): Promise<any> {
        return this.removeDeletedNodes()
        .then(this.saveNodes.bind(this))
    }
    
    protected saveNodes(): Promise<any> {
        return this.root.traverseLoadedNodes(node => this.saveNode(node));
    }
    
    protected saveNode(node: BNode<T>): Promise<any> {
        if(!this.dir) {
            return Promise.resolve();
        }
        else if(node.state === NodeState.DEFAULT) {
            return Promise.resolve();
        }
        else {
            
            return new Promise((resolve, reject) => {
                fs.writeFile(path.resolve(this.dir, node.uuid), node.json, err => {
                    if(err) {
                        reject(err)
                    }
                    else {
                        node.state = NodeState.DEFAULT;
                        resolve();
                    }
                })
            });
            
        }
    }
    
    public removeNode(node: BNode<T>) {
        if(this.deleteIds.indexOf(node.uuid) == -1) {
            this.deleteIds.push(node.uuid);
        }
    }
    
    public removeDeletedNodes(): Promise<any> {
        return Promise.all(this.deleteIds.map(id => {
            return new Promise((resolve, reject) => {
                return fs.unlink(path.resolve(this.dir, id), err => err ? reject(err) : resolve());
            });
        }))
        .then(() => {
            this.deleteIds = [];
        })
    }
    
    protected createNode(): BNode<T> {
        return new BNode<T>(this, this.m);
    }
    
    public toJSON() {
        return this.root.toJSON();
    }
    
    public get root(): BNode<T> {
        return this._root;
    }
    
    public set root(r: BNode<T>) {
        r.uuid = "ROOT";
        this._root = r;
    }
    
    public uuid(): string {
        let id = uuid.v1();
        if(this.dir) {
            while(fs.existsSync(path.resolve(this.dir, id))) {
                id = uuid.v1();
            }
        }
        
        return id;
    }
}