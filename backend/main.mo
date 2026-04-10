import Registry "blob-storage/registry";
import Text "mo:base/Text";
import Time "mo:base/Time";
import OrderedMap "mo:base/OrderedMap";
import Iter "mo:base/Iter";

persistent actor FileShare {
  let registry = Registry.new();
  transient let textMap = OrderedMap.Make<Text>(Text.compare);

  var fileMetadata : OrderedMap.Map<Text, FileMetadata> = textMap.empty();

  type FileMetadata = {
    id : Text;
    originalFilename : Text;
    size : Nat;
    uploadTimestamp : Int;
    downloadLink : Text;
    filePath : Text;
    encryptionKey : Text;
  };

  public shared func registerFileReference(path : Text, hash : Text) : async () {
    Registry.add(registry, path, hash);
  };

  public query func getFileReference(path : Text) : async Registry.FileReference {
    Registry.get(registry, path);
  };

  public query func listFileReferences() : async [Registry.FileReference] {
    Registry.list(registry);
  };

  public shared func dropFileReference(path : Text) : async () {
    Registry.remove(registry, path);
  };

  public shared func saveFileMetadata(id : Text, originalFilename : Text, size : Nat, filePath : Text, encryptionKey : Text) : async Text {
    let downloadLink = "https://icp0.io/ipfs/" # id # "?key=" # encryptionKey;
    let metadata : FileMetadata = {
      id;
      originalFilename;
      size;
      uploadTimestamp = Time.now();
      downloadLink;
      filePath;
      encryptionKey;
    };
    fileMetadata := textMap.put(fileMetadata, id, metadata);
    downloadLink;
  };

  public query func getFileMetadata(id : Text) : async ?FileMetadata {
    textMap.get(fileMetadata, id);
  };

  public query func listAllFiles() : async [FileMetadata] {
    Iter.toArray(textMap.vals(fileMetadata));
  };

  public shared func deleteFile(id : Text) : async Bool {
    switch (textMap.get(fileMetadata, id)) {
      case (null) { false };
      case (?metadata) {
        Registry.remove(registry, metadata.filePath);
        fileMetadata := textMap.delete(fileMetadata, id);
        true;
      };
    };
  };
};
