import { type HttpAgentOptions, type ActorConfig, type Agent, type ActorSubclass } from "@dfinity/agent";
import type { Principal } from "@dfinity/principal";
import { backend as _backend, createActor as _createActor, canisterId as _canisterId, CreateActorOptions } from "declarations/backend";
import { _SERVICE } from "declarations/backend/backend.did.d.js";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
function some<T>(value: T): Some<T> {
    return {
        __kind__: "Some",
        value: value
    };
}
function none(): None {
    return {
        __kind__: "None"
    };
}
function isNone<T>(option: Option<T>): option is None {
    return option.__kind__ === "None";
}
function isSome<T>(option: Option<T>): option is Some<T> {
    return option.__kind__ === "Some";
}
function unwrap<T>(option: Option<T>): T {
    if (isNone(option)) {
        throw new Error("unwrap: none");
    }
    return option.value;
}
function candid_some<T>(value: T): [T] {
    return [
        value
    ];
}
function candid_none<T>(): [] {
    return [];
}
function record_opt_to_undefined<T>(arg: T | null): T | undefined {
    return arg == null ? undefined : arg;
}
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
export function createActor(canisterId: string | Principal, options?: CreateActorOptions, processError?: (error: unknown) => never): backendInterface {
    const actor = _createActor(canisterId, options);
    return new Backend(actor, processError);
}
export const canisterId = _canisterId;
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
import type { FileMetadata as _FileMetadata } from "declarations/backend/backend.did.d.ts";
class Backend implements backendInterface {
    private actor: ActorSubclass<_SERVICE>;
    constructor(actor?: ActorSubclass<_SERVICE>, private processError?: (error: unknown) => never){
        this.actor = actor ?? _backend;
    }
    async deleteFile(arg0: string): Promise<boolean> {
        if (this.processError) {
            try {
                const result = await this.actor.deleteFile(arg0);
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.deleteFile(arg0);
            return result;
        }
    }
    async dropFileReference(arg0: string): Promise<void> {
        if (this.processError) {
            try {
                const result = await this.actor.dropFileReference(arg0);
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.dropFileReference(arg0);
            return result;
        }
    }
    async getFileMetadata(arg0: string): Promise<FileMetadata | null> {
        if (this.processError) {
            try {
                const result = await this.actor.getFileMetadata(arg0);
                return from_candid_opt_n1(result);
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.getFileMetadata(arg0);
            return from_candid_opt_n1(result);
        }
    }
    async getFileReference(arg0: string): Promise<FileReference> {
        if (this.processError) {
            try {
                const result = await this.actor.getFileReference(arg0);
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.getFileReference(arg0);
            return result;
        }
    }
    async listAllFiles(): Promise<Array<FileMetadata>> {
        if (this.processError) {
            try {
                const result = await this.actor.listAllFiles();
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.listAllFiles();
            return result;
        }
    }
    async listFileReferences(): Promise<Array<FileReference>> {
        if (this.processError) {
            try {
                const result = await this.actor.listFileReferences();
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.listFileReferences();
            return result;
        }
    }
    async registerFileReference(arg0: string, arg1: string): Promise<void> {
        if (this.processError) {
            try {
                const result = await this.actor.registerFileReference(arg0, arg1);
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.registerFileReference(arg0, arg1);
            return result;
        }
    }
    async saveFileMetadata(arg0: string, arg1: string, arg2: bigint, arg3: string, arg4: string): Promise<string> {
        if (this.processError) {
            try {
                const result = await this.actor.saveFileMetadata(arg0, arg1, arg2, arg3, arg4);
                return result;
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        } else {
            const result = await this.actor.saveFileMetadata(arg0, arg1, arg2, arg3, arg4);
            return result;
        }
    }
}
export const backend: backendInterface = new Backend();
function from_candid_opt_n1(value: [] | [_FileMetadata]): FileMetadata | null {
    return value.length === 0 ? null : value[0];
}

