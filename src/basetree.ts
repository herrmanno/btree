import {ITree, CompareNodes} from "./itree"
import {INode, NodeState} from "./inode"
import * as mkdirp from "mkdirp"
import * as fs from "fs"
import * as path from "path"
import * as uuid from "node-uuid"

export abstract class BaseTree<T, N extends INode<T>> implements ITree<T, N> {
    
    /**
     * the minimal number of children of a node (also namded 't')
     */
    protected m: number;
    
    /**
     * the directory where the tree saves its files
     */
    public dir: string;
    
    /**
     * function used for comparing two keys
     */
    public compare: CompareNodes<T>;
    
    /**
     * internal field for the root node
     */
    private _root: N;
    
    /**
     * @param compare function for comparing two keys
     * @param dir @see this.dir
     * @param m @see this.m
     */
    constructor(compare: CompareNodes<T>, dir = null, m=2) {
        this.compare = compare;
        this.dir = dir;
        this.m = m;
        this.root = this.createNode();        
        
        if(this.dir) {
            mkdirp.sync(this.dir);
        }
    }
    
    /**
     * Factory for producing new Nodes of type N
     */
    public abstract createNode(): N;
    
    /**
     * Loads the whole(!) tree from disk
     * @return a Promise containing the trees root node
     */
    public loadAll(): Promise<INode<T>> {
        this.root.loaded = false;
        return this.root.load(true);
    }
    
    /**
     * inserts a key into the tree
     * @throws if the tree already contains the given value
     */
    public insert(value: T): Promise<void> {
        return this.root.findLeaf(value)
        .then(leaf => {
            return leaf.insert(value);
        })
        .then(() => {
            return this.save();
        });
    }
    
    /**
     * deletes a key from this tree
     * @throws if the tree does not contain the given value
     */
    public delete(value: T): Promise<void> {
        return this.root.findNode(value)
        .then(node => {
            return node.delete(value);
        })
        //TODO save here also
    }
    
    /**
     * finds a given key in the tree
     * @throws if the tree does not contain the value
     */
    public find(value: T): Promise<T> {
        return this.root.find(value);
    }
    
    /**
     * Save all modified nodes to disk.
     * called after insertion
     */
    protected save(): Promise<any> {
        return this.deleteRemovedNodes()
        .then(this.saveNodes.bind(this))
    }
    
    /**
     * Saves all loaded (in-memory) nodes
     * @returns a Promise indicating the saving process
     * @throws Promise.reject, if saving failes
     */
    protected abstract saveNodes(): Promise<void>;
    
    /**
     * saves a given node.
     * Calls this.saveNodetoDisk, if node can and should be saved
     */
    protected saveNode(node: INode<T>): Promise<any> {
        if(!this.dir) {
            return Promise.resolve();
        }
        else if(node.state === NodeState.DEFAULT) {
            return Promise.resolve();
        }
        else {
            
            return this.saveNodeToDisk(node);
            
        }
    }
    
    /**
     * Save a given node to a file and resets the nodes state to DEFAULT
     * @param node the node to save
     * @returns a Promise indicating the succes / failure of saving.
     * @throws Promise.reject, if file writing failes
     */
    protected saveNodeToDisk(node: INode<T>): Promise<void> {
        return new Promise<void>((resolve, reject) => {
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
    
    /**
     * Deletes a given node from diskfile
     * @param node the node to delete
     * @returns a Promise indicating the success / failure of deletion
     * @throws Promise.reject, if file deletion failes
     */
    protected deleteNodeFromDisk(node: INode<any>): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            return fs.unlink(path.resolve(this.dir, node.uuid), err => err ? reject(err) : resolve());
        });
    }
    
    /**
     * Indicates that a given node should be delete from disk soon.
     * @param node the node to remove
     */
    public abstract removeNode(node: N): void;
    
    /**
     * deletes the for removing labeled nodes (@see deleteNodeFromDisk) from disk
     * @returns a Promise indicating the success / failure of deletion
     * @throws Promise.reject, if file deletion failes
     */
    protected abstract deleteRemovedNodes(): Promise<void>;
    
    /**
     * @return JSON representation for JS-internal logging
     */
    public toJSON(): string {
        return this.root.toJSON();
    }
    
    /**
     * the tree's root node
     */
    public get root(): N {
        return this._root;
    }
    
    public set root(r: N) {
        r.uuid = "ROOT";
        this._root = r;
    }
    
    /**
     * creates a new UUID for use as Node.uuid.
     * @returns the uuid
     */
    public uuid(): string {
        let id = uuid.v1();
        if(this.dir) {
            while(this.uuidExists(id)) {
                id = uuid.v1();
            }
        }
        
        return id;
    }
    
    /**
     * checks if the given uuid is already used for a node on disk or in memory
     */
    protected uuidExists(uuid: string): boolean {
        return fs.existsSync(path.resolve(this.dir, uuid));
    }
    
}