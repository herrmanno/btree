import {INode} from "./inode"

export type CompareNodes<T> = (a:T, b:T) => number;

export interface ITree<T, N extends INode<T>> {
    
    root: N;
    
    /**
     * the directory where the tree saves its files
     */
    dir: string;
    
    /**
     * function used for comparing two keys
     */
    compare: CompareNodes<T>;
    
    insert(value: T): Promise<any>;
    
    delete(value: T): Promise<any>;
    
    find(value: T): Promise<T>;
    
    removeNode(node: INode<T>): void;
    
    createNode(): N;
    
    uuid(): string;
    
}