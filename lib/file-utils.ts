import mammoth from "mammoth";

export async function readFileAsText(file: File): Promise<string> {
  const allowed = [
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowed.includes(file.type)) {
    throw new Error("Only .txt, .doc, .docx allowed");
  }

  if (file.type === "text/plain") {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = (e) => res(e.target?.result as string);
      r.onerror = rej;
      r.readAsText(file);
    });
  }

  const buf = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
  return value;
}

export function setupDragAndDrop(el: HTMLElement, onDrop: (files: File[]) => void) {
  el.addEventListener("dragover", (e) => {
    e.preventDefault();
    el.classList.add("border-purple-400", "bg-purple-50");
  });
  el.addEventListener("dragleave", () => {
    el.classList.remove("border-purple-400", "bg-purple-50");
  });
  el.addEventListener("drop", (e) => {
    e.preventDefault();
    el.classList.remove("border-purple-400", "bg-purple-50");
    onDrop(Array.from(e.dataTransfer!.files));
  });
}