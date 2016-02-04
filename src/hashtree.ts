import {BaseTree} from "./basetree"
import {HashNode} from "./hashnode"
import * as fs from "fs"
import * as path from "path"

export class HashTree<T> extends BaseTree<T, HashNode<T>> {
    
    protected hashmap: {[id:string]: HashNode<T>} = {};
    protected removeIDs : Array<string> = [];
    
    public createNode(): HashNode<T> {
        return new HashNode(this, this.m);
    }
    
    public saveNodes(): Promise<void> {
        return Promise.all(this.getLoadedNodes().map(node => this.saveNode(node))) as any;
    }
    
    public removeNode(node: HashNode<T>): void {
        if(this.removeIDs.indexOf(node.uuid) === -1) {
            this.removeIDs.push(node.uuid);
        }
    }
    
    public deleteRemovedNodes(): Promise<void> {
        return Promise.all(this.removeIDs.map(id => {
            return new Promise((resolve, reject) => {
                return fs.unlink(path.resolve(this.dir, id), err => err ? reject(err) : resolve());
            });
        }))
        .then(() => {
            this.removeIDs = [];
        });
    }
    
    protected getLoadedNodes(): Array<HashNode<T>> {
        let nodes = [];
        for(var key in this.hashmap) {
            if(!!this.hashmap[key]) {
                nodes.push(this.hashmap[key]);
            }
        }
        
        return nodes;
    }
}