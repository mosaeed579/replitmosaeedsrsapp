import { useMemo, useState } from 'react';
import { Bug, RefreshCw, Database, Folder, ShieldAlert, Trash2, Search, Download, CheckSquare2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';


import { getStorageDebugInfo, getData } from '@/lib/storage';
import { safeCleanup, type OrphanDiskFile } from '@/lib/fileCleanup';
import { isNativePlatform } from '@/lib/platform';

interface FileInfo {
  name: string;
  size?: number;
}

interface DebugInfo {
  platform: string;
  storageType: string;
  dataSize: string;
  files: FileInfo[];
  preferencesData: string | null;
  attachmentCount: number;
  totalAttachmentSize: string;
}

const formatSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const DebugStorageDialog = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Safe cleanup state
  const [lessonsLoaded, setLessonsLoaded] = useState(false);
  const [lessonCount, setLessonCount] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [orphanedFiles, setOrphanedFiles] = useState<OrphanDiskFile[]>([]);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [cleanupLog, setCleanupLog] = useState<string>('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmFiles, setConfirmFiles] = useState<OrphanDiskFile[]>([]);

  const selectedFiles = useMemo(() => {
    const set = new Set(selectedNames);
    return orphanedFiles.filter(f => set.has(f.name));
  }, [orphanedFiles, selectedNames]);

  const loadDebugInfo = async () => {
    setLoading(true);
    try {
      const info = await getStorageDebugInfo();
      setDebugInfo(info);

      // SAFETY UI: We only enable scanning after Preferences has been read
      const appData = await getData();
      const count = appData.lessons?.length || 0;
      setLessonCount(count);
      setLessonsLoaded(count > 0);

      // Reset scan results on refresh
      setOrphanedFiles([]);
      setSelectedNames([]);
      setCleanupLog('');
    } catch (error) {
      console.error('Failed to load debug info:', error);
    } finally {
      setLoading(false);
    }
  };

  const runSafeScan = async () => {
    if (!lessonsLoaded) {
      return;
    }

    setScanning(true);
    try {
      const result = await safeCleanup({ action: 'scan' });
      setCleanupLog(result.log);

      if (result.status === 'aborted') {
        setOrphanedFiles([]);
        setSelectedNames([]);
        return;
      }

      setOrphanedFiles(result.orphanedFiles);
      setSelectedNames([]);
    } catch (error) {
      console.error('Safe scan failed:', error);
    } finally {
      setScanning(false);
    }
  };

  const openDeleteConfirm = (files: OrphanDiskFile[]) => {
    if (files.length === 0) {
      return;
    }
    setConfirmFiles(files);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setConfirmOpen(false);
    setDeleting(true);

    try {
      const result = await safeCleanup({ action: 'delete', requestedFiles: confirmFiles });
      setCleanupLog(result.log);

      if (result.status === 'aborted') {
        return;
      }

      // Refresh debug numbers + clear list; user can re-scan
      await loadDebugInfo();
    } catch (error) {
      console.error('Safe delete failed:', error);
    } finally {
      setDeleting(false);
      setConfirmFiles([]);
    }
  };

  const toggleSelected = (name: string, checked: boolean) => {
    setSelectedNames(prev => {
      const next = new Set(prev);
      if (checked) next.add(name);
      else next.delete(name);
      return Array.from(next);
    });
  };

  const handleSelectAll = () => {
    setSelectedNames(orphanedFiles.map(f => f.name));
  };

  const handleClearSelection = () => {
    setSelectedNames([]);
  };

  const handleDownloadLog = async () => {
    if (!cleanupLog) {
      return;
    }

    const filename = `cleanup-log-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;

    try {
      if (isNativePlatform()) {
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');

        await Filesystem.writeFile({
          path: filename,
          data: cleanupLog,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        const fileUri = await Filesystem.getUri({ path: filename, directory: Directory.Cache });

        await Share.share({
          title: 'Cleanup Log',
          text: 'Orphaned files scan/delete log',
          files: [fileUri.uri],
          dialogTitle: 'Share Cleanup Log',
        });
      } else {
        const blob = new Blob([cleanupLog], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Failed to export cleanup log:', e);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      loadDebugInfo();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Bug className="w-4 h-4 mr-2" />
            Debug Storage
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Bug className="w-5 h-5 text-primary" />
              Storage Debug
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 p-6 overflow-auto max-h-[calc(90vh-80px)]">
            {/* Left Column - Stats & Actions */}
            <div className="lg:w-72 flex-shrink-0 space-y-4">
              <Button
                variant="outline"
                size="sm"
                onClick={loadDebugInfo}
                disabled={loading || scanning || deleting}
                className="w-full"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Refresh Data'}
              </Button>

              {debugInfo && (
                <div className="space-y-4">
                  {/* Storage Stats Card */}
                  <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Database className="w-4 h-4 text-primary" />
                      Storage Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <div className="text-2xl font-bold text-foreground">{debugInfo.attachmentCount}</div>
                        <div className="text-xs text-muted-foreground">Files on Disk</div>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <div className="text-2xl font-bold text-foreground">{lessonCount}</div>
                        <div className="text-xs text-muted-foreground">Lessons Loaded</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><strong>Total size:</strong> {debugInfo.totalAttachmentSize}</p>
                      <p><strong>Preferences:</strong> {debugInfo.dataSize}</p>
                    </div>
                  </div>

                  {/* Actions Card */}
                  <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Search className="w-4 h-4 text-primary" />
                      Cleanup Actions
                    </h3>
                    
                    {!lessonsLoaded && (
                      <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 rounded-lg px-3 py-2">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Lessons not loaded - scan disabled</span>
                      </div>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={runSafeScan}
                      disabled={scanning || deleting || !lessonsLoaded}
                      className="w-full"
                    >
                      <Search className={`w-4 h-4 mr-2 ${scanning ? 'animate-pulse' : ''}`} />
                      {scanning ? 'Scanning…' : 'Scan for Orphaned Files'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadLog}
                      disabled={!cleanupLog}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Cleanup Log
                    </Button>
                  </div>

                  {/* Files List Card */}
                  <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Folder className="w-4 h-4 text-primary" />
                      All Files ({debugInfo.files.length})
                    </h3>
                    <ScrollArea className="h-[120px]">
                      <div className="text-xs font-mono space-y-1 pr-3">
                        {debugInfo.files.length === 0 ? (
                          <p className="text-muted-foreground italic">No files found</p>
                        ) : (
                          debugInfo.files.map((file, index) => (
                            <div
                              key={index}
                              className="p-2 bg-muted/30 rounded-lg flex justify-between gap-2"
                            >
                              <span className="min-w-0 flex-1 truncate">{file.name}</span>
                              {file.size != null && (
                                <span className="text-muted-foreground">{formatSize(file.size)}</span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Orphaned Files */}
            <div className="flex-1 min-w-0 mt-6 lg:mt-0">
              {orphanedFiles.length > 0 ? (
                <div className="rounded-xl border border-border bg-card/50 p-4 space-y-4 h-full">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-destructive" />
                      Orphaned Files ({orphanedFiles.length})
                    </h3>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={handleSelectAll} className="h-8 px-2">
                        <CheckSquare2 className="w-4 h-4 mr-1" />
                        All
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleClearSelection} className="h-8 px-2">
                        <Square className="w-4 h-4 mr-1" />
                        None
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="h-[280px] lg:h-[320px] rounded-lg border border-border">
                    <div className="p-2 space-y-1">
                      {orphanedFiles.map(file => {
                        const checked = selectedNames.includes(file.name);
                        return (
                          <label
                            key={file.path}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                              checked ? 'bg-destructive/10 border border-destructive/30' : 'hover:bg-muted/50 border border-transparent'
                            }`}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => toggleSelected(file.name, Boolean(v))}
                              aria-label={`Select ${file.name}`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-foreground truncate">{file.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{file.path}</div>
                            </div>
                            <div className="text-xs font-medium text-muted-foreground">{formatSize(file.size)}</div>
                          </label>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      variant="destructive"
                      onClick={() => openDeleteConfirm(selectedFiles)}
                      disabled={deleting || selectedFiles.length === 0}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected ({selectedFiles.length})
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => openDeleteConfirm(orphanedFiles)}
                      disabled={deleting || orphanedFiles.length === 0}
                      className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All ({orphanedFiles.length})
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 h-full flex flex-col items-center justify-center text-center">
                  <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-sm font-medium text-foreground mb-1">No Orphaned Files</h3>
                  <p className="text-xs text-muted-foreground max-w-[200px]">
                    {cleanupLog ? 'Last scan found no orphaned files.' : 'Run a scan to check for orphaned files.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmFiles.length} files?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent. Files are verified as orphaned before deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={handleDownloadLog} disabled={!cleanupLog}>
              <Download className="w-4 h-4 mr-2" />
              Export Log
            </Button>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Files
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DebugStorageDialog;
