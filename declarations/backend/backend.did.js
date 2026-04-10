export const idlFactory = ({ IDL }) => {
  const FileMetadata = IDL.Record({
    'id' : IDL.Text,
    'originalFilename' : IDL.Text,
    'size' : IDL.Nat,
    'downloadLink' : IDL.Text,
    'filePath' : IDL.Text,
    'uploadTimestamp' : IDL.Int,
    'encryptionKey' : IDL.Text,
  });
  const FileReference = IDL.Record({ 'hash' : IDL.Text, 'path' : IDL.Text });
  return IDL.Service({
    'deleteFile' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'dropFileReference' : IDL.Func([IDL.Text], [], []),
    'getFileMetadata' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(FileMetadata)],
        ['query'],
      ),
    'getFileReference' : IDL.Func([IDL.Text], [FileReference], ['query']),
    'listAllFiles' : IDL.Func([], [IDL.Vec(FileMetadata)], ['query']),
    'listFileReferences' : IDL.Func([], [IDL.Vec(FileReference)], ['query']),
    'registerFileReference' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'saveFileMetadata' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat, IDL.Text, IDL.Text],
        [IDL.Text],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
