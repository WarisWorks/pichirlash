import { useState } from "react";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyText } from "@/components/play/imageExport";
import { shareUrl } from "@/lib/uyghur/share";
import type { SharedItem } from "@/lib/uyghur/share";

/** Turns content into a link that carries it in the URL fragment — no server needed. */
export default function ShareLinkButton({
  item,
  disabled,
  label = "ئورتاقلىشىش ئۇلىنىشى",
}: {
  item: () => SharedItem;
  disabled?: boolean;
  label?: string;
}) {
  const [link, setLink] = useState(""),
    [status, setStatus] = useState("");
  const create = async () => {
    let url: string;
    try {
      url = shareUrl(item(), window.location.href.split("#")[0]);
    } catch {
      setLink("");
      setStatus("مەزمۇن بەك ئۇزۇن؛ ئۇلىنىش ئۈچۈن 4,000 ھەرپتىن قىسقا بولسۇن.");
      return;
    }
    setLink(url);
    try {
      await copyText(url);
      setStatus("ئۇلىنىش كۆچۈرۈلدى. ئۇنى خالىغان ئەپتە ئەۋەتەلەيسىز.");
    } catch {
      setStatus("ئۇلىنىشنى تۆۋەندىن تاللاپ كۆچۈرۈڭ.");
    }
  };
  return (
    <div className="share-link">
      <Button type="button" variant="outline" disabled={disabled} onClick={create}>
        <Link2 size={17} /> {label}
      </Button>
      {link && (
        <input
          readOnly
          dir="ltr"
          aria-label="ئورتاقلىشىش ئۇلىنىشى"
          value={link}
          onFocus={(e) => e.currentTarget.select()}
        />
      )}
      <p role="status" className="local-hint">
        {status}
      </p>
      {link && (
        <p className="local-hint">
          مەزمۇن ئۇلىنىشنىڭ ئىچىدە؛ ھېچقانداق مۇلازىمېتىرغا يوللانمايدۇ.
        </p>
      )}
    </div>
  );
}
