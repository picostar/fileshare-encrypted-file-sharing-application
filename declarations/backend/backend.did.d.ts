import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface FileMetadata {
  'id' : string,
  'originalFilename' : string,
  'size' : bigint,
  'downloadLink' : string,
  'filePath' : string,
  'uploadTimestamp' : bigint,
  'encryptionKey' : string,
}
export interface FileReference { 'hash' : string, 'path' : string }
export interface _SERVICE {
  'deleteFile' : ActorMethod<[string], boolean>,
  'dropFileReference' : ActorMethod<[string], undefined>,
  'getFileMetadata' : ActorMethod<[string], [] | [FileMetadata]>,
  'getFileReference' : ActorMethod<[string], FileReference>,
  'listAllFiles' : ActorMethod<[], Array<FileMetadata>>,
  'listFileReferences' : ActorMethod<[], Array<FileReference>>,
  'registerFileReference' : ActorMethod<[string, string], undefined>,
  'saveFileMetadata' : ActorMethod<
    [string, string, bigint, string, string],
    string
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
