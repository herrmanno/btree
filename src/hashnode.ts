import {NodeState} from "./inode"
import {BaseNode} from "./basenode"
import {HashTree} from "./hashtree"

export class HashNode<T> extends BaseNode<T> {
    
    public getChild(i: number): Promise<this> {
        return this.children[i].load();
    }
    
    protected getIndex(): number {
        return this.parent.children.indexOf(this);
    }
    
    protected initFromJson(json: any): this {
        if(this.loaded)
            return this;
        
        this.keys = json.keys;
        this.children = json.children.map(child => {
            let n = this.tree.createNode(); //new BNode<T>(this.tree, this.m);
            n.uuid = child;
            n.loaded = false;
            return n;
        });
        this.state = NodeState.DEFAULT;
        this.loaded = true;
        
        return this;
    }
}