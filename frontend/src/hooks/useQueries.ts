import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { FileMetadata } from '../backend';

export function useListAllFiles() {
  const { actor, isFetching } = useActor();

  return useQuery<FileMetadata[]>({
    queryKey: ['files'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listAllFiles();
      } catch (error) {
        console.error('Error fetching files:', error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    retry: 2,
  });
}

export function useGetFileMetadata(fileId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<FileMetadata | null>({
    queryKey: ['file', fileId],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const result = await actor.getFileMetadata(fileId);
        return result;
      } catch (error) {
        console.error('Error fetching file metadata:', error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !!fileId,
    retry: 2,
  });
}

export function useSaveFileMetadata() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      originalFilename,
      size,
      filePath,
      encryptionKey,
    }: {
      id: string;
      originalFilename: string;
      size: bigint;
      filePath: string;
      encryptionKey: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      try {
        return await actor.saveFileMetadata(id, originalFilename, size, filePath, encryptionKey);
      } catch (error) {
        console.error('Error saving metadata:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  return {
    saveMetadata: async (
      id: string,
      originalFilename: string,
      size: bigint,
      filePath: string,
      encryptionKey: string
    ) => {
      return mutation.mutateAsync({ id, originalFilename, size, filePath, encryptionKey });
    },
    isSaving: mutation.isPending,
  };
}

export function useDeleteFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (fileId: string) => {
      if (!actor) throw new Error('Actor not initialized');
      try {
        const success = await actor.deleteFile(fileId);
        if (!success) {
          throw new Error('File not found or already deleted');
        }
        return success;
      } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  return {
    deleteFile: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}

