import { type HttpAgentOptions, type ActorConfig, type Agent } from "@dfinity/agent";
import type { Principal } from "@dfinity/principal";
import { CreateActorOptions } from "declarations/backend";
import { _SERVICE } from "declarations/backend/backend.did.d.js";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface FileMetadata {
    id: string;
    originalFilename: string;
    size: bigint;
    downloadLink: string;
    filePath: string;
    uploadTimestamp: bigint;
    encryptionKey: string;
}
export interface FileReference {
    hash: string;
    path: string;
}
export declare const createActor: (canisterId: string | Principal, options?: CreateActorOptions, processError?: (error: unknown) => never) => backendInterface;
export declare const canisterId: string;
export interface backendInterface {
    deleteFile(id: string): Promise<boolean>;
    dropFileReference(path: string): Promise<void>;
    getFileMetadata(id: string): Promise<FileMetadata | null>;
    getFileReference(path: string): Promise<FileReference>;
    listAllFiles(): Promise<Array<FileMetadata>>;
    listFileReferences(): Promise<Array<FileReference>>;
    registerFileReference(path: string, hash: string): Promise<void>;
    saveFileMetadata(id: string, originalFilename: string, size: bigint, filePath: string, encryptionKey: string): Promise<string>;
}

