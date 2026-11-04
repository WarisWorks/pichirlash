import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { backupFileName, makeBackup, parseBackup, restoreBackup } from "@/lib/uyghur/backup";
import type { Backup } from "@/lib/uyghur/backup";

/** Save all local data to a file, or bring it back on another device. */
export default function BackupPanel() {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Backup | null>(null),
    [status, setStatus] = useState("");
  const save = () => {
    try {
      const backup = makeBackup(localStorage);
      const blob = new Blob([JSON.stringify(backup, null, 1)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = backupFileName(backup.created);
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setStatus(`${Object.keys(backup.data).length} خىل مەزمۇن ساقلاندى.`);
    } catch {
      setStatus("زاپاس ھۆججەت تەييارلانمىدى. توركۆرگۈچ ساقلاش بوشلۇقىنى تەكشۈرۈڭ.");
    }
  };
  const read = async (file: File) => {
    if (file.size > 5_000_000) {
      setStatus("ھۆججەت بەك چوڭ.");
      return;
    }
    const backup = parseBackup(await file.text());
    setPending(backup);
    setStatus(backup ? "" : "بۇ ھۆججەت پىچىرلاش زاپىسى ئەمەس ياكى بۇزۇلغان.");
  };
  const apply = (mode: "replace" | "merge") => {
    if (!pending) return;
    try {
      restoreBackup(localStorage, pending, mode);
      setStatus("ئەسلىگە كەلتۈرۈلدى. بەت قايتا يۈكلىنىۋاتىدۇ…");
      setTimeout(() => window.location.reload(), 600);
    } catch {
      setStatus("ئەسلىگە كەلتۈرگىلى بولمىدى؛ ساقلاش بوشلۇقى تولغان بولۇشى مۇمكىن.");
    }
  };
  return (
    <div className="backup-panel">
      <p>زاپاسلاش</p>
      <div className="backup-actions">
        <button type="button" onClick={save}>
          <Download size={16} /> ھەممىنى ھۆججەتكە ساقلاش
        </button>
        <button type="button" onClick={() => input.current?.click()}>
          <Upload size={16} /> زاپاستىن ئەسلىگە كەلتۈرۈش
        </button>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void read(file);
            e.target.value = "";
          }}
        />
      </div>
      {pending && (
        <div className="backup-confirm" role="alertdialog" aria-label="ئەسلىگە كەلتۈرۈشنى جەزملەش">
          <span>
            {pending.created.slice(0, 10)} دىكى زاپاس · {Object.keys(pending.data).length} خىل مەزمۇن
          </span>
          <button type="button" onClick={() => apply("merge")}>
            قوشۇپ بىرلەشتۈرۈش
          </button>
          <button type="button" onClick={() => apply("replace")}>
            ھازىرقىنى ئالماشتۇرۇش
          </button>
          <button type="button" onClick={() => setPending(null)}>
            بىكار قىلىش
          </button>
        </div>
      )}
      <p role="status" className="local-hint">
        {status}
      </p>
      <p className="local-hint">
        خاتىرە، شېئىر، خەت، باغچا ۋە تەڭشەكلەر ھۆججەتكە كىرىدۇ. ئاۋازلارنى
        «ئائىلە ئاۋازلىرى» دىن ئايرىم چۈشۈرۈڭ.
      </p>
    </div>
  );
}
