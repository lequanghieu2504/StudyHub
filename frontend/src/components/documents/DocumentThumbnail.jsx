import { FileText } from "lucide-react";

export default function DocumentThumbnail({
  document,
  className = "w-full aspect-[4/3] rounded-xl mb-3 border border-slate-200",
  iconClassName = "w-12 h-12",
}) {
  const thumbnailUrl = document?.thumbnailUrl;

  if (thumbnailUrl) {
    return (
      <div className={`${className} overflow-hidden bg-slate-100`}>
        <img
          src={thumbnailUrl}
          alt={document?.title ? `${document.title} cover` : "Document cover"}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={`${className} bg-slate-50 flex items-center justify-center text-slate-300`}>
      <FileText className={iconClassName} />
    </div>
  );
}
