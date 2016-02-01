export enum NodeState {
    DEFAULT,
    CHANGED
}

export interface INode<T> {
    
    /**
     * order of the Node
     */
    m: number;
    
    /**
     * current NodeState (e.g. "DEFAULT" | "CHANGED")
     */
    state: NodeState;
    
    /**
     * Unique ID, used for saving Node to File or identify parent / childnodes
     */
    uuid: string;
    
    /**
     * json representation for persisting node to disk (at least keys and childIDs)
     */
    json: string;
    
    /**
     * indicates if the node (keys, children, etc.) is already loaded from disk
     */
    loaded: boolean;
    
    /**
     * insert value into this(!) node
     * @param value the value to insert
     * @returns Promise indicating that inserting the value has completed
     */
    insert(value: T): Promise<void>;
    
    /**
     * Delete the given value(key) from this(!) node
     * @return a Promise indicating the success / failure of deletion
     * @throws Promise.reject, if the value for deletion could not be removed from this node's keys
     */
    delete(value: T): Promise<void>;
    
    /**
     * Finds a value in this node's keys and the keys of its ancestors
     * @returns a Promise containing the found key
     * @throws Promise.reject, if the key could not be found 
     */
    find(value: T): Promise<T>;
    
    /**
     * Loads the node from disk where filename = this.uuid
     * @param recursive if set tu true, all ancestors of this node gets loaded, too
     * @returns return this node after it has loaded
     */
    load(recursive?: boolean): Promise<this>;
    
    /**
     * finds the leaf for inserting the value
     * @param value the value to insert in the found leaf
     * @returns the leaf where the given value should be inserted
     * @throws Promise.reject if tree this or its ancestors already contain value 
     */
    findLeaf(value: T): Promise<this>;
    
    /**
     * finds the node containing the given value (key) in this node and its ancestors
     * @param value the value / key to look for
     * @returns the node, if found
     * @throws Promise.reject, if no node could be found
     */
    findNode(value: T): Promise<this>;
    
    /**
     * @return JSON representation for JS-internal logging
     */
    toJSON(): string;
    
}